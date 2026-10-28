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
  existing?: boolean; // already asked by an earlier step of Wee AI (description, services, features, photos), so not asked again
}

export interface SectionAsk {
  title: string; // how the section is called in the questions
  intro?: string; // what the section is, shown once above its questions
  questions: SectionQuestion[];
  note?: string; // «تقدر تغيّر ... لاحقاً»
}

const LATER = 'تقدر تغيّرها أو تزيد عليها لاحقاً من المحرر.';
const SKIP = 'إذا تخطّيت، يكتبها Wee AI ويعلّمها «مثال» لتحذفها.';

// Keys are a model section's category, or `${category}:${part}` for the parts of a restaurant, shop and cars.
export const SECTION_ASKS: Record<string, SectionAsk> = {
  intro: {
    title: 'الواجهة',
    questions: [
      { id: 'tagline', kind: 'text', label: 'جملة تعرّف بعملك بسطر واحد', hint: 'مثال: أبواب وشبابيك بمقاس طلبك', saves: 'aiAnswers.description' },
      { id: 'heroPhoto', existing: true, kind: 'photo', label: 'صورة الواجهة (اختياري)', hint: SKIP, saves: 'aiAnswers.heroBgImage' },
    ],
  },
  about: {
    title: 'من نحن',
    questions: [{ id: 'story', existing: true, kind: 'longText', label: 'احكِ لنا عن عملك وبدايته وما يميّزك', hint: SKIP, saves: 'aiAnswers.description' }],
  },
  services: {
    title: 'الخدمات',
    note: LATER,
    questions: [{ id: 'services', existing: true, kind: 'list', label: 'خدماتك', hint: 'اكتب أهم خدماتك', count: 5, fields: ['name', 'note'], saves: 'aiAnswers.services' }],
  },
  prices: {
    title: 'قائمة الأسعار',
    intro: 'نضيف العناصر التي تكتبها في لوحة الأسعار مع أسعارها.',
    note: LATER,
    questions: [{ id: 'priceRows', existing: true, kind: 'list', label: 'خمسة عناصر مع أسعارها', hint: 'سنضيف هذه الخمسة مبدئياً ويمكنك الزيادة عليها.', count: 5, fields: ['name', 'price'], saves: 'aiAnswers.services' }],
  },
  gallery: {
    title: 'معرض الصور',
    note: 'تقدر تبدّل الصور وترتبها لاحقاً.',
    questions: [{ id: 'photos', existing: true, kind: 'photos', label: 'صور عن عملك', hint: 'أضف ما تريد الآن، وحد المعرض يتبع باقتك.', saves: 'aiAnswers.galleryImages' }],
  },
  features: {
    title: 'لماذا نحن',
    questions: [{ id: 'features', existing: true, kind: 'list', label: 'المميزات التي تحب إضافتها', hint: SKIP, count: 4, fields: ['name'], saves: 'aiAnswers.features' }],
  },
  team: {
    title: 'فريق العمل',
    note: 'تقدر تغيّر الأسماء والصور لاحقاً.',
    questions: [{ id: 'team', kind: 'list', label: 'هل ترغب بإضافة أسماء فريقك وصورهم؟', hint: SKIP, count: 3, fields: ['name', 'role', 'photo'], saves: 'team' }],
  },
  projects: {
    title: 'أعمالنا',
    note: LATER,
    questions: [{ id: 'projects', kind: 'list', label: 'أبرز أعمالك أو مشاريعك', hint: SKIP, count: 3, fields: ['name', 'note', 'photo'], saves: 'aiAnswers.projects' }],
  },
  video: {
    title: 'فيديو',
    questions: [{ id: 'video', kind: 'text', label: 'رابط فيديو يعرّف بعملك (اختياري)', hint: 'إن لم يكن لديك، يُترك القسم دون فيديو.', saves: 'aiAnswers.video' }],
  },
  booking: {
    title: 'حجز المواعيد',
    intro: 'الزبون يحجز موعداً مباشرة من صفحتك.',
    note: 'كل الإعدادات تقدر تغيّرها من «إعدادات الحجز».',
    questions: [
      { id: 'bookingKind', kind: 'choice', label: 'ماذا يحجز زبونك؟', choices: ['موعد أو استشارة', 'مقعد في جلسة أو دورة'], saves: 'bookingSettings.type' },
      { id: 'bookingSettings', kind: 'settings', label: 'تحب تضبط إعدادات حجزك الآن؟', hint: 'أيام العمل وساعاته ومدة الموعد. إذا تخطّيت، نضع أيام العمل المعتادة ومدة 30 دقيقة.', saves: 'bookingSettings' },
    ],
  },
  special_offer: {
    title: 'عرض خاص',
    note: LATER,
    questions: [{ id: 'offer', kind: 'list', label: 'عرض أو أكثر تحب إبرازه', hint: SKIP, count: 1, fields: ['name', 'note', 'price'], saves: 'aiAnswers.offers' }],
  },
  ratings: {
    title: 'التقييمات',
    intro: 'زوار صفحتك يقيّمونك وتظهر آراؤهم، وتدير التقييمات من لوحتك.',
    questions: [],
  },
  contact: {
    title: 'تواصل معنا',
    questions: [{ id: 'hours', kind: 'text', label: 'ساعات عملك (اختياري)', saves: 'contactInfo.hours' }],
  },
  privacy: {
    title: 'الشروط والخصوصية',
    intro: 'شروط وسياسة خصوصية جاهزة، وتقدر تحذفها لاحقاً.',
    questions: [],
  },
  'restaurant:front': {
    title: 'واجهة المطعم',
    questions: [{ id: 'dishNote', kind: 'text', label: 'طبقك أو ميزتك الأشهر', hint: SKIP, saves: 'aiAnswers.description' }],
  },
  'restaurant:main': {
    title: 'المنيو',
    intro: 'نضيف الأطباق التي تكتبها إلى المنيو بأسعارها.',
    note: LATER,
    questions: [
      { id: 'groups', kind: 'list', label: 'ما المجموعات الرئيسية لأطباق مطعمك؟', hint: 'مثل: مشاويات، مقبلات، حلويات، مشروبات. ' + SKIP, count: 4, fields: ['name'], saves: 'restaurant.catalogs' },
      { id: 'dishes', kind: 'list', label: 'خمسة أطباق مع أسعارها', hint: 'تظهر مبدئياً في المنيو ويمكنك الزيادة عليها. ' + SKIP, count: 5, fields: ['name', 'price', 'photo'], saves: 'restaurant.menu' },
    ],
  },
  'shop:front': { title: 'واجهة المتجر', questions: [{ id: 'shopNote', kind: 'text', label: 'ما الذي يميّز متجرك؟', hint: SKIP, saves: 'aiAnswers.description' }] },
  'shop:main': {
    title: 'المنتجات',
    note: LATER,
    questions: [
      { id: 'groups', kind: 'list', label: 'ما المجموعات الرئيسية لمتجرك؟', hint: 'مثل: ملابس، أحذية، إكسسوارات. ' + SKIP, count: 4, fields: ['name'], saves: 'shop.catalogs' },
      { id: 'products', kind: 'list', label: 'خمسة منتجات مع أسعارها', hint: 'تظهر مبدئياً في المتجر ويمكنك الزيادة عليها. ' + SKIP, count: 5, fields: ['name', 'price', 'photo'], saves: 'shop.products' },
    ],
  },
  'cars:front': { title: 'واجهة المعرض', questions: [{ id: 'carsNote', kind: 'text', label: 'ما الذي يميّز معرضك؟', hint: SKIP, saves: 'aiAnswers.description' }] },
  'cars:main': {
    title: 'السيارات',
    note: LATER,
    questions: [
      { id: 'groups', kind: 'list', label: 'ما أنواع السيارات الرئيسية في معرضك؟', hint: 'مثل: سياحية، رباعية الدفع، فانات. ' + SKIP, count: 3, fields: ['name'], saves: 'cars.groups' },
      { id: 'cars', kind: 'list', label: 'خمس سيارات مع أسعارها', hint: 'تظهر مبدئياً في المعرض ويمكنك الزيادة عليها. ' + SKIP, count: 5, fields: ['name', 'price', 'photo'], saves: 'cars.listings' },
    ],
  },
  table: {
    title: 'قائمة الأسعار',
    note: LATER,
    questions: [{ id: 'priceRows', existing: true, kind: 'list', label: 'خمسة عناصر مع أسعارها', hint: 'سنضيف هذه الخمسة مبدئياً ويمكنك الزيادة عليها.', count: 5, fields: ['name', 'price'], saves: 'aiAnswers.services' }],
  },
  search: { title: 'البحث', intro: 'شريط بحث على أقسام صفحتك، ولا يحتاج منك شيئاً.', questions: [] },
  featured: { title: 'عروض مميزة', intro: 'تظهر هنا العناصر التي تعلّمها «مميز» من لوحتك.', questions: [] },
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

/** The questions to show once the owner ticked these sections: the fixed ones, then the ticked ones in the model's order. */
export const questionsFor = (model: Pick<PageModel, 'sections' | 'pages'>, ticked: string[] | undefined, kind?: string): AskedSection[] => {
  const plan = questionPlan(model, kind);
  const on = new Set(ticked ?? plan.choices.filter((c) => c.defaultOn).map((c) => c.id));
  // Questions an earlier step already asked are left out; a section left with none is not asked.
  return [...plan.fixed, ...plan.choices.filter((c) => on.has(c.id))]
    .map((s) => ({ ...s, ask: { ...s.ask, questions: s.ask.questions.filter((q) => !q.existing) } }))
    .filter((s) => s.ask.questions.length > 0);
};

/** Model sections the registry has no entry for: a new section must get its questions (or an empty entry) here. */
export const unknownSections = (model: Pick<PageModel, 'sections' | 'pages'>): string[] =>
  pagesOf(model).flatMap((p) => p.sections).filter((s) => !askOf(s)).map((s) => (s.part ? `${s.category}:${s.part}` : s.category));

/** Every model category (and the parts the model screen offers) has an entry. */
export const missingEntries = (): string[] => MODEL_CATEGORIES.map((c) => c.id).filter((id) => !SECTION_ASKS[id] && !SECTION_ASKS[`${id}:front`]);
