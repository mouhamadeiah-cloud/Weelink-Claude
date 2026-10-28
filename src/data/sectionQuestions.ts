// What Wee AI asks for each section of a page model (Eyad, 28 Oct): one registry of the questions of every section, and the questions a
// page gets are worked out from its model and package, so a section added to a model, or a package that opens one, changes the questions
// by itself. A question is skipped with «تخطّى»: the AI then writes the section's content from what it knows (examples are marked as such).
import { MODEL_CATEGORIES, ModelSection, SectionMode, pagesOf, PageModel } from './pageModels';

export type QuestionKind =
  | 'text' // one short line
  | 'longText' // a few sentences
  | 'list' // rows of (name, price, note...), `count` of them to start with
  | 'photo' // one photo
  | 'photos' // several photos
  | 'choice' // one of a few options
  | 'settings'; // the section's settings (booking hours, tables...) with defaults

export interface SectionQuestion {
  id: string;
  kind: QuestionKind;
  label: string;
  hint?: string;
  count?: number; // list: rows asked for now; the owner may add more
  fields?: string[]; // list: the parts of a row
  choices?: string[]; // choice
  saves: string; // where the answer goes, for the builder and the editor
  existing?: boolean; // already asked by an earlier step of Wee AI (the description), so not asked again
  custom?: string; // asked with a form of the chat's own (gallery, hero, services, features); sections that share one form ask it once
}

export interface SectionAsk {
  title: string; // how the section is called in the questions
  intro?: string; // what the section is, shown once above its questions
  explain?: string; // Wee AI's own words to the owner about the section: what it is for and what to write ({name} = his first name)
  questions: SectionQuestion[];
  note?: string; // «تقدر تغيّر ... لاحقاً»
}

const LATER = 'تقدر تغيّرها أو تزيد عليها لاحقاً من المحرر.';
const SKIP = 'إذا تخطّيت، يكتبها Wee AI ويعلّمها «مثال» لتحذفها.';

// Keys are a model section's category, or `${category}:${part}` for the parts of a restaurant, shop and cars.
export const SECTION_ASKS: Record<string, SectionAsk> = {
  intro: {
    title: 'الواجهة', explain: 'هاد أول شي بيشوفه زبونك لما يفتح صفحتك، فهالجملة لازم تقول شو بتشتغل بسطر واحد. يا {name}، اكتبها متل ما بتحكيها لزبون جديد، وWee AI بيحطها تحت اسم صفحتك. الصورة اختيارية، وإذا حطيتها بتصير خلفية الواجهة.',
    questions: [
      { id: 'tagline', kind: 'text', label: 'جملة تعرّف بعملك بسطر واحد', hint: 'مثال: أبواب وشبابيك بمقاس طلبك', saves: 'aiAnswers.description' },
      { id: 'heroPhoto', custom: 'hero', kind: 'photo', label: 'صورة الواجهة (اختياري)', hint: SKIP, saves: 'aiAnswers.heroBgImage' },
    ],
  },
  about: {
    title: 'من نحن', explain: 'قسم «من نحن» بيخلي زبونك يطمّن إلك ويعرف مين ورا الصفحة. احكي بكم سطر كيف بلّش شغلك وشو بيميزك عن غيرك، وWee AI بيرتبها بأسلوب مرتب. ما لازم تطوّل.',
    questions: [{ id: 'story', existing: true, kind: 'longText', label: 'احكِ لنا عن عملك وبدايته وما يميّزك', hint: SKIP, saves: 'aiAnswers.description' }],
  },
  services: {
    title: 'الخدمات', explain: 'هون بتعرض خدماتك على شكل بطاقات واضحة، كل بطاقة بإسم الخدمة وسطر قصير عنها. اكتب الأهم أولاً لأنه بيظهر أول. الي ما بتكتبه، Wee AI بيقترحه ويعلّمه «مثال» لتحذفه.',
    note: LATER,
    questions: [{ id: 'services', custom: 'services', kind: 'list', label: 'خدماتك', hint: 'اكتب أهم خدماتك', count: 5, fields: ['name', 'note'], saves: 'aiAnswers.services' }],
  },
  prices: {
    title: 'قائمة الأسعار', explain: 'قائمة الأسعار بتوفّر على زبونك سؤال «بكم؟». كل عنصر بتكتبه مع سعره بيصير سطر بلوحة الأسعار بصفحتك، وهي نفسها اللوحة اللي بتعدّلها من المحرر بأي وقت.',
    intro: 'نضيف العناصر التي تكتبها في لوحة الأسعار مع أسعارها.',
    note: LATER,
    questions: [{ id: 'priceRows', custom: 'services', kind: 'list', label: 'خمسة عناصر مع أسعارها', hint: 'سنضيف هذه الخمسة مبدئياً ويمكنك الزيادة عليها.', count: 5, fields: ['name', 'price'], saves: 'aiAnswers.services' }],
  },
  gallery: {
    title: 'معرض الصور', explain: 'الصور بتحكي أكتر من الكلام. المعرض بيعرض صور شغلك بشكل مرتب، وعدد الصور بيتبع باقتك. تقدر تضيف الصور الآن أو تتركها للمحرر.',
    note: 'تقدر تبدّل الصور وترتبها لاحقاً.',
    questions: [{ id: 'photos', custom: 'gallery', kind: 'photos', label: 'صور عن عملك', hint: 'أضف ما تريد الآن، وحد المعرض يتبع باقتك.', saves: 'aiAnswers.galleryImages' }],
  },
  features: {
    title: 'لماذا نحن', explain: 'هون بتقول «ليش نختارك؟» بكم نقطة قصيرة، متل: سرعة بالتوصيل، ضمان، خبرة طويلة. كل ميزة بتظهر ببطاقة صغيرة مع أيقونة، وإذا تخطّيت Wee AI بيقترح مزايا مناسبة لشغلك.',
    questions: [{ id: 'features', custom: 'features', kind: 'list', label: 'المميزات التي تحب إضافتها', hint: SKIP, count: 4, fields: ['name'], saves: 'aiAnswers.features' }],
  },
  team: {
    title: 'فريق العمل', explain: 'زبونك بيحب يعرف مين رح يتعامل معه. اكتب اسم كل شخص بالفريق ودوره، والصور بتضيفها من المحرر. إذا تخطّيت، Wee AI بيحط أسماء مثال وبتبدّلها.',
    note: 'تقدر تغيّر الأسماء والصور لاحقاً.',
    questions: [{ id: 'team', kind: 'list', label: 'هل ترغب بإضافة أسماء فريقك وصورهم؟', hint: SKIP, count: 3, fields: ['name', 'role', 'photo'], saves: 'team' }],
  },
  projects: {
    title: 'أعمالنا', explain: '«أعمالنا» بتثبت كلامك بالدليل: مشاريع أو شغلات نفّذتها فعلاً. اكتب اسم كل عمل وسطر عنه، والصور بتزيدها من المحرر.',
    note: LATER,
    questions: [{ id: 'projects', kind: 'list', label: 'أبرز أعمالك أو مشاريعك', hint: SKIP, count: 3, fields: ['name', 'note', 'photo'], saves: 'aiAnswers.projects' }],
  },
  video: {
    title: 'فيديو', explain: 'فيديو قصير بيعرّف بشغلك بيخلي الصفحة أحيّ. حط رابط فيديو من يوتيوب مثلاً. إذا ما عندك، الأمر عادي: القسم بيتخبّى وما بيطلع فاضي.',
    questions: [{ id: 'video', kind: 'text', label: 'رابط فيديو يعرّف بعملك (اختياري)', hint: 'إن لم يكن لديك، يُترك القسم دون فيديو.', saves: 'aiAnswers.video' }],
  },
  booking: {
    title: 'حجز المواعيد', explain: 'هيك زبونك بيحجز موعد بنفسه من صفحتك بدون اتصال. بتحدد أيام عملك وساعاته ومدة كل موعد، وكل حجز بيوصلك على إيميلك وبيظهر بلوحة «المواعيد». وإذا تخطّيت، منضع أيام العمل المعتادة.',
    intro: 'الزبون يحجز موعداً مباشرة من صفحتك.',
    note: 'كل الإعدادات تقدر تغيّرها من «إعدادات الحجز».',
    questions: [
      { id: 'bookingKind', kind: 'choice', label: 'ماذا يحجز زبونك؟', choices: ['موعد أو استشارة', 'مقعد في جلسة أو دورة'], saves: 'bookingSettings.type' },
      { id: 'bookingSettings', kind: 'settings', label: 'تحب تضبط إعدادات حجزك الآن؟', hint: 'أيام العمل وساعاته ومدة الموعد. إذا تخطّيت، نضع أيام العمل المعتادة ومدة 30 دقيقة.', saves: 'bookingSettings' },
    ],
  },
  special_offer: {
    title: 'عرض خاص', explain: 'العرض الخاص بيظهر ببطاقة لافتة على الصفحة ليجذب الزبون: خصم، باقة، أو مناسبة. اكتب اسم العرض وسطر عنه وسعره إن وجد.',
    note: LATER,
    questions: [{ id: 'offer', kind: 'list', label: 'عرض أو أكثر تحب إبرازه', hint: SKIP, count: 1, fields: ['name', 'note', 'price'], saves: 'aiAnswers.offers' }],
  },
  ratings: {
    title: 'التقييمات', explain: 'زوار صفحتك بيقيّموك بنجوم وبيكتبوا رأيهم، وبتشوف التقييمات وبتردّ عليها من لوحتك. ما بدك تعمل شي هون، بس انتبه إن التقييم بيحتاج من الزائر إيميل لتأكيده.',
    intro: 'زوار صفحتك يقيّمونك وتظهر آراؤهم، وتدير التقييمات من لوحتك.',
    questions: [],
  },
  contact: {
    title: 'تواصل معنا', explain: 'هون بيلاقوا طريقهم إليك: العنوان والهاتف وواتساب اللي أعطيتنا إياهم، مع الخريطة. اللي ناقص بس ساعات عملك لتظهر بالصفحة.',
    questions: [{ id: 'hours', kind: 'text', label: 'ساعات عملك (اختياري)', saves: 'contactInfo.hours' }],
  },
  privacy: {
    title: 'الشروط والخصوصية', explain: 'الشروط وسياسة الخصوصية بتحمي شغلك وبتعطي زبونك ثقة. Wee AI بيحط نصوص جاهزة، وبتقدر تعدلها أو تحذفها لاحقاً.',
    intro: 'شروط وسياسة خصوصية جاهزة، وتقدر تحذفها لاحقاً.',
    questions: [],
  },
  'restaurant:front': {
    title: 'واجهة المطعم', explain: 'واجهة المطعم بتفتح شهية الزبون من أول نظرة. اذكر طبقك الأشهر أو الشي اللي بيميّزك، وWee AI بيبني الواجهة حوله.',
    questions: [{ id: 'dishNote', kind: 'text', label: 'طبقك أو ميزتك الأشهر', hint: SKIP, saves: 'aiAnswers.description' }, { id: 'heroPhoto', custom: 'hero', kind: 'photo', label: 'صورة الواجهة (اختياري)', hint: SKIP, saves: 'aiAnswers.heroBgImage' }],
  },
  'restaurant:main': {
    title: 'المنيو', explain: 'المنيو هو قلب صفحة مطعمك: الزبون بيتصفحه وبيطلب منه. اكتب مجموعاتك الرئيسية (مقبلات، مشاوي...) وخمسة أطباق بأسعارها، وبتنضاف فعلاً لقائمة مطعمك. بعدين بتكمّل الباقي بنفسك من المحرر.',
    intro: 'نضيف الأطباق التي تكتبها إلى المنيو بأسعارها.',
    note: LATER,
    questions: [
      { id: 'groups', kind: 'list', label: 'ما المجموعات الرئيسية لأطباق مطعمك؟', hint: 'مثل: مشاويات، مقبلات، حلويات، مشروبات. ' + SKIP, count: 4, fields: ['name'], saves: 'restaurant.catalogs' },
      { id: 'dishes', kind: 'list', label: 'خمسة أطباق مع أسعارها', hint: 'تظهر مبدئياً في المنيو ويمكنك الزيادة عليها. ' + SKIP, count: 5, fields: ['name', 'price', 'photo'], saves: 'restaurant.menu' },
    ],
  },
  'shop:front': { title: 'واجهة المتجر', explain: 'واجهة المتجر هي أول انطباع عن بضاعتك. قل شو بيميّز متجرك، سواء جودة أو سعر أو تنوّع، وWee AI بيبني الواجهة عليه.', questions: [{ id: 'shopNote', kind: 'text', label: 'ما الذي يميّز متجرك؟', hint: SKIP, saves: 'aiAnswers.description' }, { id: 'heroPhoto', custom: 'hero', kind: 'photo', label: 'صورة الواجهة (اختياري)', hint: SKIP, saves: 'aiAnswers.heroBgImage' }] },
  'shop:main': {
    title: 'المنتجات', explain: 'هاد قسم منتجاتك: الزبون بيتصفحها وبيضيفها للسلة. اكتب مجموعات متجرك وخمسة منتجات بأسعارها، وبتنضاف فعلاً لمستودعك، وبعدين بتزيد الباقي من المحرر.',
    note: LATER,
    questions: [
      { id: 'groups', kind: 'list', label: 'ما المجموعات الرئيسية لمتجرك؟', hint: 'مثل: ملابس، أحذية، إكسسوارات. ' + SKIP, count: 4, fields: ['name'], saves: 'shop.catalogs' },
      { id: 'products', kind: 'list', label: 'خمسة منتجات مع أسعارها', hint: 'تظهر مبدئياً في المتجر ويمكنك الزيادة عليها. ' + SKIP, count: 5, fields: ['name', 'price', 'photo'], saves: 'shop.products' },
    ],
  },
  'cars:front': { title: 'واجهة المعرض', explain: 'واجهة المعرض بتعرّف الزبون على نوع سياراتك وثقته فيك. قل شو بيميّز معرضك، مثلاً فحص مضمون أو تقسيط، وWee AI بيبني الواجهة عليه.', questions: [{ id: 'carsNote', kind: 'text', label: 'ما الذي يميّز معرضك؟', hint: SKIP, saves: 'aiAnswers.description' }, { id: 'heroPhoto', custom: 'hero', kind: 'photo', label: 'صورة الواجهة (اختياري)', hint: SKIP, saves: 'aiAnswers.heroBgImage' }] },
  'cars:main': {
    title: 'السيارات', explain: 'هون بتعرض سياراتك بسعرها لتظهر ببطاقات بمعرضك. اكتب أنواع السيارات الرئيسية وخمس سيارات بأسعارها (الماركة أول كلمة، والسنة إذا بتحب)، وبتنضاف فعلاً لمعرضك.',
    note: LATER,
    questions: [
      { id: 'groups', kind: 'list', label: 'ما أنواع السيارات الرئيسية في معرضك؟', hint: 'مثل: سياحية، رباعية الدفع، فانات. ' + SKIP, count: 3, fields: ['name'], saves: 'cars.groups' },
      { id: 'cars', kind: 'list', label: 'خمس سيارات مع أسعارها', hint: 'تظهر مبدئياً في المعرض ويمكنك الزيادة عليها. ' + SKIP, count: 5, fields: ['name', 'price', 'photo'], saves: 'cars.listings' },
    ],
  },
  table: {
    title: 'قائمة الأسعار', explain: 'جدول الأسعار بيعرض عناصرك وأسعارها بشكل مرتب سطر سطر، وبيسهّل على زبونك المقارنة. العناصر اللي كتبتها بالأسئلة السابقة هي اللي بتظهر فيه.',
    note: LATER,
    questions: [{ id: 'priceRows', custom: 'services', kind: 'list', label: 'خمسة عناصر مع أسعارها', hint: 'سنضيف هذه الخمسة مبدئياً ويمكنك الزيادة عليها.', count: 5, fields: ['name', 'price'], saves: 'aiAnswers.services' }],
  },
  search: { title: 'البحث', explain: 'شريط بحث بيساعد زبونك يلاقي اللي بدو ياه بسرعة بين أقسام صفحتك. ما بدك تعمل شي، Wee AI بيضيفه لحاله.', intro: 'شريط بحث على أقسام صفحتك، ولا يحتاج منك شيئاً.', questions: [] },
  featured: { title: 'عروض مميزة', explain: 'هون بتظهر العناصر اللي بتعلّمها «مميز» من لوحتك، كعروض أو أصناف بدك تبرزها. بتختار المميّز بعدين من المحرر.', intro: 'تظهر هنا العناصر التي تعلّمها «مميز» من لوحتك.', questions: [] },
};

// How the sections of a rental or hotel are worded (they build from the showroom's and the shop's sections but rent things out).
const BY_KIND: Record<string, Record<string, Partial<SectionAsk> & { questionLabels?: Record<string, string> }>> = {
  rental: {
    'cars:main': { title: 'ما تؤجّره', questionLabels: { groups: 'ما الأنواع الرئيسية لما تؤجّره؟', cars: 'خمسة عناصر للتأجير مع سعر اليوم' } },
    'shop:main': { title: 'ما تؤجّره', questionLabels: { groups: 'ما الأنواع الرئيسية لما تؤجّره؟', products: 'خمسة عناصر للتأجير مع سعر اليوم' } },
  },
  hotel: {
    'shop:main': { title: 'الغرف والوحدات', questionLabels: { groups: 'ما أنواع غرفك أو وحداتك؟', products: 'خمس غرف أو وحدات مع سعر الليلة' } },
  },
};

/** The entry of a section worded for the kind of project (a rental's items, a hotel's rooms). */
export const askFor = (s: Pick<ModelSection, 'category' | 'part'>, kind?: string): SectionAsk | undefined => {
  const base = askOf(s);
  const over = kind ? BY_KIND[kind]?.[s.part ? `${s.category}:${s.part}` : s.category] : undefined;
  if (!base || !over) return base;
  return { ...base, title: over.title || base.title, questions: base.questions.map((q) => ({ ...q, label: over.questionLabels?.[q.id] || q.label })) };
};

/** The entry of a model section: its part first (restaurant:main), then its category. */
export const askOf = (s: Pick<ModelSection, 'category' | 'part'>): SectionAsk | undefined =>
  (s.part ? SECTION_ASKS[`${s.category}:${s.part}`] : undefined) || SECTION_ASKS[s.category];

export interface AskedSection { id: string; mode: SectionMode; defaultOn: boolean; ask: SectionAsk }
export interface QuestionPlan {
  /** The sections the owner ticks (the «يختاره الزبون» ones), with their default. */
  choices: AskedSection[];
  /** The sections that are always asked (always, and «إذا توفّر» since the answer is what makes them available). */
  fixed: AskedSection[];
}

/**
 * The questions of a model, over all of its pages: the sections the owner can tick, and those asked whatever he ticks. A section found twice
 * (the same in two pages) is asked once. A model section the registry does not know is left out here and named by `unknownSections`.
 */
export const questionPlan = (model: Pick<PageModel, 'sections' | 'pages'>, kind?: string): QuestionPlan => {
  const out: QuestionPlan = { choices: [], fixed: [] };
  const seen = new Set<string>();
  for (const page of pagesOf(model)) {
    for (const s of page.sections) {
      const id = s.part ? `${s.category}:${s.part}` : s.category;
      const ask = askFor(s, kind);
      if (!ask || seen.has(id)) continue;
      seen.add(id);
      const item: AskedSection = { id, mode: s.mode, defaultOn: s.defaultOn === true, ask };
      (s.mode === 'ask' ? out.choices : out.fixed).push(item);
    }
  }
  return out;
};

/** The questions to show once the owner ticked these sections: the fixed ones and the ticked ones, in the model's order. */
export const questionsFor = (model: Pick<PageModel, 'sections' | 'pages'>, ticked: string[] | undefined, kind?: string): AskedSection[] => {
  const plan = questionPlan(model, kind);
  const on = new Set(ticked ?? plan.choices.filter((c) => c.defaultOn).map((c) => c.id));
  // Questions an earlier step already asked are left out; a section left with none is not asked.
  // A form two sections share (the rows of services and of the price list) is asked once, with the first of them.
  const formsAsked = new Set<string>();
  // In the order of the model's pages and sections, as the page is built.
  const order = new Map<string, number>();
  pagesOf(model).forEach((p) => p.sections.forEach((x) => { const id = x.part ? `${x.category}:${x.part}` : x.category; if (!order.has(id)) order.set(id, order.size); }));
  return [...plan.fixed, ...plan.choices.filter((c) => on.has(c.id))]
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((s) => ({
      ...s,
      ask: {
        ...s.ask,
        questions: s.ask.questions.filter((q) => {
          if (q.existing) return false;
          if (q.custom) { if (formsAsked.has(q.custom)) return false; formsAsked.add(q.custom); }
          return true;
        }),
      },
    }))
    .filter((s) => s.ask.questions.length > 0);
};

/** Model sections the registry has no entry for: a new section must get its questions (or an empty entry) here. */
export const unknownSections = (model: Pick<PageModel, 'sections' | 'pages'>): string[] =>
  pagesOf(model).flatMap((p) => p.sections).filter((s) => !askOf(s)).map((s) => (s.part ? `${s.category}:${s.part}` : s.category));

/** Every model category (and the parts the model screen offers) has an entry. */
export const missingEntries = (): string[] => MODEL_CATEGORIES.map((c) => c.id).filter((id) => !SECTION_ASKS[id] && !SECTION_ASKS[`${id}:front`]);

export const DAYS = [
  { id: 6, name: 'السبت' }, { id: 0, name: 'الأحد' }, { id: 1, name: 'الإثنين' }, { id: 2, name: 'الثلاثاء' },
  { id: 3, name: 'الأربعاء' }, { id: 4, name: 'الخميس' }, { id: 5, name: 'الجمعة' },
];

/** The first word of the owner's name, or nothing when he has not given it yet (or the page is a company's). */
export const firstNameOf = (fullName: string | undefined, title?: string): string => (title === 'شركة' ? '' : (fullName || '').trim().split(/\s+/)[0] || '');

/** Wee AI's words to the owner: «يا {name}،» turns into his first name, and goes away while Wee AI does not know it yet. */
export const withName = (text: string, name: string): string =>
  text.replace(/يا \{name\}[،,]?\s*/g, name ? `يا ${name}، ` : '').replace(/\{name\}/g, name);

/** Where an answer of a section is kept: `${section}.${question}`. */
export const answerKey = (sectionId: string, q: Pick<SectionQuestion, 'id'>): string => `${sectionId}.${q.id}`;

/** What the owner answered, in a line for the chat (empty when he answered nothing). */
export const summarizeAnswer = (q: SectionQuestion, value: any): string => {
  if (value == null || value === '') return '';
  if (q.kind === 'list') {
    return (Array.isArray(value) ? value : [])
      .filter((r: Record<string, string>) => r?.name?.trim())
      .map((r: Record<string, string>) => [r.name.trim(), r.price?.trim() && `(${r.price.trim()})`, r.role?.trim() && `- ${r.role.trim()}`].filter(Boolean).join(' '))
      .join('، ');
  }
  if (q.kind === 'settings') {
    if (!value.now) return 'أضبطها لاحقاً من الإدارة';
    const days = DAYS.filter((d) => (value.days || []).includes(d.id)).map((d) => d.name).join('، ');
    return `${days || 'بدون أيام'} من ${value.from} إلى ${value.to}، مدة الموعد ${value.minutes} دقيقة`;
  }
  return typeof value === 'string' ? value.trim() : '';
};

/** A section's answers in a line; empty when he skipped it or left it blank. */
export const summarizeSection = (id: string, ask: SectionAsk, answers: Record<string, any>, custom?: (form: string) => string): string =>
  ask.questions.map((q) => (q.custom && custom ? custom(q.custom) : summarizeAnswer(q, answers[answerKey(id, q)]))).filter(Boolean).join(' · ');

/** The answers without those of the given sections (an unticked section leaves nothing behind). */
export const pruneAnswers = (answers: Record<string, any>, sectionIds: string[]): Record<string, any> =>
  Object.fromEntries(Object.entries(answers).filter(([k]) => !sectionIds.some((id) => k.startsWith(`${id}.`))));

/** The ready-slide category that shows what a section looks like in the page (the store sections show their store slide; ratings have none). */
export const previewCategoryOf = (sectionId: string): string | undefined => {
  if (sectionId.endsWith(':front')) return 'intro';
  if (sectionId.endsWith(':main')) return sectionId.split(':')[0];
  return sectionId === 'ratings' ? undefined : sectionId;
};
