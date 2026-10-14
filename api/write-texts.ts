// Vercel serverless function: Wee AI writes the texts of a page (headings, paragraphs, buttons,
// badges) from what the owner told it about their business.
//
//   POST /api/write-texts   { info, items }  with  Authorization: Bearer <Firebase ID token>
//     → { texts: [{ id, text }] }
//
// The Gemini key lives only in the Vercel environment variable GEMINI_API_KEY, never in the
// frontend code. Only signed-in Weelink users can call it (their Firebase token is checked), and
// the size of each request is capped, so the endpoint cannot be used as a free general chatbot.

import { GoogleGenAI, type ThinkingLevel } from '@google/genai';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

// A fixed model, not «latest», so a newer and dearer Flash never comes in on its own (Eyad, 12 Oct).
// Both can be changed in Vercel without code: GEMINI_MODEL, and GEMINI_THINKING (minimal, low,
// medium, high), how long the model thinks before answering; thinking is paid as output.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const THINKING = (process.env.GEMINI_THINKING || 'low').toUpperCase() as ThinkingLevel;
const MAX_ITEMS = 60;
const MAX_FIELD = 600;

type Kind = 'heading' | 'paragraph' | 'button' | 'badge';
interface Item {
  id: string;
  kind: Kind;
  slide: string;
  current: string;
  maxChars: number;
}

const KINDS: Kind[] = ['heading', 'paragraph', 'button', 'badge'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const clip = (v: unknown, n = MAX_FIELD) => (typeof v === 'string' ? v.slice(0, n) : '');

// The owner's answers, kept to plain short strings.
const cleanInfo = (raw: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 30)) {
    if (typeof v === 'string' && v.trim()) out[k.slice(0, 40)] = clip(v.trim());
  }
  return out;
};

const cleanItems = (raw: unknown): Item[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_ITEMS)
    .map((r: any) => ({
      id: clip(r?.id, 80),
      kind: (KINDS.includes(r?.kind) ? r.kind : 'paragraph') as Kind,
      slide: clip(r?.slide, 80),
      current: clip(r?.current, 400),
      maxChars: Math.max(8, Math.min(400, Number(r?.maxChars) || 120)),
    }))
    .filter((it) => it.id);
};

// ---------- Token meter (the platform admin's «التوكنز والتكلفة») ----------
// Every Gemini call is logged in platform_ai_calls and taken off the account's balance
// (platform_subscribers/{uid}.tokens). The first call grants the opening balance: the free
// amount, or the paid one while a subscription runs. Same block as in api/write-texts.ts and
// api/build-page.ts (a function file cannot safely import a sibling). Without
// FIREBASE_SERVICE_ACCOUNT nothing is metered and nothing is blocked.
const FREE_TOKENS = 30_000;
const PAID_TOKENS = 150_000;
const DEFAULT_PRICE = { in: 0.3, out: 2.5 }; // US dollars per million tokens

type Meter = { uid: string; db: ReturnType<typeof getFirestore> };

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
    await m.db.runTransaction(async (t) => {
      const t0 = ((await t.get(ref)).data() as { tokens?: { balance?: number; used?: number } } | undefined)?.tokens || {};
      t.set(ref, { tokens: { balance: Math.max(0, (t0.balance || 0) - tokens), used: (t0.used || 0) + tokens } }, { merge: true });
    });
    await m.db.collection('platform_ai_calls').add({ uid: m.uid, kind, model, input: u.input, cached: u.cached, output: u.output, tokens, costUsd, ok, reason: reason.slice(0, 60), ms, at: Date.now() });
  } catch (err) {
    console.error('meter failed:', (err as Error)?.message);
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

const SYSTEM = `أنت Wee AI، كاتب نصوص لمواقع الأعمال الصغيرة في المنطقة العربية.
تكتب نصوص صفحة واحدة بالعربية الفصحى البسيطة القريبة من الناس، بنبرة دافئة وواضحة.
القواعد:
- استخدم فقط المعلومات التي أعطاك إياها صاحب العمل. لا تخترع أسعاراً أو أرقام هواتف أو عناوين أو جوائز أو سنوات خبرة أو أسماء أشخاص.
- اكتب لكل عنصر نصاً يناسب نوعه ومكانه في الصفحة (اسم الشريحة يدل على دورها) ولا يتجاوز الحد الأقصى للأحرف.
- العناوين قصيرة ولافتة، والفقرات جملة أو جملتان، ونصوص الأزرار فعل قصير من كلمة إلى ثلاث كلمات، والشارات كلمة أو كلمتان.
- إذا كان النص الحالي فيه معلومة صحيحة لا تملك بديلاً لها (مثل اسم طبق أو سعر)، احتفظ بها كما هي.
- لا تستخدم الإيموجي ولا علامات التنسيق.
- أعد نتيجة لكل معرّف أُعطي لك، بنفس المعرّف.`;

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

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
    const info = cleanInfo(body?.info);
    const items = cleanItems(body?.items);
    if (!items.length) return json({ texts: [] });

    const prompt = `معلومات صاحب العمل:\n${JSON.stringify(info, null, 1)}\n\nعناصر الصفحة (المعرّف، النوع، الشريحة، النص الحالي، الحد الأقصى للأحرف):\n${JSON.stringify(items, null, 1)}`;

    const meter = await meterOpen(uid);
    if (meter === 'empty') return json({ error: 'no_tokens' }, 402);
    const started = Date.now();

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM,
          temperature: 0.7,
          thinkingConfig: { thinkingLevel: THINKING },
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              texts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { id: { type: 'string' }, text: { type: 'string' } },
                  required: ['id', 'text'],
                },
              },
            },
            required: ['texts'],
          },
        },
      });
      const parsed = JSON.parse(result.text || '{}') as { texts?: { id?: unknown; text?: unknown }[] };
      const limits = new Map(items.map((it) => [it.id, it.maxChars]));
      const texts = (parsed.texts || [])
        .filter((t) => typeof t.id === 'string' && typeof t.text === 'string' && limits.has(t.id) && (t.text as string).trim())
        .map((t) => ({ id: t.id as string, text: (t.text as string).trim().slice(0, limits.get(t.id as string)! + 20) }));
      const um = result.usageMetadata || {};
      await meterClose(meter, 'write-texts', MODEL, { input: um.promptTokenCount || 0, cached: um.cachedContentTokenCount || 0, output: (um.candidatesTokenCount || 0) + (um.thoughtsTokenCount || 0) }, true, '', Date.now() - started);
      return json({ texts });
    } catch (err) {
      await meterClose(meter, 'write-texts', MODEL, { input: 0, cached: 0, output: 0 }, false, String((err as any)?.status ? `gemini_${(err as any).status}` : 'failed'), Date.now() - started);
      console.error('write-texts failed:', err);
      return json({ error: 'ai_failed' }, 502);
    }
  },
};
