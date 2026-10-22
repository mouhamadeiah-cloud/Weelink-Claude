// A ready slide as a form for «ابن صفحتي» (Eyad, 22 Oct): the slide stays exactly as designed and the AI fills in every marked part
// (its texts, photos, buttons and card icons) for the owner's business. For each part this says what it is (its role), what the example
// says there, how long its text should be, and whether it holds a figure; the server builds the AI's questions and its answer's schema
// from it, and checks every answer against it. Pure: no server or browser code, so tests and the browser can read it too.
import { SYSTEM_SLOTS } from './aiSlots';

export type FieldKind = 'text' | 'button' | 'image' | 'icon';

export interface FormField {
  key: string; // the slot name: title, points.0.text, image, photos.2 …
  kind: FieldKind;
  role: string; // what this part is, in Arabic, for the writer
  example: string; // the example's own text (plain), shortened; empty for photos and icons
  target: number; // characters in the example: the new text stays near this length
  min: number; // below this the text is too short for its place
  max: number; // above this the text is cut or asked again
  figure: boolean; // the example holds a number: the new text may hold one only if the owner wrote it
  shape?: 'wide' | 'tall' | 'square'; // a photo's shape
  big?: boolean; // a photo that is the slide's main picture or its whole background
}

export interface SlideForm {
  fields: FormField[];
  lists: Record<string, number>; // list name → its number of items in the example (kept as it is)
}

const plain = (html: unknown) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const FIGURE = /[0-9٠-٩]/;

const SINGLE_ROLE: Record<string, string> = {
  title: 'العنوان الرئيسي للقسم',
  eyebrow: 'سطر صغير فوق العنوان',
  sub: 'وصف قصير تحت العنوان',
  text: 'فقرة نص',
  note: 'ملاحظة صغيرة',
  quote: 'جملة بارزة (عبارة أو مبدأ للعمل، ليست كلام زبون)',
  owner: 'اسم يوقّع الجملة (اسم الجهة أو العمل، لا اسم شخص)',
  role: 'صفة أو دور',
  ticker: 'شريط نصي متحرك',
  cta: 'زر الدعوة الرئيسي (فعل + مفعول)',
  whatsapp: 'زر واتساب',
  phone: 'زر اتصال',
  send: 'زر إرسال النموذج',
};
const LIST_ROLE: Record<string, string> = {
  title: 'عنوان بطاقة',
  text: 'نص بطاقة',
  role: 'صفة صغيرة تحت عنوان البطاقة (دور أو فئة، لا اسم شخص)',
  number: 'رقم أو مؤشر في بطاقة',
  label: 'تسمية تحت الرقم',
  name: 'اسم (خدمة أو باقة أو صنف)',
  price: 'السعر',
  unit: 'وحدة السعر',
  desc: 'وصف قصير',
  features: 'ميزة في قائمة المزايا',
  '': 'وسم قصير',
};
const EXTRA_ROLE: Record<string, string> = {
  badge: 'شارة قصيرة',
  button: 'زر',
  heading: 'عنوان فرعي',
  paragraph: 'سطر نص',
};

const roleOf = (key: string, type: string) => {
  if (SINGLE_ROLE[key]) return SINGLE_ROLE[key];
  if (/^extra\.\d+$/.test(key)) return EXTRA_ROLE[type] || 'نص';
  if (/^caption\.\d+$/.test(key)) return 'تعليق صغير على صورة';
  const features = /^packages\.\d+\.features\.\d+$/.test(key);
  if (features) return LIST_ROLE.features;
  const groupRow = /^groups\.\d+\.rows\.\d+\.(name|price)$/.exec(key);
  if (groupRow) return groupRow[1] === 'price' ? 'سعر في قائمة الأسعار' : 'اسم بند في قائمة الأسعار';
  if (/^groups\.\d+\.name$/.test(key)) return 'عنوان مجموعة بنود';
  const list = /^(?:chips|facts|points|items|packages)\.\d+(?:\.([a-z]+))?$/.exec(key);
  if (list) return LIST_ROLE[list[1] || ''] || 'نص';
  return type === 'button' ? 'زر' : 'نص';
};

const shapeOf = (w: number, h: number): FormField['shape'] => (w > h * 1.25 ? 'wide' : h > w * 1.25 ? 'tall' : 'square');

/** The form of a ready slide: one field for each of its marked parts that the AI fills (the owner's own phone, address, map and so on are not). */
export const slideForm = (slide: { backgroundImage?: string; backgroundVideo?: string } | undefined, elements: any[]): SlideForm => {
  const fields: FormField[] = [];
  const lists: Record<string, number> = {};
  const area = Math.max(1, ...elements.map((e) => (e.width || 0) * (e.height || 0)));
  for (const el of elements) {
    const key: string | undefined = el.aiSlot;
    if (!key || SYSTEM_SLOTS.test(key)) continue;
    const list = /^(chips|facts|points|items|packages)\.(\d+)/.exec(key);
    if (list) lists[list[1]] = Math.max(lists[list[1]] || 0, +list[2] + 1);
    if (el.type === 'image' || /^(image|avatar|photos\.\d+)$/.test(key)) {
      const w = Number(el.width) || 1;
      const h = Number(el.height) || 1;
      fields.push({ key, kind: 'image', role: key === 'avatar' ? 'صورة شخصية صغيرة' : /^photos\./.test(key) ? 'صورة في معرض' : 'صورة', example: '', target: 0, min: 0, max: 0, figure: false, shape: shapeOf(w, h), big: w * h >= area * 0.6 });
      continue;
    }
    const example = plain(el.content);
    const target = [...example].length;
    const tol = Math.max(3, Math.round(target * 0.3));
    fields.push({
      key,
      kind: el.type === 'button' ? 'button' : 'text',
      role: roleOf(key, el.type),
      example: example.length > 140 ? `${example.slice(0, 137)}…` : example,
      target,
      min: Math.max(0, target - Math.max(tol, Math.round(target * 0.4))),
      max: Math.max(target + tol, Math.round(target * 1.3)) + (target < 12 ? 4 : 0),
      figure: FIGURE.test(example),
    });
  }
  // The slide's own background: a photo or video of the example's business is replaced; a plain paper texture is neutral and stays.
  if ((slide?.backgroundImage && !/\/paper-[a-z]+\.svg$/.test(slide.backgroundImage)) || slide?.backgroundVideo) fields.push({ key: 'background', kind: 'image', role: 'خلفية الشريحة', example: '', target: 0, min: 0, max: 0, figure: false, shape: 'wide', big: true });
  // A card with one icon on it: the AI picks that icon (the lists' `icon` field).
  for (const [name, count] of Object.entries(lists)) {
    const first = elements.filter((e) => (e.aiSlot || '').startsWith(`${name}.0`));
    const card = elements.find((c) => c.isGroupContainer && first.length && first.every((e) => e.x >= c.x && e.y >= c.y && e.x + e.width <= c.x + c.width && e.y + e.height <= c.y + c.height));
    const inCard = card ? elements.filter((e) => e.type === 'icon' && e.x >= card.x && e.y >= card.y && e.x + e.width <= card.x + card.width && e.y + e.height <= card.y + card.height) : [];
    if (inCard.length === 1) for (let i = 0; i < count; i++) fields.push({ key: `${name}.${i}.icon`, kind: 'icon', role: 'أيقونة البطاقة', example: '', target: 0, min: 0, max: 0, figure: false });
  }
  return { fields, lists };
};
