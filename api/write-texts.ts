// Vercel serverless function: Wee AI writes the texts of a page (headings, paragraphs, buttons,
// badges) from what the owner told it about their business.
//
//   POST /api/write-texts   { info, items }  with  Authorization: Bearer <Firebase ID token>
//     → { texts: [{ id, text }] }
//
// The Gemini key lives only in the Vercel environment variable GEMINI_API_KEY, never in the
// frontend code. Only signed-in Weelink users can call it (their Firebase token is checked), and
// the size of each request is capped, so the endpoint cannot be used as a free general chatbot.

import { GoogleGenAI } from '@google/genai';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
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

    if (!(await isSignedIn(request))) return json({ error: 'unauthorized' }, 401);

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

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM,
          temperature: 0.7,
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
      return json({ texts });
    } catch (err) {
      console.error('write-texts failed:', err);
      return json({ error: 'ai_failed' }, 502);
    }
  },
};
