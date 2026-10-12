// Vercel serverless function: «ابن صفحتي». Gemini designs a page from the owner's Wee AI answers,
// following Eyad's weelink-designer constitution (src/data/ai/weelinkDesigner.json) and the ready
// slides of the catalogue (src/data/ai/buildCatalog.json, written by `npm run ai-catalog`).
//
//   POST /api/build-page   { kind, profile, assets }  with  Authorization: Bearer <Firebase ID token>
//     → { plan }   (checked against the catalogue; the browser builds the slides from it)
//
// Gemini never places elements: it picks a ready slide for each section and fills its slots. Every
// answer is checked here before it reaches the page (unknown slides or slots, over-long texts,
// emoji and AI wording, invented prices or figures, outside links, unknown palettes or fonts).
// The Gemini key lives only in the Vercel environment variable GEMINI_API_KEY.
//
// Usage limits (once per free page, 5 a day on paid pages) come with the subscriptions phase: every
// account today is a test account with unlimited use.

import { GoogleGenAI } from '@google/genai';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import catalog from '../src/data/ai/buildCatalog.json' with { type: 'json' };
import designer from '../src/data/ai/weelinkDesigner.json' with { type: 'json' };

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const MAX_FIELD = 800;

type Kind = 'free' | 'restaurant' | 'shop' | 'cars';
const KINDS: Kind[] = ['free', 'restaurant', 'shop', 'cars'];

interface SlotSpec {
  kind: 'text' | 'button' | 'image';
  max?: number;
}
interface Section {
  id: string;
  name: string;
  required: boolean;
  templates: string[];
}
const TEMPLATES = catalog.templates as Record<string, { name: string; slots: Record<string, SlotSpec> }>;
const SECTIONS = catalog.sections as Record<Kind, Section[]>;
const PALETTES = catalog.palettes as Record<string, { name: string; colors: string[] }>;
const FONTS = catalog.fonts as Record<string, { head: string; body: string }>;

export interface Assets {
  heroBg: boolean;
  gallery: number;
  logo: boolean;
}

export interface PlannedSection {
  section: string;
  template: string;
  slots: Record<string, string>;
  links: Record<string, string>;
  images: Record<string, string>;
  motion: boolean;
}

export interface Plan {
  palette: string;
  fonts: string;
  accentColor?: string;
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
  clip(v, 2000).replace(EMOJI, '').replace(AI_WORDS, '').replace(/[*_#`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

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
const IMAGE_QUERY = /^[a-z0-9][a-z0-9 \-]{1,58}$/i;

const pairs = (raw: unknown, valueKey: string): [string, string][] =>
  Array.isArray(raw)
    ? raw.slice(0, 120).filter((p) => p && typeof p.key === 'string').map((p) => [p.key, typeof p[valueKey] === 'string' ? p[valueKey] : ''])
    : [];

/** Gemini's answer checked against the catalogue: only what Weelink can build safely comes back. */
export const checkPlan = (raw: any, kind: Kind, profile: Record<string, string>, assets: Assets): Plan => {
  const owners = ownersNumbers(profile);
  const answered: any[] = Array.isArray(raw?.sections) ? raw.sections : [];
  const sections: PlannedSection[] = [];

  for (const section of SECTIONS[kind]) {
    const given = answered.find((s) => s?.section === section.id) || answered.find((s) => section.templates.includes(s?.template));
    if (!given && !section.required) continue;
    const template = section.templates.includes(given?.template) ? given.template : section.templates[0];
    const spec = TEMPLATES[template].slots;
    const slots: Record<string, string> = {};
    for (const [key, value] of pairs(given?.slots, 'value')) {
      const s = spec[key];
      if (!s || s.kind === 'image') continue;
      let text = cleanText(value, s.max || 120);
      const leaf = key.split('.').pop();
      if (leaf === 'price' && text && text !== ON_REQUEST && !numbersAreOwners(text, owners)) text = ON_REQUEST;
      if (leaf === 'number' && text && !numbersAreOwners(text, owners)) text = '';
      slots[key] = text;
    }
    // A section the AI left out still opens with its name.
    if (!given && spec.title) slots.title = section.name;
    const links: Record<string, string> = {};
    for (const [key, to] of pairs(given?.links, 'to')) {
      if (spec[key]?.kind === 'button' && LINKS.test(to)) links[key] = to;
    }
    const images: Record<string, string> = {};
    for (const [key, ref] of pairs(given?.images, 'ref')) {
      if (spec[key]?.kind !== 'image') continue;
      const gallery = /^user:gallery:(\d)$/.exec(ref);
      if (ref === 'user:heroBg' ? assets.heroBg : ref === 'user:logo' ? assets.logo : gallery ? +gallery[1] >= 1 && +gallery[1] <= assets.gallery : IMAGE_QUERY.test(ref.trim())) {
        images[key] = ref.trim();
      }
    }
    sections.push({ section: section.id, template, slots, links, images, motion: given?.motion === true });
  }

  // Buttons may lead only to sections that are on the page.
  for (const s of sections) {
    for (const [key, to] of Object.entries(s.links)) {
      const n = /^slide:(\d+)$/.exec(to);
      if (n && +n[1] >= sections.length) delete s.links[key];
    }
  }

  const accent = /^#[0-9a-f]{6}$/i.test(profile['اللون_المفضل_رمز'] || '') ? profile['اللون_المفضل_رمز'] : /^#[0-9a-f]{6}$/i.test(raw?.accentColor) ? raw.accentColor : undefined;
  return {
    palette: PALETTES[raw?.palette] ? raw.palette : Object.keys(PALETTES)[0],
    fonts: FONTS[raw?.fonts] ? raw.fonts : Object.keys(FONTS)[0],
    ...(accent ? { accentColor: accent } : {}),
    sections,
  };
};

// ---------- The prompt ----------

// The catalogue as Gemini reads it: each section of this page type with its slides and slots.
const catalogFor = (kind: Kind) =>
  SECTIONS[kind].map((s) => ({
    section: s.id,
    name: s.name,
    required: s.required,
    templates: s.templates.map((t) => ({
      template: t,
      name: TEMPLATES[t].name,
      slots: Object.fromEntries(Object.entries(TEMPLATES[t].slots).map(([k, v]) => [k, v.kind === 'text' ? v.max : `${v.kind}${v.max ? `:${v.max}` : ''}`])),
    })),
  }));

const SYSTEM = `${designer.constitution}\n\n${designer.appendix}`;

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
          slots: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'] } },
          links: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, to: { type: 'string' } }, required: ['key', 'to'] } },
          images: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, ref: { type: 'string' } }, required: ['key', 'ref'] } },
          motion: { type: 'boolean' },
        },
        required: ['section', 'template', 'slots'],
      },
    },
  },
  required: ['palette', 'fonts', 'sections'],
};

const askGemini = async (ai: GoogleGenAI, prompt: string) => {
  const result = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { systemInstruction: SYSTEM, temperature: 0.8, responseMimeType: 'application/json', responseJsonSchema: RESPONSE_SCHEMA },
  });
  return JSON.parse(result.text || '{}');
};

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
    if (!profile['الوصف'] && !profile['التصنيف']) return json({ error: 'no_profile' }, 400);

    const prompt = [
      `نوع الصفحة: ${kind}`,
      `profile:\n${JSON.stringify(profile, null, 1)}`,
      `assets (صور المستخدم المتوفرة): ${JSON.stringify({ heroBg: assets.heroBg, galleryCount: assets.gallery, logo: assets.logo })}`,
      `palettes: ${JSON.stringify(Object.fromEntries(Object.entries(PALETTES).map(([id, p]) => [id, `${p.name} ${p.colors.join(' ')}`])))}`,
      `fonts: ${JSON.stringify(FONTS)}`,
      `الكتالوج (الأقسام بالترتيب، ولكل نموذج خاناته: رقم = حد الأحرف لنص، button:حد = زر، image = صورة):\n${JSON.stringify(catalogFor(kind))}`,
      'أعد قسماً واحداً لكل قسم تختاره، بنفس ترتيب الكتالوج.',
    ].join('\n\n');

    try {
      const ai = new GoogleGenAI({ apiKey });
      let raw: any;
      try {
        raw = await askGemini(ai, prompt);
      } catch {
        raw = await askGemini(ai, prompt); // one more try after a broken answer
      }
      return json({ plan: checkPlan(raw, kind, profile, assets) });
    } catch (err) {
      console.error('build-page failed:', err);
      return json({ error: 'ai_failed' }, 502);
    }
  },
};
