// Vercel serverless function: «ابن صفحتي». Gemini designs a page from the owner's Wee AI answers,
// following Eyad's weelink-designer constitution (src/data/ai/weelinkDesigner.json) and the ready
// slides of the catalogue (src/data/ai/buildCatalog.json, written by `npm run ai-catalog`).
//
//   POST /api/build-page   { kind, profile, assets }  with  Authorization: Bearer <Firebase ID token>
//     → { plan }   (checked against the catalogue; the browser builds the slides from it)
//
// The ready slides are examples, not forms to fill (Eyad, 12 Oct): Gemini picks the sections and
// their order for the business, an example slide for each, the texts at their natural length, how
// many cards, rows and figures a list has, an icon per card, the tone of each section, its entrance
// animation and the photo searches. The browser lays the elements out (src/services/pageBuilder.ts),
// so Gemini never writes coordinates. Every answer is checked here before it reaches the page
// (unknown slides, slots or icons, over-long texts, emoji and AI wording, invented prices or
// figures, outside links, unknown palettes, fonts or animations).
// The Gemini key lives only in the Vercel environment variable GEMINI_API_KEY.
//
// Usage limits (once per free page, 5 a day on paid pages) come with the subscriptions phase: every
// account today is a test account with unlimited use.

import { GoogleGenAI } from '@google/genai';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import catalog from '../src/data/ai/buildCatalog.json' with { type: 'json' };
import designer from '../src/data/ai/weelinkDesigner.json' with { type: 'json' };
import iconList from '../src/data/ai/buildIcons.json' with { type: 'json' };

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const MAX_FIELD = 1200;

type Kind = 'free' | 'restaurant' | 'shop' | 'cars';
const KINDS: Kind[] = ['free', 'restaurant', 'shop', 'cars'];

interface SlotSpec {
  kind: 'text' | 'button' | 'image';
  max?: number;
}
interface ListSpec {
  count: number;
  fields: Record<string, number | 'icon'>;
}
interface TemplateSpec {
  name: string;
  slots: Record<string, SlotSpec>;
  lists: Record<string, ListSpec>;
}
interface Section {
  id: string;
  name: string;
  required: boolean;
  place: 'first' | 'last' | 'any';
  templates: string[];
}
const TEMPLATES = catalog.templates as unknown as Record<string, TemplateSpec>;
const SECTIONS = catalog.sections as Record<Kind, Section[]>;
const PALETTES = catalog.palettes as Record<string, { name: string; colors: string[] }>;
const FONTS = catalog.fonts as Record<string, { head: string; body: string }>;
const LIST_MAX = catalog.listMax as number;
const ICONS = new Set(iconList as string[]);
const ENTRANCES = ['none', 'fade', 'slide-up', 'slide-left', 'slide-right', 'scale-up'];
const TONES = ['light', 'tint', 'dark'] as const;

export interface Assets {
  heroBg: boolean;
  gallery: number;
  logo: boolean;
}

export interface PlannedSection {
  section: string;
  template: string;
  tone: (typeof TONES)[number];
  slots: Record<string, string>; // single slots and list items (points.3.title …)
  icons: Record<string, string>; // points.0.icon → mdi:…
  links: Record<string, string>;
  images: Record<string, string>;
  entrance: string; // an editor animation, or 'none'
}

export interface Plan {
  palette: string;
  fonts: string;
  accentColor?: string;
  motion: boolean; // «تأثيرات حركية وبصرية»
  sections: PlannedSection[];
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const clip = (v: unknown, n = MAX_FIELD) => (typeof v === 'string' ? v.slice(0, n) : '');

// The owner's answers, kept to plain short strings.
const cleanProfile = (raw: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 30)) {
    if (typeof v === 'string' && v.trim()) out[k.slice(0, 40)] = clip(v.trim());
  }
  return out;
};

const cleanAssets = (raw: any): Assets => ({
  heroBg: !!raw?.heroBg,
  gallery: Math.max(0, Math.min(5, Math.floor(Number(raw?.gallery) || 0))),
  logo: !!raw?.logo,
});

// A Firebase ID token is valid when Google's identity service can look up its user.
const isSignedIn = async (request: Request) => {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { users?: unknown[] };
  return !!data.users?.length;
};

// ---------- The check (the constitution's rules Weelink can test in code) ----------

// Emoji and pictographs (constitution §4: no AI emoji slop), and the ✓ ★ kind of marks.
const EMOJI = /[\p{Extended_Pictographic}☀-➿⬀-⯿️]/gu;
// AI meta wording (§4: no AI badges or texts).
const AI_WORDS = /((?:بـ?|و)?(?:ال)?ذكاء\s*(?:ال)?اصطناعي|توليد ذكي|مصمم بالذكاء|AI\s*Design|Wee AI|\bAI\b|Gemini)/gi;
const ON_REQUEST = 'حسب الطلب';

const cleanText = (v: unknown, max: number) =>
  clip(v, 2000).replace(EMOJI, '').replace(AI_WORDS, '').replace(/[*_#`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max).trim();

const digitsIn = (s: string) => (s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).match(/\d+/g) || []).map((d) => d.replace(/^0+(?=\d)/, ''));

// A price or figure is kept only when the owner wrote its numbers (§3 and «لا تخترع أرقاماً»).
const ownersNumbers = (profile: Record<string, string>) => {
  const text = Object.values(profile).join(' ').replace(/[,،.]/g, '');
  return new Set(digitsIn(text));
};
const numbersAreOwners = (value: string, owners: Set<string>) => {
  const found = digitsIn(value.replace(/[,،.]/g, ''));
  return found.length > 0 && found.every((d) => owners.has(d));
};

const LINKS = /^(whatsapp|phone|page:(menu|products|cars|cart|contact)|slide:\d{1,2})$/;
const IMAGE_QUERY = /^[a-z0-9][a-z0-9 ,\-]{1,78}$/i;
// Package features keep the example's places: any package, up to six features.
const FEATURE = /^packages\.(\d)\.features\.([0-5])$/;

const pairs = (raw: unknown, valueKey: string): [string, string][] =>
  Array.isArray(raw)
    ? raw.slice(0, 200).filter((p) => p && typeof p.key === 'string').map((p) => [p.key.trim(), typeof p[valueKey] === 'string' ? p[valueKey] : ''])
    : [];

// What a key may hold in this example slide: its kind and character limit, or null.
const specOf = (t: TemplateSpec, key: string): { kind: 'text' | 'button' | 'image' | 'icon'; max: number } | null => {
  const single = t.slots[key];
  if (single) return { kind: single.kind, max: single.max || 120 };
  if (FEATURE.test(key) && +FEATURE.exec(key)![1] < LIST_MAX && t.lists.packages) return { kind: 'text', max: 50 };
  const m = /^([a-z]+)\.(\d{1,2})(?:\.([a-z]+))?$/.exec(key);
  const list = m && t.lists[m[1]];
  if (!list || +m![2] >= LIST_MAX) return null;
  const field = list.fields[m![3] || ''];
  if (field === undefined) return null;
  return field === 'icon' ? { kind: 'icon', max: 40 } : { kind: 'text', max: field };
};

/** Gemini's answer checked against the catalogue: only what Weelink can build safely comes back. */
export const checkPlan = (raw: any, kind: Kind, profile: Record<string, string>, assets: Assets): Plan => {
  const owners = ownersNumbers(profile);
  const motion = /حرك/.test(profile['الحركة'] || '') && !/هادئ/.test(profile['الحركة'] || '');
  const hasServices = !!profile['الخدمات'];
  const description = profile['الوصف'] || '';
  // «من نحن» tells the owner's own description (Eyad, 12 Oct), so it is on every page that has one.
  const pool = SECTIONS[kind]
    .filter((s) => (s.id === 'prices' ? hasServices : s.id === 'gallery' ? assets.gallery > 0 : true))
    .map((s) => (s.id === 'about' && description ? { ...s, required: true } : s));
  const answered: any[] = Array.isArray(raw?.sections) ? raw.sections : [];

  // The AI's order, each section once; then any required one it left out.
  const chosen: { section: Section; given: any }[] = [];
  for (const given of answered) {
    const section = pool.find((s) => s.id === given?.section) || pool.find((s) => s.templates.includes(given?.template) && !chosen.some((c) => c.section === s));
    if (section && !chosen.some((c) => c.section === section)) chosen.push({ section, given });
  }
  for (const section of pool) if (section.required && !chosen.some((c) => c.section === section)) chosen.push({ section, given: null });
  const rank = (s: Section) => (s.place === 'first' ? 0 : s.place === 'last' ? 2 + pool.indexOf(s) / 100 : 1);
  chosen.sort((a, b) => rank(a.section) - rank(b.section));

  const sections: PlannedSection[] = chosen.map(({ section, given }) => {
    const template = section.templates.includes(given?.template) ? given.template : section.templates[0];
    const spec = TEMPLATES[template];
    const slots: Record<string, string> = {};
    for (const [key, value] of pairs(given?.slots, 'value')) {
      const s = specOf(spec, key);
      if (!s || s.kind === 'image' || s.kind === 'icon') continue;
      let text = cleanText(value, s.max);
      const leaf = key.split('.').pop();
      if (leaf === 'price' && text && text !== ON_REQUEST && !numbersAreOwners(text, owners)) text = ON_REQUEST;
      if (leaf === 'number' && text && !numbersAreOwners(text, owners)) text = '';
      slots[key] = text;
    }
    for (const key of Array.isArray(given?.hide) ? given.hide.slice(0, 60) : []) {
      if (typeof key === 'string' && specOf(spec, key)) slots[key] = '';
    }
    // A section the AI left out still opens with its name.
    if (!given && spec.slots.title) slots.title = section.name;
    // «من نحن» without its text says the owner's description as they wrote it.
    const story = spec.slots.text ? 'text' : spec.slots.sub ? 'sub' : null;
    if (section.id === 'about' && story && description && !slots[story]) slots[story] = cleanText(description, spec.slots[story].max || 240);
    const icons: Record<string, string> = {};
    for (const [key, value] of pairs(given?.icons, 'value')) {
      if (specOf(spec, key)?.kind === 'icon' && ICONS.has(value.trim())) icons[key] = value.trim();
    }
    const links: Record<string, string> = {};
    for (const [key, to] of pairs(given?.links, 'to')) {
      if (spec.slots[key]?.kind === 'button' && LINKS.test(to)) links[key] = to;
    }
    const images: Record<string, string> = {};
    for (const [key, ref] of pairs(given?.images, 'ref')) {
      if (spec.slots[key]?.kind !== 'image') continue;
      const gallery = /^user:gallery:(\d)$/.exec(ref);
      if (ref === 'user:heroBg' ? assets.heroBg : ref === 'user:logo' ? assets.logo : gallery ? +gallery[1] >= 1 && +gallery[1] <= assets.gallery : IMAGE_QUERY.test(ref.trim())) {
        images[key] = ref.trim();
      }
    }
    const tone = TONES.includes(given?.tone) ? given.tone : 'light';
    const entrance = motion && ENTRANCES.includes(given?.entrance) ? given.entrance : motion ? 'fade' : 'none';
    return { section: section.id, template, tone, slots, icons, links, images, entrance };
  });

  // Buttons may lead only to sections that are on the page.
  for (const s of sections) {
    for (const [key, to] of Object.entries(s.links)) {
      const n = /^slide:(\d+)$/.exec(to);
      if (n && +n[1] >= sections.length) delete s.links[key];
    }
  }
  // No two dark sections in a row.
  sections.forEach((s, i) => {
    if (i > 0 && s.tone === 'dark' && sections[i - 1].tone === 'dark') s.tone = 'tint';
  });

  const accent = /^#[0-9a-f]{6}$/i.test(profile['اللون_المفضل_رمز'] || '') ? profile['اللون_المفضل_رمز'] : /^#[0-9a-f]{6}$/i.test(raw?.accentColor) ? raw.accentColor : undefined;
  return {
    palette: PALETTES[raw?.palette] ? raw.palette : Object.keys(PALETTES)[0],
    fonts: FONTS[raw?.fonts] ? raw.fonts : Object.keys(FONTS)[0],
    ...(accent ? { accentColor: accent } : {}),
    motion,
    sections,
  };
};

// ---------- The prompt ----------

// The catalogue as Gemini reads it: each section of this page type with its example slides, their
// single slots (number = character limit, button:N, image) and their lists (fields and limits).
const catalogFor = (kind: Kind, hasServices: boolean, assets: Assets) =>
  SECTIONS[kind]
    .filter((s) => (s.id === 'prices' ? hasServices : s.id === 'gallery' ? assets.gallery > 0 : true))
    .map((s) => ({
      section: s.id,
      name: s.name,
      required: s.required,
      place: s.place,
      templates: s.templates.map((t) => ({
        template: t,
        name: TEMPLATES[t].name,
        slots: Object.fromEntries(Object.entries(TEMPLATES[t].slots).map(([k, v]) => [k, v.kind === 'text' ? v.max : `${v.kind}${v.max ? `:${v.max}` : ''}`])),
        ...(Object.keys(TEMPLATES[t].lists).length
          ? { lists: Object.fromEntries(Object.entries(TEMPLATES[t].lists).map(([k, v]) => [k, { exampleCount: v.count, fields: v.fields }])) }
          : {}),
      })),
    }));

// One worked example of the answer's shape and quality (a dentist), to learn from, not to copy.
const EXAMPLE = {
  palette: 'modern-azure',
  fonts: 'alexandria-almarai',
  sections: [
    {
      section: 'intro', template: 'hero.split', tone: 'light', entrance: 'fade',
      slots: [
        { key: 'eyebrow', value: 'طب أسنان تجميلي في حمص' },
        { key: 'title', value: 'عيادة د. سلمى الأحمد' },
        { key: 'sub', value: 'ابتسامة مرتاحة بخطة علاج واضحة من أول زيارة، وتكلفة معروفة قبل ما نبدأ.' },
        { key: 'chips.0', value: 'تقويم شفاف' }, { key: 'chips.1', value: 'تبييض' },
        { key: 'cta', value: 'احجز موعدك' }, { key: 'whatsapp', value: 'واتساب' },
      ],
      links: [{ key: 'cta', to: 'slide:2' }, { key: 'whatsapp', to: 'whatsapp' }],
      images: [{ key: 'image', ref: 'dentist smiling patient bright modern clinic' }],
    },
    {
      section: 'services', template: 'about.points', tone: 'tint', entrance: 'slide-up',
      slots: [
        { key: 'title', value: 'شو منعالج' },
        { key: 'points.0.title', value: 'تقويم الأسنان' }, { key: 'points.0.text', value: 'تقويم شفاف أو تقليدي حسب حالتك، مع متابعة شهرية.' },
        { key: 'points.1.title', value: 'تبييض بجلسة وحدة' }, { key: 'points.1.text', value: 'لون أفتح بدرجات واضحة بدون حساسية مزعجة.' },
        { key: 'points.2.title', value: 'زراعة وتركيبات' }, { key: 'points.2.text', value: 'حل ثابت للسن المفقود يرجّعلك راحة الأكل.' },
        { key: 'points.3.title', value: 'أسنان الأطفال' }, { key: 'points.3.text', value: 'زيارة هادئة تخلي طفلك يحب طبيب الأسنان.' },
      ],
      icons: [{ key: 'points.0.icon', value: 'mdi:tooth-outline' }, { key: 'points.1.icon', value: 'mdi:star-outline' }, { key: 'points.2.icon', value: 'mdi:shield-check-outline' }, { key: 'points.3.icon', value: 'mdi:baby-face-outline' }],
      hide: ['eyebrow', 'text'],
    },
    { section: 'contact', template: 'contact.card', tone: 'light', entrance: 'fade', slots: [{ key: 'title', value: 'احجز موعدك' }, { key: 'sub', value: 'اكتبلنا عالواتساب ومنرد بنفس اليوم.' }] },
  ],
};

const SYSTEM = `${designer.constitution}\n\n${designer.appendix}`;

const PAIR = (valueKey: string) => ({ type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, [valueKey]: { type: 'string' } }, required: ['key', valueKey] } });
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    palette: { type: 'string' },
    fonts: { type: 'string' },
    accentColor: { type: 'string' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          section: { type: 'string' },
          template: { type: 'string' },
          tone: { type: 'string', enum: [...TONES] },
          entrance: { type: 'string', enum: ENTRANCES },
          slots: PAIR('value'),
          icons: PAIR('value'),
          links: PAIR('to'),
          images: PAIR('ref'),
          hide: { type: 'array', items: { type: 'string' } },
        },
        required: ['section', 'template', 'tone', 'slots'],
      },
    },
  },
  required: ['palette', 'fonts', 'sections'],
};

// The function's time on Vercel (vercel.json maxDuration 60s): Gemini gets most of it, and a second
// try only when the first failed fast enough to leave room for one.
const BUDGET_MS = 52_000;

// Why a build failed, as the client shows it: a short code, never a key or the prompt.
class BuildFailure extends Error {
  constructor(public reason: string, public detail = '') {
    super(reason);
  }
}

// Tokens each Gemini call used, for the cost of a build: input (and how much of it came from the
// cache), the answer, and the model's thinking.
type Usage = { promptTokenCount?: number; cachedContentTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
const sumUsage = (calls: Usage[]) => ({
  calls: calls.length,
  input: calls.reduce((n, u) => n + (u.promptTokenCount || 0), 0),
  cached: calls.reduce((n, u) => n + (u.cachedContentTokenCount || 0), 0),
  output: calls.reduce((n, u) => n + (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0), 0),
});

const askGemini = async (ai: GoogleGenAI, prompt: string, ms: number, usage: Usage[]) => {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), ms);
  let text: string;
  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { systemInstruction: SYSTEM, temperature: 0.9, responseMimeType: 'application/json', responseJsonSchema: RESPONSE_SCHEMA, abortSignal: abort.signal },
    });
    text = result.text || '';
    usage.push(result.usageMetadata || {});
    if (!text) throw new BuildFailure('empty', String(result.candidates?.[0]?.finishReason || result.promptFeedback?.blockReason || ''));
  } catch (err: any) {
    if (err instanceof BuildFailure) throw err;
    if (abort.signal.aborted) throw new BuildFailure('timeout');
    const status = Number(err?.status) || 0;
    // Gemini's own message (quota, model or schema problems) says what to fix; it never holds the key.
    throw new BuildFailure(status ? `gemini_${status}` : 'network', String(err?.message || '').slice(0, 300));
  } finally {
    clearTimeout(timer);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new BuildFailure('bad_json', text.slice(-120));
  }
};

// What is the same for every build comes first and the owner's card last: Gemini reuses (caches) a
// prompt's unchanged beginning, which makes a build faster and its repeated part cheaper.
export const buildPrompt = (kind: Kind, profile: Record<string, string>, assets: Assets) =>
  [
    `palettes: ${JSON.stringify(Object.fromEntries(Object.entries(PALETTES).map(([id, p]) => [id, `${p.name} ${p.colors.join(' ')}`])))}`,
    `fonts: ${JSON.stringify(FONTS)}`,
    `icons: ${JSON.stringify([...ICONS])}`,
    `listMax: ${LIST_MAX}`,
    `مثال على شكل الرد وجودته لعيادة أسنان (تعلّم منه الأسلوب، لا تنسخه، ولا تستعمل أسماءه أو نصوصه):\n${JSON.stringify(EXAMPLE)}`,
    `نوع الصفحة: ${kind}`,
    `الكتالوج (الأقسام المتاحة لهذه الصفحة؛ لكل شريحة مثال خاناتها: رقم = حد الأحرف لنص، button:حد = زر، image = صورة؛ و lists = قوائم تختار عدد عناصرها):\n${JSON.stringify(catalogFor(kind, !!profile['الخدمات'], assets))}`,
    `assets (صور صاحب العمل المتوفرة): ${JSON.stringify({ heroBg: assets.heroBg, galleryCount: assets.gallery, logo: assets.logo })}`,
    `بطاقة صاحب العمل (profile):\n${JSON.stringify(profile, null, 1)}`,
    'صمّم الآن صفحة هذا العمل بالذات. اختر الأقسام التي يحتاجها فعلاً وبترتيب يقنع زائره، وأعد JSON فقط.',
  ].join('\n\n');

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return json({ error: 'not_configured' }, 503);

    if (!(await isSignedIn(request))) return json({ error: 'unauthorized' }, 401);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad_request' }, 400);
    }
    const kind: Kind = KINDS.includes(body?.kind) ? body.kind : 'free';
    const profile = cleanProfile(body?.profile);
    const assets = cleanAssets(body?.assets);
    if (!profile['الوصف'] && !profile['التصنيف'] && !profile['الاختصاص']) return json({ error: 'no_profile' }, 400);

    const prompt = buildPrompt(kind, profile, assets);
    const started = Date.now();
    const usage: Usage[] = [];
    try {
      const ai = new GoogleGenAI({ apiKey });
      let raw: any;
      try {
        raw = await askGemini(ai, prompt, BUDGET_MS, usage);
      } catch (err) {
        // One more try after a broken answer, when there is time left for it.
        const left = BUDGET_MS - (Date.now() - started);
        if (!(err instanceof BuildFailure) || !['bad_json', 'empty', 'network', 'gemini_500', 'gemini_503'].includes(err.reason) || left < 20_000) throw err;
        raw = await askGemini(ai, prompt, left, usage);
      }
      const tokens = sumUsage(usage);
      console.log(`build-page: ${kind} planned in ${Date.now() - started} ms, tokens ${JSON.stringify(tokens)}`);
      return json({ plan: checkPlan(raw, kind, profile, assets), usage: tokens });
    } catch (err) {
      const failure = err instanceof BuildFailure ? err : new BuildFailure('check', String((err as Error)?.message || '').slice(0, 200));
      console.error(`build-page failed after ${Date.now() - started} ms:`, failure.reason, failure.detail);
      return json({ error: 'ai_failed', reason: failure.reason, detail: failure.detail }, 502);
    }
  },
};
