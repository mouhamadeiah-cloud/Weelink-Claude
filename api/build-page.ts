// Server function: «ابن صفحتي». Gemini fills the page's ready slides from the owner's Wee AI answers, following Eyad's
// weelink-designer constitution (src/data/ai/weelinkDesigner.json).
//
//   POST /api/build-page   { project, profile, assets, … }  with  Authorization: Bearer <Firebase ID token>
//     → { plan, extra, site, … }   (the browser builds the slides from it)
//
// The page's model (admin «نماذج الصفحات», else its default) is the only source of the site (Eyad, 29 Oct), and there is one engine:
// the server picks the model's pages, sections and a ready slide for each (server/pagePicker.ts: the admin's ready slides, or the
// editor's own for search, featured and the live lists, made for the site's real kind), and Gemini only fills in each slide's parts
// (server/formBuild.ts: texts, buttons, photo searches, card icons), every answer checked. Without the model nothing is built.
// The browser lays the elements out (src/services/pageBuilder.ts), so Gemini never writes coordinates.
// The Gemini key lives only in the Cloudflare environment variable GEMINI_API_KEY.
//
// Usage limits come from the project's package (src/utils/planLimits.ts): once for a free page, once a
// day on 30/60, 5 a day on Pro. They count only once paying is switched on and never for a test account
// (buildAllowance below); the count is kept in platform_builds/{uid}__{project}.

import { GoogleGenAI, type ThinkingLevel } from '@google/genai';
import { cert, getApps, initializeApp, getFirestore } from '../server/firebase.js';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import designer from '../src/data/ai/weelinkDesigner.json' with { type: 'json' };
import iconList from '../src/data/ai/buildIcons.json' with { type: 'json' };
import { GALLERY_MAX, limitsOf } from '../src/utils/planLimits.js';
import { DEFAULT_MODELS, forRentalOf, modelOf, pageRole, pagesOf } from '../src/data/pageModels.js';
import { readModels } from '../server/pageModels.js';
import { ON_REQUEST, clip, cleanText, numbersAreOwners, ownersNumbers } from '../server/aiText.js';
import { FREE_RULES, freeTurn, type FreeTurn } from '../server/freeDesign.js';
import { buildFormPlan, type FormPlan, type FormSection } from '../server/formBuild.js';
import { pickSections, sectionsFor, slidePool, type GallerySlideData } from '../server/pagePicker.js';
import { DEFAULT_LOOK, PAGE_LOOKS } from '../src/data/pageLooks.js';
import { siteKindOf, type SiteKind } from '../src/data/siteKinds.js';

// A fixed model, not «latest», so a newer and dearer Flash never comes in on its own (Eyad, 12 Oct).
// Both can be changed in Cloudflare without code: GEMINI_MODEL, and GEMINI_THINKING (minimal, low,
// medium, high), how long the model thinks before answering; thinking is paid as output.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const THINKING = (process.env.GEMINI_THINKING || 'low').toUpperCase() as ThinkingLevel;

// The 12 page looks Wee AI chooses from (src/data/pageLooks.ts): who each suits, its colours and its two fonts.
const LOOKS = Object.fromEntries(PAGE_LOOKS.map((l) => [l.id, { name: l.name, forWho: l.forWho, bg: l.bg, ink: l.ink, accent: l.accent, head: l.head, body: l.body }]));
const defaultLookOf = (kind: SiteKind) => (DEFAULT_LOOK as Record<string, string>)[kind] || DEFAULT_LOOK.free;
const ICONS = new Set(iconList as string[]);
const ENTRANCES = ['none', 'fade', 'slide-up', 'slide-left', 'slide-right', 'scale-up'];
const TONES = ['light', 'tint', 'dark'] as const;

export interface Assets {
  heroBg: boolean;
  gallery: number;
  logo: boolean;
}

export const NAV_LAYOUTS = ['horizontal', 'hamburger', 'vertical'] as const;
export const NAV_TONES = ['light', 'tint', 'accent', 'dark'] as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });


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
  gallery: Math.max(0, Math.min(GALLERY_MAX, Math.floor(Number(raw?.gallery) || 0))),
  logo: !!raw?.logo,
});

// ---------- Token meter (the platform admin's «التوكنز والتكلفة») ----------
// Every Gemini call is logged in platform_ai_calls and taken off the account's balance
// (platform_subscribers/{uid}.tokens). The first call grants the opening balance: the free
// amount, or the paid one while a subscription runs. Same block as in
// api/admin.ts (a function file cannot safely import a sibling). Without
// FIREBASE_SERVICE_ACCOUNT nothing is metered and nothing is blocked.
const FREE_TOKENS = 30_000;
const PAID_TOKENS = 150_000;
const DEFAULT_PRICE = { in: 0.3, out: 2.5 }; // US dollars per million tokens

// The platform admin's own Firebase account (api/admin.ts «editor-token») has no token limit: its calls are logged, not charged.
const isPlatformAdminUid = (uid: string) => uid.startsWith('platform-admin_');
type Meter = { uid: string; db: ReturnType<typeof getFirestore>; unlimited?: boolean };

const meterDb = () => {
  try {
    const acc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '');
    const app = getApps()[0] || initializeApp({ credential: cert(acc), projectId: firebaseConfig.projectId });
    const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
    return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  } catch {
    return null;
  }
};

// null = not metered, 'empty' = no tokens left, otherwise the meter to close after the call.
const meterOpen = async (uid: string): Promise<Meter | 'empty' | null> => {
  const db = meterDb();
  if (!db || !uid) return null;
  if (isPlatformAdminUid(uid)) return { uid, db, unlimited: true };
  try {
    const ref = db.collection('platform_subscribers').doc(uid);
    const cur = (await ref.get()).data() as { tokens?: { balance?: number }; subscription?: { endsAt?: number } } | undefined;
    let balance = cur?.tokens?.balance;
    if (typeof balance !== 'number') {
      balance = (cur?.subscription?.endsAt || 0) > Date.now() ? PAID_TOKENS : FREE_TOKENS;
      await ref.set({ tokens: { balance, used: 0 } }, { merge: true });
    }
    return balance > 0 ? { uid, db } : 'empty';
  } catch {
    return null;
  }
};

const meterClose = async (m: Meter | null, kind: string, model: string, u: { input: number; cached: number; output: number }, ok: boolean, reason: string, ms: number) => {
  if (!m) return;
  try {
    const p = (await m.db.collection('platform_settings').doc('ai_prices').get()).data() as { in?: number; out?: number } | undefined;
    const price = { in: Number(p?.in) >= 0 && p?.in !== undefined ? Number(p.in) : DEFAULT_PRICE.in, out: Number(p?.out) >= 0 && p?.out !== undefined ? Number(p.out) : DEFAULT_PRICE.out };
    const tokens = u.input + u.output;
    const costUsd = (u.input * price.in + u.output * price.out) / 1e6;
    const ref = m.db.collection('platform_subscribers').doc(m.uid);
    if (!m.unlimited) {
      await m.db.runTransaction(async (t) => {
        const t0 = ((await t.get(ref)).data() as { tokens?: { balance?: number; used?: number } } | undefined)?.tokens || {};
        t.set(ref, { tokens: { balance: Math.max(0, (t0.balance || 0) - tokens), used: (t0.used || 0) + tokens } }, { merge: true });
      });
    }
    await m.db.collection('platform_ai_calls').add({ uid: m.uid, kind, model, input: u.input, cached: u.cached, output: u.output, tokens, costUsd, ok, reason: reason.slice(0, 60), ms, at: Date.now() });
  } catch (err) {
    console.error('meter failed:', (err as Error)?.message);
  }
};

// ---------- «ابن صفحتي» per package ----------
const BUILD_KIND_PROJECT: Record<string, string> = { free: 'page', restaurant: 'restaurant', shop: 'shop', cars: 'cars', rental: 'rental', hotel: 'hotel' };
const isProjectKey = (p: unknown): p is string => typeof p === 'string' && /^(page|shop|cars|restaurant|rental|hotel)(-[a-z0-9]{4,12})?$/.test(p);
const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// The number of builds per package is not held to for now (Eyad, 23 Oct): builds are still counted, set true to enforce it again.
const BUILD_LIMIT_ENFORCED = false;

type Allowance = { ref: any; day: string; limit: number; perDay: boolean; over: boolean; gallery: number } | null;

// null = no limit (no database, paying off, a test account); else whether it is used up, and what to count after a build.
export const buildAllowance = async (db: ReturnType<typeof getFirestore> | null, uid: string, project: string, now = Date.now()): Promise<Allowance> => {
  if (!db || isPlatformAdminUid(uid)) return null;
  try {
    const [settings, test, access] = await Promise.all([
      db.collection('platformSettings').doc('billing').get(),
      db.collection('testAccounts').doc(uid).get(),
      db.collection('projectAccess').doc(`${uid}__${project}`).get(),
    ]);
    if (settings.data()?.enforce !== true || test.exists) return null;
    const a = access.data() as { plan?: string; paidUntil?: number } | undefined;
    const kind = project.split('-')[0];
    // Before paying: a page is free, another kind gets its smallest package.
    const plan = a?.plan && Number(a.paidUntil) > now ? a.plan : kind === 'page' ? 'page-free' : `${kind}-30`;
    const { builds, perDay, gallery } = limitsOf(plan);
    const ref = db.collection('platform_builds').doc(`${uid}__${project}`);
    const used = (await ref.get()).data() as { day?: string; today?: number; total?: number } | undefined;
    const day = dayOf(now);
    const count = perDay ? (used?.day === day ? Number(used?.today) || 0 : 0) : Number(used?.total) || 0;
    return { ref, day, limit: builds, perDay, over: count >= builds, gallery };
  } catch {
    return null;
  }
};

const countBuild = async (a: Allowance) => {
  if (!a) return;
  try {
    const cur = ((await a.ref.get()).data() || {}) as { day?: string; today?: number; total?: number };
    await a.ref.set({ day: a.day, today: (cur.day === a.day ? Number(cur.today) || 0 : 0) + 1, total: (Number(cur.total) || 0) + 1, at: Date.now() });
  } catch (err) {
    console.error('build count failed:', (err as Error)?.message);
  }
};

// A Firebase ID token is valid when Google's identity service can look up its user; the answer is its uid.
const signedInUid = async (request: Request) => {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return '';
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  });
  if (!res.ok) return '';
  const data = (await res.json()) as { users?: { localId?: string }[] };
  return data.users?.[0]?.localId || '';
};

const SYSTEM = `${designer.constitution}\n\n${designer.appendix}`;

// The function's time budget (60 s): Gemini gets most of it, and a second
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

const askGemini = async (ai: GoogleGenAI, prompt: string, ms: number, usage: Usage[], schema: object, system: string) => {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), ms);
  let text: string;
  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { systemInstruction: system, temperature: 0.9, thinkingConfig: { thinkingLevel: THINKING }, responseMimeType: 'application/json', responseJsonSchema: schema, abortSignal: abort.signal },
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

// ---------- The page's model (docs/READY_SLIDES_PLAN.md step 4c) ----------

const FLAVORS = ['restaurant', 'shop', 'cars', 'rental', 'hotel'];

// The package the project builds as: a paid one while its access lasts, else the free page (with the flavour of a free restaurant, shop or
// showroom page), else the smallest of its kind.
const planFor = async (db: NonNullable<ReturnType<typeof getFirestore>>, uid: string, project: string, flavor: string, now = Date.now()) => {
  const a = (await db.collection('projectAccess').doc(`${uid}__${project}`).get()).data() as { plan?: string; paidUntil?: number } | undefined;
  if (a?.plan && Number(a.paidUntil) > now) return a.plan;
  const type = project.split('-')[0];
  return type === 'page' ? (FLAVORS.includes(flavor) ? `${flavor}-free` : 'page-free') : `${type}-30`;
};

// Services the owner priced: «name: price» lines where the price is not «حسب الطلب».
const hasPricedServices = (profile: Record<string, string>) => (profile['الخدمات'] || '').split('؛').some((l) => /:\s*\S/.test(l) && !l.includes(ON_REQUEST));

// A rental of anything but cars is drawn with the shop's slides.
const rentalPick = <T extends Parameters<typeof forRentalOf>[0]>(planId: string, profile: Record<string, string>, list: T): T => (planId.startsWith('rental') ? (forRentalOf(list, profile['التصنيف']) as T) : list);

/**
 * The sections and slides a page of the model is built from (Eyad, 29 Oct: the model is the only source, the old way of the AI planning the
 * page itself is gone). The admin's model of the package, else its default; `pageId` names a later page (the model's first when unset).
 * A string when the page cannot be built from the model: the build stops and says so, it never plans the page another way.
 */
const modelPick = async (db: ReturnType<typeof getFirestore> | null, o: { uid: string; project: string; flavor: string; ticked: string[] | undefined; profile: Record<string, string>; assets: Assets; pageId?: string }) => {
  if (!db) return 'no_database';
  try {
    const planId = await planFor(db, o.uid, o.project, o.flavor);
    const model = (await readModels(db)).find((m) => m.id === modelOf(planId)) || DEFAULT_MODELS.find((m) => m.id === modelOf(planId));
    if (!model) return 'no_model';
    const pages = pagesOf(model);
    const page = o.pageId ? pages.find((p) => p.id === o.pageId) : pages[0];
    if (!page) return 'no_page';
    // The site's real kind (a rental of cars or of things, a hotel…) picks the search and featured slides made for it.
    const kind = siteKindOf(planId, o.profile['التصنيف']);
    const chosen = sectionsFor(page.sections, { services: !!o.profile['الخدمات'], priced: hasPricedServices(o.profile), photos: o.assets.gallery > 0, ticked: o.ticked });
    const picked = await pickSections({ sections: rentalPick(planId, o.profile, chosen), pool: await slidePool(db), kind, photos: o.assets.gallery });
    if (picked.skipped.length) console.warn(`model ${model.id}: no slide for ${picked.skipped.join(', ')}`);
    // The whole site as the model has it (its pages in order, the locked ones too), so the browser keeps exactly these pages.
    const site = pages.map((p) => ({ id: p.id, name: p.name, ...(p.system ? { system: p.system } : {}), ...(pageRole(p) ? { role: pageRole(p) } : {}) }));
    if (!picked.pool.length) return 'no_slides';
    // The ratings are drawn by the browser: built when the model's page has them and the owner gets them (always, or ticked).
    return { ...picked, kind, pageName: page.name, site, ratings: chosen.some((x) => x.category === 'ratings') };
  } catch (err) {
    console.error('model pick failed:', (err as Error)?.message);
    return 'model_read';
  }
};

const formEnv = (ask: (prompt: string, schema: object, system: string) => Promise<any>, kind: SiteKind) => ({
  ask,
  // Eyad's constitution and its appendix bind every question (28 Oct).
  rules: SYSTEM,
  looks: LOOKS,
  defaultLook: defaultLookOf(kind),
  icons: [...ICONS],
  tones: TONES,
  entrances: ENTRANCES,
  navLayouts: NAV_LAYOUTS,
  navTones: NAV_TONES,
});

const PLAN_ID = /^(page-(free|pro)|(restaurant|shop|cars|rental|hotel)-(free|30|60|pro))$/;
// The pages and sections of the model of a package: the admin's, else the default.
const modelAnswer = async (plan: unknown) => {
  if (typeof plan !== 'string' || !PLAN_ID.test(plan)) return json({ error: 'bad_request' }, 400);
  const id = modelOf(plan);
  let model: { id: string; name: string; pages: ReturnType<typeof pagesOf> } | null = null;
  try {
    const db = meterDb();
    const found = db ? (await readModels(db)).find((m) => m.id === id) : null;
    if (found) model = { id: found.id, name: found.name, pages: pagesOf(found) };
  } catch (err) {
    console.error('model read failed:', (err as Error)?.message);
  }
  if (!model) {
    const d = DEFAULT_MODELS.find((m) => m.id === id)!;
    model = { id: d.id, name: d.name, pages: pagesOf(d) };
  }
  return json({ model });
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    // The model a package builds from (its sections decide which questions Wee AI asks). Public: it only names the sections.
    const peek = await request.clone().json().catch(() => null);
    if (peek?.mode === 'model') return modelAnswer(peek?.plan);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return json({ error: 'not_configured' }, 503);

    const uid = await signedInUid(request);
    if (!uid) return json({ error: 'unauthorized' }, 401);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad_request' }, 400);
    }
    const profile = cleanProfile(body?.profile);
    const assets = cleanAssets(body?.assets);
    if (!profile['الوصف'] && !profile['التصنيف'] && !profile['الاختصاص']) return json({ error: 'no_profile' }, 400);

    // «تصميم حر»: a chat in which the AI designs the slides itself. Open for the trial (no build count, no token ceiling), still metered.
    if (body?.mode === 'free') {
      const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 800) : '';
      if (!message) return json({ error: 'bad_request' }, 400);
      const owners = ownersNumbers(profile);
      const history: FreeTurn[] = (Array.isArray(body?.history) ? body.history : []).slice(-6).map((t: any) => ({ role: t?.role === 'ai' ? 'ai' : 'user', text: String(t?.text || '').slice(0, 400) }));
      const started = Date.now();
      const usage: Usage[] = [];
      const meter = await meterOpen(uid);
      try {
        const ai = new GoogleGenAI({ apiKey });
        const ask = (text: string, schema: object, system: string) => askGemini(ai, text, BUDGET_MS, usage, schema, system);
        const result = await freeTurn({
          ask, system: `${designer.constitution}\n\n${designer.appendix}\n\n${FREE_RULES}`, profile, icons: [...ICONS], message, history,
          structure: Array.isArray(body?.structure) ? body.structure.filter((s: unknown): s is string => typeof s === 'string').slice(0, 14).map((s: string) => s.slice(0, 40)) : undefined,
          current: body?.current && typeof body.current === 'object' ? (body.current as any) : null,
          ctx: { icons: ICONS, figuresOk: (t) => !/[0-9٠-٩]/.test(t) || numbersAreOwners(t, owners) },
        });
        const tokens = sumUsage(usage);
        console.log(`build-page: free turn in ${Date.now() - started} ms, tokens ${JSON.stringify(tokens)}`);
        await meterClose(meter === 'empty' ? null : meter, 'build-page-free', MODEL, tokens, true, '', Date.now() - started);
        return json({ ...result, usage: tokens });
      } catch (err) {
        const failure = err instanceof BuildFailure ? err : new BuildFailure('check', String((err as Error)?.message || '').slice(0, 200));
        await meterClose(meter === 'empty' ? null : meter, 'build-page-free', MODEL, sumUsage(usage), false, failure.reason, Date.now() - started);
        console.error('build-page free failed:', failure.reason, failure.detail);
        return json({ error: 'ai_failed', reason: failure.reason, detail: failure.detail }, 502);
      }
    }

    const project = isProjectKey(body?.project) ? body.project : BUILD_KIND_PROJECT[String(body?.kind)] || 'page';
    // A later page of the model is part of the same build: it is neither counted nor held to the build limit.
    const modelPage = typeof body?.modelPage === 'string' && /^[\w-]{1,24}$/.test(body.modelPage) ? body.modelPage : '';
    const allowance = modelPage ? null : await buildAllowance(meterDb(), uid, project);
    if (BUILD_LIMIT_ENFORCED && allowance?.over) return json({ error: 'build_limit', limit: allowance.limit, perDay: allowance.perDay }, 429);
    // The package's gallery is the most photos the plan may use (only once paying is switched on).
    if (allowance) assets.gallery = Math.min(assets.gallery, allowance.gallery);
    const meter = await meterOpen(uid);
    if (meter === 'empty') return json({ error: 'no_tokens' }, 402);

    const flavor = typeof body?.flavor === 'string' ? body.flavor : '';
    const ticked = Array.isArray(body?.ticked) ? body.ticked.filter((t: unknown): t is string => typeof t === 'string' && /^[a-z_]+(:[a-zA-Z]+)?$/.test(t)).slice(0, 30) : undefined;
    const over = await modelPick(meterDb(), { uid, project, flavor, ticked, profile, assets, pageId: modelPage });
    // Without the model nothing is built: there is no other way to plan the page.
    if (typeof over === 'string') {
      await meterClose(meter, 'build-page', MODEL, { input: 0, cached: 0, output: 0 }, false, over, 0);
      return json({ error: 'no_model', reason: over }, 503);
    }
    // Every section is filled the same way: its slide is fixed, the AI fills every part of it (server/formBuild.ts).
    const formSections: FormSection[] = over.pool.map((p) => ({ id: p.id, name: p.name, template: p.template, slide: over.extra[p.template].slide, elements: over.extra[p.template].elements }));
    const started = Date.now();
    const usage: Usage[] = [];
    try {
      const ai = new GoogleGenAI({ apiKey });
      // One more try after a broken answer, when there is time left for it.
      const ask = async (text: string, schema: object, system: string) => {
        try {
          return await askGemini(ai, text, Math.max(8_000, BUDGET_MS - (Date.now() - started)), usage, schema, system);
        } catch (err) {
          const left = BUDGET_MS - (Date.now() - started);
          if (!(err instanceof BuildFailure) || !['bad_json', 'empty', 'network', 'gemini_500', 'gemini_503'].includes(err.reason) || left < 15_000) throw err;
          return askGemini(ai, text, left, usage, schema, system);
        }
      };
      const kind = over.kind;
      const plan: FormPlan = await buildFormPlan({ env: formEnv(ask, kind), kind, profile, assets, sections: formSections, accent: /^#[0-9a-f]{6}$/i.test(profile['اللون_المفضل_رمز'] || '') ? profile['اللون_المفضل_رمز'] : undefined, motion: /حرك/.test(profile['الحركة'] || '') && !/هادئ/.test(profile['الحركة'] || '') });
      const tokens = sumUsage(usage);
      console.log(`build-page: ${kind} planned in ${Date.now() - started} ms, tokens ${JSON.stringify(tokens)}`);
      await meterClose(meter, 'build-page', MODEL, tokens, true, '', Date.now() - started);
      await countBuild(allowance);
      // The slides the plan uses go with it, for the browser to build from.
      const extra: Record<string, GallerySlideData> = {};
      for (const s of plan.sections) if (over.extra[s.template]) extra[s.template] = over.extra[s.template];
      // The sections the model asked for that did not get built (no slide that fits, or the AI gave a slide nothing), so the owner is told.
      const built = new Set(plan.sections.map((s) => s.template));
      const missing = [...over.skipped, ...over.pool.filter((p) => !built.has(p.template)).map((p) => p.name)];
      // Sections the AI could not fill, written from the owner's card alone: named in the report.
      const plain = plan.sections.filter((s) => s.fallback).map((s) => over.pool.find((p) => p.id === s.section)?.name || s.section);
      return json({ plan, extra, pageName: over.pageName, ratings: over.ratings, site: over.site, ...(missing.length ? { missing } : {}), ...(plain.length ? { plain } : {}), usage: tokens });
    } catch (err) {
      const failure = err instanceof BuildFailure ? err : new BuildFailure('check', String((err as Error)?.message || '').slice(0, 200));
      await meterClose(meter, 'build-page', MODEL, sumUsage(usage), false, failure.reason, Date.now() - started);
      console.error(`build-page failed after ${Date.now() - started} ms:`, failure.reason, failure.detail);
      return json({ error: 'ai_failed', reason: failure.reason, detail: failure.detail }, 502);
    }
  },
};
