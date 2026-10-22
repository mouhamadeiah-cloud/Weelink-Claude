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
import { ON_REQUEST, cleanText, numbersAreOwners, ownersNumbers } from './aiText.js';

export interface FormSection {
  id: string; // the plan's section id (intro, about, contact …)
  name: string;
  template: string; // `g:{id}`
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
9. لا تكتب رقم الهاتف أو العنوان أو ساعات الدوام: تُوضَع من البطاقة.`;

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
    `نوع الصفحة: ${kind}`,
    `looks (اختر واحداً منها لكل الصفحة): ${JSON.stringify(Object.fromEntries(Object.entries(env.looks).map(([id, l]) => [id, `${l.name}، يناسب: ${l.forWho}. خلفية ${l.bg} ونص ${l.ink} وتمييز ${l.accent}. خط العناوين ${l.head} والنص ${l.body}`])))}`,
    `navbar: layout أفقي (الأشيع) أو hamburger للصفحات البصرية أو vertical نادراً؛ sticky يثبّت الشريط؛ tone لون الشريط. اختر ما يناسب العمل.`,
    `أقسام الصفحة (ثابتة وبهذا الترتيب؛ شرائحها مختارة سلفاً): ${JSON.stringify(sections.map((s) => ({ section: s.id, name: s.name })))}`,
    `بطاقة صاحب العمل (profile):\n${JSON.stringify(profile, null, 1)}`,
    'اكتب الآن ملخص الصفحة:',
    '- voice: صفة نبرة الكلام في جملة (دافئة وواضحة، رسمية هادئة …) تناسب هذا العمل وجمهوره.',
    '- imageSubject: بالإنجليزية 3 إلى 5 كلمات تصف ما تُظهره صور هذا العمل (الأعمال والمواد والمكان والأدوات، لا الوجوه).',
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
    `نوع الصفحة: ${o.kind}`,
    `بطاقة صاحب العمل (profile):\n${JSON.stringify(o.profile, null, 1)}`,
    `ملخص الصفحة: النبرة: ${brief.voice}. موضوع الصور بالإنجليزية: ${brief.imageSubject}. أقسام الصفحة بترتيبها: ${o.sections.map((s) => s.name).join('، ')}.`,
    `هذا القسم: «${section.name}». الفكرة التي يقولها: ${mine?.angle || section.name}.${o.others.length ? ` لا تكرر ما قالته الأقسام الأخرى: ${o.others.join(' / ')}` : ''}`,
    `أجزاء الشريحة (اكتب كل واحد في values بمفتاحه، لا تترك أحدها):\n${form.fields.map(describeField).join('\n')}`,
    buttons.length ? `الأزرار (${buttons.join('، ')}): ضع في links لكل زر وجهته من: ${targets.join('، ')}. whatsapp و phone لأزرار التواصل، وslide:رقم لزر ينقل لقسم من الصفحة (الأقسام مرقمة من 0 بترتيبها: ${o.sections.map((s, i) => `${i}=${s.name}`).join('، ')}).` : '',
    `assets (صور صاحب العمل): ${JSON.stringify({ heroBg: o.assets.heroBg, galleryCount: o.assets.gallery })}.${o.assets.heroBg && section.id === 'intro' ? ' للصورة الكبيرة في المدخل اكتب user:heroBg.' : ''}`,
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

/** Checks the values the AI gave for one slide: what is good goes in, what is not comes back as a problem to ask again. */
export const checkValues = (form: SlideForm, values: Record<string, unknown>, o: { owners: Set<string>; assets: FormAssets; icons: Set<string>; section: string }): Checked => {
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
    if (f.target >= 15 && text === f.example) {
      out.problems.push({ key: f.key, why: 'منسوخ من المثال: اكتب نصاً يخص هذا العمل', was: text });
      continue;
    }
    if (f.target >= 20 && length < f.min && length < 12) {
      out.problems.push({ key: f.key, why: `قصير جداً (المطلوب نحو ${f.target} حرفاً)`, was: text });
      continue;
    }
    out.slots[f.key] = text;
  }
  return out;
};

const fallbackQuery = (subject: string, f: FormField | undefined) => `${subject}${f?.big ? ' wallpaper' : ''}`.replace(/[^a-z0-9 ,\-]/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 78);

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
  const icons = new Set(env.icons);
  const forms = sections.map((s) => slideForm(s.slide, s.elements));

  const brief = await env.ask(briefPrompt(env, kind, profile, sections, inp.motion), briefSchema(env, sections), FORM_SYSTEM);
  const angles: Record<string, string> = {};
  for (const s of Array.isArray(brief?.sections) ? brief.sections : []) if (s && typeof s.angle === 'string') angles[s.section] = s.angle.slice(0, 200);
  const subject = typeof brief?.imageSubject === 'string' && IMAGE_QUERY.test(brief.imageSubject.trim()) ? brief.imageSubject.trim() : 'professional workplace';
  const safeBrief = { ...brief, voice: String(brief?.voice || '').slice(0, 120), imageSubject: subject, sections: Array.isArray(brief?.sections) ? brief.sections : [] };

  const built = await inPool(sections, SIMULTANEOUS, async (section, index): Promise<FormPlannedSection | null> => {
    const form = forms[index];
    if (!form.fields.length) return null;
    const buttonKeys = form.fields.filter((f) => f.kind === 'button').map((f) => f.key);
    const others = sections.filter((s) => s.id !== section.id && angles[s.id]).map((s) => angles[s.id]);
    let answer: any;
    try {
      answer = await env.ask(sectionPrompt({ kind, profile, assets, brief: safeBrief, section, index, sections, form, others }), valueSchema(form, env, buttonKeys), FORM_SYSTEM);
    } catch (err) {
      if (index === 0) throw err;
      return null; // another section may go; the page needs its first
    }
    let checked = checkValues(form, answer?.values || {}, { owners, assets, icons, section: section.id });
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
          FORM_SYSTEM,
        );
        const merged = { ...(answer?.values || {}), ...(fix?.values || {}) };
        checked = checkValues(form, merged, { owners, assets, icons, section: section.id });
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
    // The owner's own photos: the gallery shows only them, one in each frame, in order.
    if (section.id === 'gallery') {
      for (const f of form.fields) {
        if (!/^photos\.\d+$/.test(f.key)) continue;
        const n = +f.key.split('.')[1];
        if (n < assets.gallery) imagesOut[f.key] = `user:gallery:${n + 1}`;
        else delete imagesOut[f.key];
      }
    }
    // Nothing the AI wrote and nothing left of it: an empty slide is not built.
    if (!Object.keys(slots).length) return null;
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

  const nav = safeBrief.navbar || {};
  return {
    look: typeof brief?.look === 'string' && env.looks[brief.look] ? brief.look : env.defaultLook,
    navbar: {
      layout: env.navLayouts.includes(nav.layout) ? nav.layout : 'horizontal',
      sticky: typeof nav.sticky === 'boolean' ? nav.sticky : true,
      tone: env.navTones.includes(nav.tone) ? nav.tone : 'light',
    },
    ...(inp.accent ? { accentColor: inp.accent } : {}),
    motion: inp.motion,
    sections: planned,
  };
};

/** The form plan and the code-slide sections in the model's order. The form sections' `slide:N` buttons were numbered among the form
 * sections only: they are renumbered among all. */
export const mergePlans = (formPlan: FormPlan, codeSections: FormPlannedSection[], order: string[]): FormPlan => {
  const byId = new Map<string, FormPlannedSection>([...formPlan.sections, ...codeSections].map((x) => [x.section, x]));
  const ordered = order.map((id) => byId.get(id)).filter((x): x is FormPlannedSection => !!x);
  const sections = formPlan.sections.map((fs) => {
    const links: Record<string, string> = {};
    for (const [key, to] of Object.entries(fs.links)) {
      const n = /^slide:(\d+)$/.exec(to);
      if (!n) { links[key] = to; continue; }
      const now = ordered.findIndex((x) => x.section === formPlan.sections[+n[1]]?.section);
      if (now >= 0) links[key] = `slide:${now}`;
    }
    return { ...fs, links };
  });
  return { ...formPlan, sections: ordered.map((x) => sections.find((f) => f.section === x.section) || x) };
};
