// «ابن صفحتي», the form way (Eyad, 22 Oct): the server has picked one ready slide for each section, and the AI fills in every marked part of
// it (texts, buttons, photos, card icons) for the owner's business; the slide itself stays as designed.
//
//   1. a brief for the whole page (its look, navbar, voice, what its photos show, the angle and tone of each section);
//   2. one question for each section, asked in parallel, whose answer must hold every part of the slide's form (a response schema built
//      from the form, so a part cannot be left out);
//   3. every answer checked (length, figures the owner never wrote, example wording, outside links, unknown icons); only what failed is
//      asked again, once; what still fails goes without its text, never with the example's.
// The AI is reached through `env.ask`, so tests can answer for it. The plan it returns is the one the browser builds from.
import { slideForm, type FormField, type SlideForm } from '../src/data/slideForm.js';
import { LIVE_TYPES } from '../src/data/aiSlots.js';
import { opensPage } from '../src/data/pageModels.js';
import { ON_REQUEST, cleanText, numbersAreOwners, ownersNumbers } from './aiText.js';

export interface FormSection {
  id: string; // the model's section id (intro, about, cars:front …)
  name: string;
  template: string; // `g:{id}` an admin's ready slide, `code:…` the editor's own
  slide?: { backgroundImage?: string; backgroundVideo?: string };
  elements: any[];
}

export interface FormLook { name: string; forWho: string; bg: string; ink: string; accent: string; head: string; body: string }

export interface FormEnv {
  ask: (prompt: string, schema: object, system: string) => Promise<any>;
  looks: Record<string, FormLook>;
  defaultLook: string;
  icons: string[];
  tones: readonly string[];
  entrances: string[];
  navLayouts: readonly string[];
  navTones: readonly string[];
  rng?: () => number; // the dice for the navbar's variety (tests set it)
  rules?: string; // Eyad's weelink-designer constitution and its appendix: binding in every question (src/data/ai/weelinkDesigner.json)
}

export interface FormPlannedSection {
  section: string;
  template: string;
  tone: 'light' | 'tint' | 'dark';
  slots: Record<string, string>;
  icons: Record<string, string>;
  links: Record<string, string>;
  images: Record<string, string>;
  entrance: string;
  fallback?: boolean; // the AI could not fill it twice: written from the owner's card alone (named in the build's report)
}
export interface FormPlan {
  look: string;
  accentColor?: string;
  navbar: { layout: string; sticky: boolean; tone: string };
  motion: boolean;
  sections: FormPlannedSection[];
}

export interface FormAssets { heroBg: boolean; gallery: number; logo: boolean }

const LINKS = /^(whatsapp|phone|page:(menu|products|cars|cart|contact)|slide:\d{1,2})$/;
const IMAGE_QUERY = /^[a-z0-9][a-z0-9 ,\-]{1,78}$/i;
const SIMULTANEOUS = 4;

// ---------- The AI's rules ----------

export const FORM_SYSTEM = `أنت كاتب تسويقي ومصمم ويب أول للمنطقة العربية، بمستوى أفضل الوكالات. تعبّئ شرائح جاهزة لعمل حقيقي من بطاقة صاحبه.
الشريحة مصممة وثابتة: لا تغيّر تخطيطها ولا عدد عناصرها. كل جزء فيها فيه مثال لعمل آخر، ومهمتك أن تكتب مكانه ما يناسب هذا العمل بالذات.

القواعد:
1. املأ كل مفتاح مطلوب. ممنوع الفراغ، وممنوع «حسب الطلب» أو «سيتم إضافته».
2. التزم بطول الهدف المكتوب لكل نص: لا أقصر ولا أطول بكثير، لأن التصميم ثابت.
3. لا تنسخ نص المثال ولا كلمة تخص موضوعه. المثال يبيّن الدور والطول والأسلوب فقط.
4. لا تخترع: ممنوع الأرقام والسنوات والأسعار والجوائز وعدد الزبائن وأسماء الأشخاص وآراء الزبائن. خذ كل معلومة من بطاقة صاحب العمل. إذا كان مثال الخانة رقماً ولا رقم في البطاقة فاكتب كلمة أو عبارة قصيرة صادقة بدله (مثل: سريع، مضمون، قريب منك).
5. كل خانة اسم شخص أو صفة شخص: اكتب اسم الجهة أو الفريق أو الدور (فريق الصيانة، قسم المبيعات)، لا اسم إنسان. وكل خانة اقتباس: اكتب مبدأ العمل أو وعده، لا كلام زبون.
6. الصور: كلمات بحث Unsplash بالإنجليزية من 3 إلى 6 كلمات: الموضوع المحدد + المكان + الجو + الإضاءة. صور الأعمال والمواد والأماكن والأدوات، لا وجوه ولا بورتريه. الصفحة الهادئة: soft natural light, muted tones. الصفحة الحركية: vibrant, bold colors. لا تعتمد على أي صورة من المثال.
7. عربية فصحى سهلة ودافئة تناسب السوق السوري. العنوان بفائدة واضحة. نص الزر فعل + مفعول (احجز موعدك، اطلب معاينة).
8. ممنوع: الإيموجي والرموز (✓ ★)، «نحن الأفضل»، «جودة عالية»، «خدمة مميزة»، «حلول متكاملة»، علامات التعجب المتكررة، وأي ذكر للذكاء الاصطناعي.
9. لا تكتب رقم الهاتف أو العنوان أو ساعات الدوام: تُوضَع من البطاقة.
10. «ملاحظات» في البطاقة هي طلبات صاحب العمل الخاصة: ملزمة، نفّذها في كل قسم تخصه، ولا تخالفها أبداً.
11. لا يبقى شيء من المثال: كل نص وكل صورة في الشريحة تُستبدل بما يناسب هذا العمل وموضوعه. ما كتبه صاحب العمل نفسه (اسمه، خدماته، أسعاره، أسماء فريقه) يُكتب كما هو.`;

// Above the form rules, Eyad's constitution (taste, wording, photos, language) binds every answer; only its output format is not this one's.
const BRIDGE = 'الدستور أعلاه ملزم بكل بنوده في الذوق والنصوص والصور واللغة والسياق الثقافي. صيغة الإخراج هنا ليست شريحة كاملة: الشريحة مصممة سلفاً، والمطلوب JSON بأجزائها فقط كما يلي.';
/** The rules every question of the form way is asked under: the constitution and its appendix first, then the form's own. */
export const formSystem = (rules?: string) => (rules ? `${rules}\n\n${BRIDGE}\n\n${FORM_SYSTEM}` : FORM_SYSTEM);

// The site's kind as the AI reads it (src/data/siteKinds.ts).
const KIND_WORDS: Record<string, string> = {
  page: 'صفحة تعريفية لعمل أو مهنة', restaurant: 'مطعم', shop: 'متجر', cars: 'معرض سيارات', 'rental-cars': 'تأجير سيارات',
  'rental-items': 'تأجير أغراض ومعدات ومساحات', hotel: 'فندق أو مساحات وعقارات للإيجار',
};
const kindWords = (kind: string) => KIND_WORDS[kind] || kind;

// ---------- What the business does ----------

// An activity the AI may name only when the owner did, or when it is what this kind of site does (Eyad, 29 Oct: «نؤجر ونبيع» on a rental
// that only rents). Whole words, with the joined و ف ب ل in front.
const AR = '\u0621-\u064A';
const words = (forms: string) => new RegExp(`(^|[^${AR}])[وفبل]?(${forms})(?=$|[^${AR}])`);
export const ACTIVITIES: { name: string; re: RegExp; kinds: string[] }[] = [
  { name: 'البيع', re: words('نبيع|يبيع|تبيع|بيع|البيع|للبيع|مبيع|مبيعات|المبيعات'), kinds: ['shop', 'cars'] },
  { name: 'الشراء', re: words('نشتري|شراء|الشراء'), kinds: ['shop'] },
  { name: 'التأجير', re: words('نؤجر|نؤجّر|يؤجر|تأجير|التأجير|للتأجير|إيجار|الإيجار|للإيجار|استئجار|الاستئجار'), kinds: ['rental-cars', 'rental-items', 'hotel'] },
  { name: 'التوصيل', re: words('توصيل|التوصيل|نوصل|نوصّل|ديليفري|دليفري'), kinds: [] },
  { name: 'التقسيط', re: words('تقسيط|التقسيط|أقساط|الأقساط'), kinds: [] },
  { name: 'الصيانة', re: words('صيانة|الصيانة|تصليح|التصليح|نصلح|نصلّح'), kinds: [] },
];
/** The activity a text names that the owner never wrote and this kind of site does not do, if any. */
export const inventedActivity = (text: string, kind: string, ownerText: string) =>
  ACTIVITIES.find((a) => a.re.test(text) && !a.kinds.includes(kind) && !a.re.test(ownerText))?.name;

// ---------- Photos ----------

// Every photo search is of the business (Eyad, 29 Oct: shoes and shop shelves on a car rental): its subject, from the owner's kind and
// category, leads every search, and the AI's words only describe the shot. These kinds always carry their own word.
const KIND_PHOTO: Record<string, string> = { restaurant: 'restaurant', cars: 'car', 'rental-cars': 'car', hotel: 'hotel' };
/** The business's photo subject: the AI's translation of the owner's category, with the site's own word when it has one. */
export const photoSubject = (kind: string, subject: string) => {
  const anchor = KIND_PHOTO[kind];
  const base = subject.trim() || 'small local business';
  return anchor && !base.toLowerCase().split(/\s+/).some((w) => w.startsWith(anchor)) ? `${anchor} ${base}` : base;
};
/** A photo search kept on the business: the subject leads it unless the search already names it. */
export const onSubject = (query: string, subject: string) => {
  const q = query.trim();
  const keys = subject.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const out = keys.some((w) => q.toLowerCase().includes(w)) ? q : `${subject} ${q}`;
  return out.split(/\s+/).slice(0, 9).join(' ').slice(0, 78).trim();
};

const FIELD_NOTE: Record<string, string> = { text: 'نص', button: 'نص زر', image: 'كلمات بحث صورة بالإنجليزية', icon: 'اسم أيقونة من القائمة' };
const shapeWord = { wide: 'عريضة', tall: 'طولية', square: 'مربعة' } as const;

const describeField = (f: FormField) => {
  if (f.kind === 'image') return `${f.key} [${FIELD_NOTE.image}] ${f.role}${f.big ? ' كبيرة (خلفية أو صورة رئيسية)' : ''}، ${shapeWord[f.shape || 'wide']}`;
  if (f.kind === 'icon') return `${f.key} [${FIELD_NOTE.icon}] ${f.role}`;
  const length = f.target ? `الطول بين ${Math.max(1, f.min)} و${f.max} حرفاً (المثال ${f.target})` : 'قصير';
  return `${f.key} [${FIELD_NOTE[f.kind]}] ${f.role}، ${length}${f.figure ? '، مثالها فيه رقم: لا تكتب رقماً إلا إن كتبه صاحب العمل' : ''}${f.example ? `، المثال: «${f.example}»` : ''}`;
};

// ---------- The brief for the whole page ----------

const briefSchema = (env: FormEnv, sections: FormSection[]) => ({
  type: 'object',
  properties: {
    look: { type: 'string', enum: Object.keys(env.looks) },
    navbar: {
      type: 'object',
      properties: { layout: { type: 'string', enum: [...env.navLayouts] }, sticky: { type: 'boolean' }, tone: { type: 'string', enum: [...env.navTones] } },
      required: ['layout', 'sticky', 'tone'],
    },
    voice: { type: 'string' },
    imageSubject: { type: 'string' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: { section: { type: 'string', enum: sections.map((s) => s.id) }, angle: { type: 'string' }, tone: { type: 'string', enum: [...env.tones] }, entrance: { type: 'string', enum: env.entrances } },
        required: ['section', 'angle', 'tone', 'entrance'],
      },
    },
  },
  required: ['look', 'navbar', 'voice', 'imageSubject', 'sections'],
});

const briefPrompt = (env: FormEnv, kind: string, profile: Record<string, string>, sections: FormSection[], motion: boolean) =>
  [
    `نوع الموقع: ${kindWords(kind)}`,
    `looks (اختر واحداً منها لكل الصفحة): ${JSON.stringify(Object.fromEntries(Object.entries(env.looks).map(([id, l]) => [id, `${l.name}، يناسب: ${l.forWho}. خلفية ${l.bg} ونص ${l.ink} وتمييز ${l.accent}. خط العناوين ${l.head} والنص ${l.body}`])))}`,
    `navbar: layout أفقي (الأشيع) أو hamburger للصفحات البصرية أو vertical نادراً؛ sticky يثبّت الشريط؛ tone لون الشريط. اختر ما يناسب العمل.`,
    `أقسام الصفحة (ثابتة وبهذا الترتيب؛ شرائحها مختارة سلفاً): ${JSON.stringify(sections.map((s) => ({ section: s.id, name: s.name })))}`,
    `بطاقة صاحب العمل (profile):\n${JSON.stringify(profile, null, 1)}`,
    'اكتب الآن ملخص الصفحة:',
    '- voice: صفة نبرة الكلام في جملة (دافئة وواضحة، رسمية هادئة …) تناسب هذا العمل وجمهوره.',
    '- imageSubject: بالإنجليزية 2 إلى 5 كلمات: ترجمة تصنيف هذا العمل واختصاصه كما في البطاقة (التصنيف، الاختصاص، الكتالوج الفرعي) ونوع الموقع، أي ما تُظهره صوره (الأعمال والمواد والمكان والأدوات، لا الوجوه). كل صور الصفحة تُبحث بها.',
    '- لكل قسم: angle جملة واحدة بالعربية عن الفكرة التي يقولها هذا القسم تحديداً، بحيث لا يكرر قسمان الفكرة نفسها؛ و tone (light خلفية الصفحة، tint تمييز خفيف، dark داكن، ولا قسمين داكنين متتاليين)؛ و entrance حركة الدخول' + (motion ? ' (نوّع بين الأقسام)' : ' (none: صفحة هادئة)') + '.',
    'أعد JSON فقط.',
  ].join('\n\n');

// ---------- One section ----------

const valueSchema = (form: SlideForm, env: FormEnv, linkKeys: string[], only?: Set<string>) => {
  const fields = form.fields.filter((f) => !only || only.has(f.key));
  const values: Record<string, object> = {};
  for (const f of fields) values[f.key] = f.kind === 'icon' ? { type: 'string', enum: env.icons } : { type: 'string' };
  const links: Record<string, object> = {};
  for (const k of linkKeys) links[k] = { type: 'string' };
  return {
    type: 'object',
    properties: {
      values: { type: 'object', properties: values, required: Object.keys(values) },
      ...(linkKeys.length && !only ? { links: { type: 'object', properties: links, required: linkKeys } } : {}),
    },
    required: ['values', ...(linkKeys.length && !only ? ['links'] : [])],
  };
};

const sectionPrompt = (o: { kind: string; profile: Record<string, string>; assets: FormAssets; brief: any; section: FormSection; index: number; sections: FormSection[]; form: SlideForm; others: string[] }) => {
  const { brief, section, form } = o;
  const mine = brief.sections.find((s: any) => s.section === section.id);
  const buttons = form.fields.filter((f) => f.kind === 'button').map((f) => f.key);
  const targets = ['whatsapp', 'phone', ...o.sections.map((s, i) => (s.id === section.id ? '' : `slide:${i}`)).filter(Boolean)];
  return [
    `نوع الموقع: ${kindWords(o.kind)}`,
    `بطاقة صاحب العمل (profile):\n${JSON.stringify(o.profile, null, 1)}`,
    `ملخص الصفحة: النبرة: ${brief.voice}. موضوع الصور بالإنجليزية: ${brief.imageSubject}. أقسام الصفحة بترتيبها: ${o.sections.map((s) => s.name).join('، ')}.`,
    `هذا القسم: «${section.name}». الفكرة التي يقولها: ${mine?.angle || section.name}.${o.others.length ? ` لا تكرر ما قالته الأقسام الأخرى: ${o.others.join(' / ')}` : ''}`,
    `أجزاء الشريحة (اكتب كل واحد في values بمفتاحه، لا تترك أحدها):\n${form.fields.map(describeField).join('\n')}`,
    buttons.length ? `الأزرار (${buttons.join('، ')}): ضع في links لكل زر وجهته من: ${targets.join('، ')}. whatsapp و phone لأزرار التواصل، وslide:رقم لزر ينقل لقسم من الصفحة (الأقسام مرقمة من 0 بترتيبها: ${o.sections.map((s, i) => `${i}=${s.name}`).join('، ')}).` : '',
    `assets (صور صاحب العمل): ${JSON.stringify({ heroBg: o.assets.heroBg, galleryCount: o.assets.gallery })}.${o.assets.heroBg && opensPage(section.id) ? ' للصورة الكبيرة في هذا القسم (أول الصفحة) اكتب user:heroBg.' : ''}`,
    'اذكر من نشاط العمل فقط ما ذكره صاحبه في البطاقة: لا تضف بيعاً أو تأجيراً أو توصيلاً أو تقسيطاً أو صيانة لم يذكرها.',
    'أعد JSON فقط.',
  ].filter(Boolean).join('\n\n');
};

type Problem = { key: string; why: string; was: string };

interface Checked {
  slots: Record<string, string>;
  icons: Record<string, string>;
  images: Record<string, string>;
  problems: Problem[];
}

const cutAt = (text: string, max: number) => {
  if ([...text].length <= max) return text;
  const cut = [...text].slice(0, max).join('');
  const space = cut.lastIndexOf(' ');
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[،,؛:\-–\s]+$/, '');
};

const LEAF = (key: string) => key.split('.').pop() || key;

const norm = (t: string) => t.replace(/[\s،,.:؛!؟?«»"'()\-–]+/g, ' ').trim();
/** The text is the example's (or holds a long piece of it), unless the owner wrote those words himself. */
export const copiesExample = (text: string, example: string | undefined, ownerText = '') => {
  const a = norm(text);
  const b = norm(example || '');
  if (!a || [...b].length < 4) return false;
  if (ownerText && norm(ownerText).includes(a)) return false;
  if (a === b) return true;
  return [...b].length >= 14 && (a.includes(b) || ([...a].length >= 14 && b.includes(a)));
};

/** Checks the values the AI gave for one slide: what is good goes in, what is not comes back as a problem to ask again. */
export const checkValues = (form: SlideForm, values: Record<string, unknown>, o: { owners: Set<string>; assets: FormAssets; icons: Set<string>; section: string; ownerText?: string; kind?: string }): Checked => {
  const out: Checked = { slots: {}, icons: {}, images: {}, problems: [] };
  for (const f of form.fields) {
    const raw = typeof values?.[f.key] === 'string' ? (values[f.key] as string) : '';
    if (f.kind === 'icon') {
      if (o.icons.has(raw.trim())) out.icons[f.key] = raw.trim();
      else out.problems.push({ key: f.key, why: 'اسم أيقونة غير موجود في القائمة', was: raw });
      continue;
    }
    if (f.kind === 'image') {
      const ref = raw.trim();
      const gallery = /^user:gallery:(\d{1,2})$/.exec(ref);
      if (ref === 'user:heroBg') {
        if (o.assets.heroBg) out.images[f.key] = ref;
        else out.problems.push({ key: f.key, why: 'لا توجد صورة للمدخل من صاحب العمل: اكتب كلمات بحث', was: raw });
      } else if (gallery) {
        if (+gallery[1] >= 1 && +gallery[1] <= o.assets.gallery) out.images[f.key] = ref;
        else out.problems.push({ key: f.key, why: 'رقم صورة غير موجود', was: raw });
      } else if (IMAGE_QUERY.test(ref)) out.images[f.key] = ref;
      else out.problems.push({ key: f.key, why: 'كلمات البحث لازم تكون بالإنجليزية من 3 إلى 6 كلمات بلا رموز', was: raw });
      continue;
    }
    let text = cleanText(raw, f.max * 2 + 20);
    const leaf = LEAF(f.key);
    if (leaf === 'price' && text && text !== ON_REQUEST && !numbersAreOwners(text, o.owners)) text = ON_REQUEST;
    if (!text) {
      out.problems.push({ key: f.key, why: 'فارغ: لازم تكتب نصاً يناسب العمل', was: raw });
      continue;
    }
    const length = [...text].length;
    if (length > f.max * 1.5 + 8) {
      out.problems.push({ key: f.key, why: `أطول بكثير من المسموح (${f.max} حرفاً)`, was: text });
      continue;
    }
    text = cutAt(text, f.max + 8);
    if (/[0-9٠-٩]/.test(text) && leaf !== 'price' && !numbersAreOwners(text, o.owners)) {
      out.problems.push({ key: f.key, why: 'فيه رقم لم يكتبه صاحب العمل: اكتب كلمة أو عبارة بدل الرقم', was: text });
      continue;
    }
    const invented = o.kind ? inventedActivity(text, o.kind, o.ownerText || '') : undefined;
    if (invented) {
      out.problems.push({ key: f.key, why: `فيه نشاط «${invented}» لم يذكره صاحب العمل: لا تذكره`, was: text });
      continue;
    }
    if (copiesExample(text, f.example, o.ownerText)) {
      out.problems.push({ key: f.key, why: 'منسوخ من المثال: اكتب نصاً يخص هذا العمل', was: text });
      continue;
    }
    // A short text is still a text (a card's title is often a word or two): only a scrap is asked again.
    if (f.target >= 20 && length < 4) {
      out.problems.push({ key: f.key, why: `قصير جداً (المطلوب نحو ${f.target} حرفاً)`, was: text });
      continue;
    }
    out.slots[f.key] = text;
  }
  return out;
};

const fallbackQuery = (subject: string, f: FormField | undefined) => `${subject}${f?.big ? ' wallpaper' : ''}`.replace(/[^a-z0-9 ,\-]/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 78);

// ---------- A slide from the owner's card alone ----------

const rowsOf = (line: string | undefined) => (line || '').split(/[؛;]/).map((r) => r.trim()).filter(Boolean).map((r) => { const [name, ...rest] = r.split(':'); return { name: name.trim(), price: rest.join(':').trim() }; });

/**
 * The slots of a slide written without the AI: the section's name as its title, the owner's description as its text, his services and
 * features as its cards and rows, photos of his business's subject. What the card has nothing for is left empty, and the builder takes
 * that part off the slide (never the example's words).
 */
export const ownersFallback = (form: SlideForm, section: Pick<FormSection, 'id' | 'name' | 'template'>, profile: Record<string, string>, subject: string, buttons: string[] = []): Omit<FormPlannedSection, 'entrance'> => {
  const slots: Record<string, string> = {};
  const images: Record<string, string> = {};
  const services = rowsOf(profile['الخدمات']);
  const features = (profile['المزايا'] || '').split(/[،,]/).map((x) => x.trim()).filter(Boolean);
  const description = (profile['الوصف'] || '').trim();
  const fit = (t: string, f: FormField) => cutAt(cleanText(t, f.max * 2 + 20), f.max);
  for (const f of form.fields) {
    if (f.kind === 'image') { images[f.key] = fallbackQuery(subject, f); continue; }
    if (f.kind === 'icon') continue;
    const item = /^(points|items|packages|chips|facts)\.(\d+)(?:\.(\w+))?$/.exec(f.key);
    let text = '';
    if (item) {
      const n = +item[2];
      const leaf = item[3] || '';
      const fromServices = item[1] === 'items' || item[1] === 'packages' || (item[1] === 'points' && services.length);
      const row = fromServices ? services[n] : undefined;
      if (row && (leaf === 'title' || leaf === 'name')) text = row.name;
      else if (row && leaf === 'price' && row.price && row.price !== ON_REQUEST) text = row.price;
      else if (!row && (item[1] === 'chips' || leaf === 'title' || leaf === 'name' || leaf === 'label') && features[n]) text = features[n];
    } else if (f.key === 'title') text = section.name;
    else if (f.key === 'eyebrow') text = profile['اسم_الصفحة'] || '';
    else if (f.key === 'sub' || f.key === 'text') text = description;
    else if (f.kind === 'button' && buttons.includes(f.key)) text = profile['واتساب'] || profile['هاتف'] ? 'تواصل معنا' : '';
    if (text) slots[f.key] = fit(text, f);
  }
  if (!slots.title && form.fields.some((f) => f.key === 'title')) slots.title = section.name;
  const links: Record<string, string> = {};
  for (const k of buttons) if (slots[k]) links[k] = profile['واتساب'] ? 'whatsapp' : 'phone';
  return { section: section.id, template: section.template, tone: 'light', slots, icons: {}, links, images, fallback: true };
};

// ---------- The whole plan ----------

export interface FormBuildInput {
  env: FormEnv;
  kind: string;
  profile: Record<string, string>;
  assets: FormAssets;
  sections: FormSection[];
  accent?: string;
  motion: boolean;
}

const inPool = async <T, R>(items: T[], size: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> => {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
};

export const buildFormPlan = async (inp: FormBuildInput): Promise<FormPlan> => {
  const { env, kind, profile, assets, sections } = inp;
  const owners = ownersNumbers(profile);
  const ownerText = Object.values(profile).join(' \n ');
  const system = formSystem(env.rules);
  const icons = new Set(env.icons);
  const forms = sections.map((s) => slideForm(s.slide, s.elements));

  const brief = await env.ask(briefPrompt(env, kind, profile, sections, inp.motion), briefSchema(env, sections), system);
  const angles: Record<string, string> = {};
  for (const s of Array.isArray(brief?.sections) ? brief.sections : []) if (s && typeof s.angle === 'string') angles[s.section] = s.angle.slice(0, 200);
  const subject = photoSubject(kind, typeof brief?.imageSubject === 'string' && IMAGE_QUERY.test(brief.imageSubject.trim()) ? brief.imageSubject.trim() : '');
  const safeBrief = { ...brief, voice: String(brief?.voice || '').slice(0, 120), imageSubject: subject, sections: Array.isArray(brief?.sections) ? brief.sections : [] };

  // The owner's own photos: the gallery shows only them, one in each frame, in order.
  const ownersPhotos = (section: FormSection, form: SlideForm, images: Record<string, string>) => {
    if (section.id !== 'gallery') return;
    for (const f of form.fields) {
      if (!/^photos\.\d+$/.test(f.key)) continue;
      const n = +f.key.split('.')[1];
      if (n < assets.gallery) images[f.key] = `user:gallery:${n + 1}`;
      else delete images[f.key];
    }
  };
  const fallback = (section: FormSection, form: SlideForm, buttons: string[]): FormPlannedSection => {
    const out = { ...ownersFallback(form, section, profile, subject, buttons), entrance: 'none' };
    ownersPhotos(section, form, out.images);
    return out;
  };

  const built = await inPool(sections, SIMULTANEOUS, async (section, index): Promise<FormPlannedSection | null> => {
    const form = forms[index];
    // A slide built around a live element (a booking calendar, a search bar, the menu, products or cars) goes into the page as designed
    // when it has nothing for the AI to write.
    const fixed = section.elements.some((e: any) => LIVE_TYPES.includes(e.type));
    const kept = (): FormPlannedSection => ({ section: section.id, template: section.template, tone: 'light', slots: {}, icons: {}, links: {}, images: {}, entrance: 'none' });
    if (!form.fields.length) return kept();
    const buttonKeys = form.fields.filter((f) => f.kind === 'button').map((f) => f.key);
    const others = sections.filter((s) => s.id !== section.id && angles[s.id]).map((s) => angles[s.id]);
    let answer: any;
    try {
      answer = await env.ask(sectionPrompt({ kind, profile, assets, brief: safeBrief, section, index, sections, form, others }), valueSchema(form, env, buttonKeys), system);
    } catch {
      // No section goes silently (Eyad, 28 Oct): the AI failed after its retry, so the slide is written from the owner's card alone.
      return fallback(section, form, buttonKeys);
    }
    let checked = checkValues(form, answer?.values || {}, { owners, assets, icons, section: section.id, ownerText, kind });
    // Only what failed is asked again, once.
    if (checked.problems.length) {
      const again = new Set(checked.problems.map((p) => p.key));
      try {
        const fix = await env.ask(
          [
            `بطاقة صاحب العمل (profile):\n${JSON.stringify(profile, null, 1)}`,
            `هذا القسم: «${section.name}». الفكرة: ${angles[section.id] || section.name}. النبرة: ${safeBrief.voice}.`,
            `الأجزاء التالية كانت إجاباتها غير صالحة. أعد كتابتها كلها في values (لا تترك أحدها):\n${checked.problems.map((p) => { const f = form.fields.find((x) => x.key === p.key)!; return `${describeField(f)}\n  المشكلة: ${p.why}${p.was ? `\n  كتبتَ: «${String(p.was).slice(0, 80)}»` : ''}`; }).join('\n')}`,
            'أعد JSON فقط.',
          ].join('\n\n'),
          valueSchema(form, env, [], again),
          system,
        );
        const merged = { ...(answer?.values || {}), ...(fix?.values || {}) };
        checked = checkValues(form, merged, { owners, assets, icons, section: section.id, ownerText, kind });
      } catch {
        // the first answers stay; what failed goes without text
      }
    }
    const slots = checked.slots;
    const imagesOut = { ...checked.images };
    for (const p of checked.problems) {
      const f = form.fields.find((x) => x.key === p.key);
      if (f?.kind === 'image') imagesOut[f.key] = fallbackQuery(subject, f);
    }
    ownersPhotos(section, form, imagesOut);
    // Nothing the AI wrote and nothing left of it: the slide is written from the owner's card alone.
    if (!Object.keys(slots).length) return fixed ? kept() : fallback(section, form, buttonKeys);
    const links: Record<string, string> = {};
    for (const k of buttonKeys) {
      const to = String(answer?.links?.[k] || '');
      if (LINKS.test(to)) links[k] = to;
    }
    const given = (safeBrief.sections as any[]).find((s) => s?.section === section.id);
    const tone = env.tones.includes(given?.tone) ? given.tone : 'light';
    const entrance = inp.motion ? (env.entrances.includes(given?.entrance) ? given.entrance : 'fade') : 'none';
    return { section: section.id, template: section.template, tone, slots, icons: checked.icons, links, images: imagesOut, entrance };
  });

  const planned = built.filter((s): s is FormPlannedSection => !!s);
  // The owner's own photos come first (Eyad, 29 Oct): on a page without a gallery section they take the photo places in order, and
  // only the places left over are searched; every search is of the business.
  let next = planned.some((s) => s.section === 'gallery') ? assets.gallery : 0;
  for (const s of planned) {
    for (const [key, ref] of Object.entries(s.images)) {
      if (ref.startsWith('user:')) continue;
      s.images[key] = next < assets.gallery ? `user:gallery:${++next}` : onSubject(ref, subject);
    }
  }
  // Buttons may lead only to sections that are on the page, numbered as they are now.
  const ids = sections.map((s) => s.id);
  for (const s of planned) {
    for (const [key, to] of Object.entries(s.links)) {
      const n = /^slide:(\d+)$/.exec(to);
      if (!n) continue;
      const target = ids[+n[1]];
      const now = planned.findIndex((p) => p.section === target);
      if (now < 0 || target === s.section) delete s.links[key];
      else s.links[key] = `slide:${now}`;
    }
  }
  // No two dark sections in a row.
  planned.forEach((s, i) => {
    if (i > 0 && s.tone === 'dark' && planned[i - 1].tone === 'dark') s.tone = 'tint';
  });

  // The AI always picks the same navbar (Eyad, 22 Oct): the server draws it, the AI's own pick counts only when it is not the usual one.
  const nav = safeBrief.navbar || {};
  const rng = env.rng || Math.random;
  const draw = <T extends string>(list: readonly T[], weights: number[]): T => {
    let r = rng() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) if ((r -= weights[i]) < 0) return list[i];
    return list[0];
  };
  const layouts = env.navLayouts.filter((l) => ['horizontal', 'hamburger', 'vertical'].includes(l));
  const pickedLayout = env.navLayouts.includes(nav.layout) ? nav.layout : 'horizontal';
  const layout = pickedLayout !== 'horizontal' ? pickedLayout : draw(layouts, layouts.map((l) => (l === 'horizontal' ? 5 : l === 'hamburger' ? 2 : 1)));
  const pickedTone = env.navTones.includes(nav.tone) ? nav.tone : 'light';
  const tone = pickedTone !== 'light' ? pickedTone : draw(env.navTones, env.navTones.map((t) => (t === 'light' ? 3 : t === 'tint' ? 2 : t === 'dark' ? 2 : 1)));
  return {
    look: typeof brief?.look === 'string' && env.looks[brief.look] ? brief.look : env.defaultLook,
    navbar: { layout, sticky: typeof nav.sticky === 'boolean' ? nav.sticky : true, tone },
    ...(inp.accent ? { accentColor: inp.accent } : {}),
    motion: inp.motion,
    sections: planned,
  };
};
