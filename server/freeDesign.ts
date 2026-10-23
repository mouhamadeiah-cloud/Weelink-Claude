// «تصميم حر»: the AI designs the page's slides itself out of the platform's own parts (src/utils/freeDesign.ts), in a chat. The first
// message builds the whole page; later ones answer with only the sections they change (keyed by `key`), so a chat turn stays cheap.
// The AI is reached through `ask`, so tests answer for it. What it writes is cleaned before anything is built from it.
import { cleanFreeDesign, patchFreeDesign, FREE_EFFECTS, FREE_FONTS, FREE_KINDS, FREE_LINKS, FREE_MOTIONS, FREE_SHAPES, FREE_TRIGGERS, MAX_ELEMENTS, MAX_SECTIONS, type FreeContext, type FreeDesign } from '../src/utils/freeDesign.js';

export const FREE_RULES = `وضع التصميم الحر (يتقدم على قواعد الشرائح الجاهزة): صمّم أنت شرائح الصفحة بنفسك من عناصر المنصة فقط، على لوحة عرضها 1280 بكسل، وأعد JSON فقط.

العناصر المسموحة (kind): heading عنوان، text فقرة، button زر، badge شارة، image صورة (photo = كلمات بحث إنجليزية)، icon أيقونة (من القائمة المعطاة فقط)، shape شكل (rect أو circle أو خط line-gradient/line-glow/line-wavy/line-dotted).
كل عنصر: x و y و w و h بالبكسل داخل الشريحة (x+w لا يتجاوز 1280، وy+h لا يتجاوز ارتفاع الشريحة). لا يتراكب نصّان. اترك هوامش جانبية لا تقل عن 80 ما لم يكن العنصر خلفية.
الألوان hex من ستة أرقام فقط. الخطوط من القائمة فقط: head لخط العناوين وbody لخط النص. النص عربي ومكتوب من بطاقة صاحب العمل فقط: لا تخترع أرقاماً ولا أسعاراً ولا عناوين.
الحركات (motion) من القائمة، وtrigger واحد من: once عند فتح الصفحة، scroll عند التمرير، loop مستمر، hover عند مرور الماوس. استعمل الحركة بقصد: دخول هادئ للنصوص (fade أو slide-up مع scroll)، نبض أو طفو لزر الدعوة، لا حركة لكل عنصر.
تأثيرات الحروف (effect) للعناوين الكبيرة فقط وبقصد، لا أكثر من واحد أو اثنين في الصفحة.
الصورة الخلفية للشريحة: photo على مستوى الشريحة مع overlay داكن أو فاتح كي يبقى النص مقروءاً.
مفتاح كل شريحة key قصير بالإنجليزية ثابت (hero, about, services, gallery, contact…).
ترتيب الصفحة وعدد الشرائح من عندك حسب العمل، من 4 إلى 8 شرائح، لا شريحة بلا محتوى حقيقي. أول شريحة تعرّف بالعمل وفيها زر دعوة. آخر شريحة للتواصل.
التواصل: زر link فيه whatsapp أو phone فقط إن كان رقم صاحب العمل مكتوباً في البطاقة.`;

const STR = { type: 'string' } as const;
const NUM = { type: 'number' } as const;
const ELEMENT = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: [...FREE_KINDS] },
    x: NUM, y: NUM, w: NUM, h: NUM,
    text: STR, size: NUM, bold: { type: 'boolean' }, color: STR, align: { type: 'string', enum: ['right', 'center', 'left'] }, font: { type: 'string', enum: ['head', 'body'] },
    bg: STR, radius: NUM, shadow: { type: 'string', enum: ['none', 'sm', 'md', 'lg'] }, border: STR, opacity: NUM,
    icon: STR, photo: STR, shape: { type: 'string', enum: [...FREE_SHAPES] }, link: STR,
    motion: { type: 'string', enum: FREE_MOTIONS }, trigger: { type: 'string', enum: [...FREE_TRIGGERS] },
    effect: { type: 'string', enum: FREE_EFFECTS }, effectColor: STR,
  },
  required: ['kind', 'x', 'y', 'w', 'h'],
};
export const FREE_SCHEMA = {
  type: 'object',
  properties: {
    reply: STR,
    look: { type: 'object', properties: { head: STR, body: STR }, required: ['head', 'body'] },
    remove: { type: 'array', items: STR },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: { key: STR, name: STR, height: NUM, bg: STR, photo: STR, overlay: STR, elements: { type: 'array', items: ELEMENT } },
        required: ['key', 'name', 'height', 'bg', 'elements'],
      },
    },
  },
  required: ['reply', 'look', 'sections'],
};

export interface FreeTurn { role: 'user' | 'ai'; text: string }

const brief = (profile: Record<string, string>) => Object.entries(profile).map(([k, v]) => `${k}: ${v}`).join('\n');

/** What is the same for every turn comes first (Gemini caches an unchanged beginning); the page so far and the new message last. */
export const freePrompt = (o: { profile: Record<string, string>; icons: string[]; structure?: string[]; current?: FreeDesign | null; history?: FreeTurn[]; message: string }) =>
  [
    `الأيقونات المسموحة: ${o.icons.join('، ')}`,
    `الخطوط المسموحة: ${FREE_FONTS.join('، ')}`,
    `الروابط المسموحة: whatsapp, phone, page:menu, page:products, page:cars, page:cart, page:contact, slide:N`,
    `الحد: ${MAX_SECTIONS} شرائح و${MAX_ELEMENTS} عنصراً في الشريحة.`,
    o.structure?.length ? `أقسام صفحة هذا العمل التي حددتها الإدارة (اجعل شرائحك تغطيها بترتيب مناسب): ${o.structure.join('، ')}` : '',
    `بطاقة صاحب العمل:\n${brief(o.profile)}`,
    o.current
      ? `التصميم الحالي (JSON):\n${JSON.stringify(o.current)}\nعدّل حسب الطلب وأعد في sections الشرائح التي تغيّرت فقط بمفاتيحها نفسها (كاملة العناصر)، وشرائح جديدة بمفاتيح جديدة، وفي remove مفاتيح ما يُحذف. لا تُعد ما لم يتغير. look دائماً كاملة.`
      : 'ابدأ تصميم الصفحة كاملة.',
    o.history?.length ? `المحادثة السابقة:\n${o.history.slice(-6).map((t) => `${t.role === 'user' ? 'صاحب العمل' : 'أنت'}: ${t.text}`).join('\n')}` : '',
    `طلب صاحب العمل الآن: ${o.message}`,
    'في reply جملة أو جملتان بالعامية السورية عن ما صممته أو غيّرته.',
  ].filter(Boolean).join('\n\n');

export interface FreeResult { reply: string; design: FreeDesign; changed: string[] }

/** One chat turn: ask, clean, and (after the first) lay the changed sections over the current design. */
export const freeTurn = async (o: { ask: (prompt: string, schema: object, system: string) => Promise<any>; system: string; ctx: FreeContext; profile: Record<string, string>; icons: string[]; structure?: string[]; current?: FreeDesign | null; history?: FreeTurn[]; message: string }): Promise<FreeResult> => {
  const raw = await o.ask(freePrompt(o), FREE_SCHEMA, o.system);
  const cleaned = cleanFreeDesign({ look: raw?.look, sections: raw?.sections }, o.ctx, !!o.current);
  const remove = Array.isArray(raw?.remove) ? raw.remove.filter((k: unknown): k is string => typeof k === 'string') : [];
  const design = o.current ? patchFreeDesign(o.current, cleaned, remove) : cleaned;
  return { reply: typeof raw?.reply === 'string' ? raw.reply.slice(0, 400) : '', design, changed: cleaned.sections.map((s) => s.key) };
};

export { FREE_LINKS };
