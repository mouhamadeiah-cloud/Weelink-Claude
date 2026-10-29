import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { SectionQuestions } from './onboarding/SectionQuestions';
import { AiBubble, AnswerBox, UserBubble } from './onboarding/ChatThread';
import { firstNameOf, questionPlan, questionsFor, withName } from '../data/sectionQuestions';
import { STEP_HELP } from '../data/stepExplain';
import type { Topic } from './onboarding/ExplainPanel';
import { QuestionModel, forCategory, loadQuestionModel } from '../services/questionModel';
import { db } from '../services/firebase';
import { WeeDots } from './ui/WeeDots';
import { SYRIAN_GOVERNORATES, GOVERNORATE_CENTERS, addressFromPoint, areasOf, findSubdistrict, findVillage, subdistrictsOf, villagesOf, useGovernoratePlaces } from '../utils/syriaLists';
import { categorySourceOf, useCategories } from '../utils/businessCategories';
import type { ProjectType } from './shop/shopTypes';
import { ComboInput } from './ui/ComboInput';
import { looksFor, pageLookById, suitsKind } from '../data/pageLooks';
import { luminance } from '../utils/pageRecolour';
import { SLIDE_DIVIDER_OPTIONS } from './SlideDividers';
import { PersonalPalette, DEFAULT_PERSONAL_PALETTE, asPalette5 } from './onboarding/PersonalPalette';
import { EmailIcon, FacebookIcon, PhoneIcon, TikTokIcon, WhatsAppIcon } from './ui/SocialIcons';
import { hostAnswerImages, hostImage, shrinkPickedImage } from '../utils/answerImages';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  MapPin, 
  ArrowLeft,
  Check,
  X
} from 'lucide-react';

interface WeeAIChatProps {
  userId: string;
  userEmail: string;
  onCompleteChat?: (collectedData: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onStepChange?: (stepNum: number) => void;
  // «ابن صفحتي»: Wee AI builds the page's slides from the answers; the old page can be brought back.
  onBuildPage?: (answers: any) => Promise<{ ok: boolean; message: string }>;
  // «تصميم حر»: a chat in which Wee AI designs the slides itself; each answer is laid on the page.
  onFreeTurn?: (answers: any, message: string, reset?: boolean) => Promise<{ ok: boolean; message: string }>;
  onRestorePage?: () => { ok: boolean; message: string };
  // The kind of page being built: its work step offers the store or restaurant categories instead
  // of the occupations. Saved with the answers.
  pageKind?: ProjectType;
  // A free restaurant, shop or showroom page: a page that asks in that type's words (the answers are a page's, with the flavour saved).
  flavor?: ProjectType;
  // How many photos the gallery question takes: the package's gallery (5 on the free page, up to 15 on Pro); 5 when not told.
  galleryMax?: number;
  // The chosen package: its page model decides which section questions follow (none = the fixed list of optional sections).
  planId?: string;
  // Fills its own box (the start page) instead of sitting under the control panel's tabs.
  embedded?: boolean;
  // In the docked panel: takes the place of the other tabs' content under the breadcrumb, like them,
  // instead of lying over the panel.
  inFlow?: boolean;
  // The questions live on the start page (Eyad, 12 Oct): in the editor the panel shows the answers
  // and the build buttons, and this opens the questions again.
  onEditAnswers?: () => void;
  // The start page walks through the questions from the first one, the answers already filled in.
  fromStart?: boolean;
  // The page was built in this visit and can still be brought back as it was.
  restoreAvailable?: boolean;
  // The explainer of Wee AI, under the header.
  introSlot?: React.ReactNode;
  // What the panel beside the chat shows for the question being asked (the start page draws it: picture, explanation, note).
  onTopic?: (topic: Topic | null) => void;
}

// Answers given before signing up are kept on this device under this id, then moved to the new
// account (see App.tsx).
export const WEE_GUEST_ID = 'guest';

// The name asked in the first step: the title of the page and of its navbar.
const PAGE_NAME_LABEL: Record<ProjectType, string> = {
  page: 'اسم صفحتك أو نشاطك',
  shop: 'اسم المتجر',
  restaurant: 'اسم المطعم',
  cars: 'اسم المعرض',
  rental: 'اسم شركة التأجير',
  hotel: 'اسم الفندق',
};

// The work step's three lists, named for each kind of page.
const CATALOG_LABELS = {
  jobs: { category: 'كتالوج العمل الرئيسي *', sub: 'الكتالوج الفرعي', item: 'المهنة أو الاختصاص', ex: ['مثال: الطب والرعاية الصحية', 'مثال: الأطباء', 'مثال: طبيب أطفال'], need: 'يرجى اختيار كتالوج عملك.' },
  shop: { category: 'شو نوع المنتجات اللي بتبيعها؟ *', sub: 'القسم', item: 'التخصص (إذا في)', ex: ['مثال: إلكترونيات وتقنية', 'مثال: الهواتف الذكية', 'مثال: آيفون'], need: 'يرجى اختيار نوع منتجاتك.' },
  restaurant: { category: 'نوع المطعم *', sub: 'المطبخ أو الأكلة الأساسية', item: '', ex: ['مثال: مطاعم متخصصة', 'مثال: مشاوي', ''], need: 'يرجى اختيار نوع مطعمك.' },
  cars: { category: 'نوع المعرض *', sub: 'الماركة الأساسية', item: '', ex: ['مثال: سيارات مستعملة', 'مثال: تويوتا', ''], need: 'يرجى اختيار نوع معرضك.' },
  rental: { category: 'شو بتأجّر؟ *', sub: 'النوع', item: '', ex: ['مثال: سيارات', 'مثال: سيارات فخمة وأعراس', ''], need: 'يرجى اختيار شو بتأجّر.' },
  hotel: { category: 'نوع المكان *', sub: 'التصنيف', item: '', ex: ['مثال: فنادق', 'مثال: فندق 4 نجوم', ''], need: 'يرجى اختيار نوع مكانك.' },
} as const;

// What makes a store, restaurant or showroom worth choosing: the owner ticks what is true, and the
// page says it (a free page lists its services and prices instead).
const FEATURE_CHOICES: Partial<Record<ProjectType, string[]>> = {
  restaurant: ['توصيل للبيت', 'طلبات سفري', 'جلسات عائلية', 'حجز طاولات', 'حفلات ومناسبات', 'جلسات خارجية', 'فطور صباحي', 'مفتوح لوقت متأخر'],
  shop: ['توصيل لكل المحافظات', 'الدفع عند الاستلام', 'إرجاع وتبديل', 'كفالة على المنتجات', 'منتجات أصلية', 'أسعار جملة', 'عروض أسبوعية', 'تغليف هدايا'],
  cars: ['تقسيط', 'فحص فني قبل البيع', 'كفالة', 'تبديل سيارتك', 'شراء سيارتك', 'تسجيل ونقل ملكية', 'توصيل السيارة', 'تجربة قيادة'],
  rental: ['إيجار بالساعة', 'إيجار باليوم', 'مع سائق', 'توصيل للعنوان', 'تأمين شامل', 'بدون عربون', 'متاح 24 ساعة', 'عروض للمناسبات'],
  hotel: ['فطور مشمول', 'موقف سيارات', 'نقل من وإلى المطار', 'واي فاي مجاني', 'مسبح', 'مطعم', 'خدمة الغرف', 'مناسب للعائلات'],
};

// What the description is asked to say, by kind of page.
const DESCRIPTION_HINT: Record<ProjectType, string> = {
  page: 'اكتب وصفاً باختصار لخدماتك ونشاطك هنا...',
  restaurant: 'مثال: مطعم مشاوي على الفحم بحمص من 1998، أشهر أطباقنا الشيش طاووق والكباب الحلبي، وعنا صالة عائلية.',
  shop: 'مثال: متجر ألبسة أطفال من عمر يوم لـ 12 سنة، ماركات تركية، وأسعار مناسبة.',
  cars: 'مثال: معرض سيارات مستعملة مفحوصة بحماة، أغلبها تويوتا وهيونداي، ومنقبل التقسيط.',
  rental: 'مثال: تأجير سيارات سياحية وفانات بدمشق، باليوم أو بالساعة، مع سائق أو بدون، ومنوصّل للمطار.',
  hotel: 'مثال: فندق 4 نجوم بقلب دمشق القديمة، غرف مفردة ومزدوجة وأجنحة، فطور مشمول وموقف سيارات، وقريب من الأسواق.',
};

// The questions in the words of each kind of page (Eyad, 12 Oct: a restaurant is asked about its
// food, a store about what it sells, not about a profession).
const KIND_QUESTIONS: Partial<Record<ProjectType, Record<number, string>>> = {
  restaurant: { 1: 'عرّفنا على مطعمك:', 4: 'شو نوع مطعمك؟', 5: 'اوصف مطعمك: مطبخكم، أشهر أطباقكم، وشو بيميزكم:' },
  shop: { 1: 'عرّفنا على متجرك:', 4: 'شو نوع المنتجات اللي بتبيعها؟', 5: 'اوصف متجرك: شو بتبيع، لمين، وشو بيميزكم:' },
  cars: { 1: 'عرّفنا على معرضك:', 4: 'شو نوع سيارات معرضك؟', 5: 'اوصف معرضك: نوع السيارات، الماركات، وخدماتكم:' },
  rental: { 1: 'عرّفنا على شغلك بالتأجير:', 4: 'شو بتأجّر؟', 5: 'اوصف شغلك: شو بتأجّر، بالساعة أو باليوم، وشو بيميزكم:' },
  hotel: { 1: 'عرّفنا على فندقك:', 4: 'شو نوع مكانك؟', 5: 'اوصف فندقك: موقعه، أنواع الغرف، الخدمات، وشو بيميزكم:' },
};


const LocationPicker = lazy(() => import('./ui/LocationPicker'));

const LIST_HINT = 'اختر من القائمة ليسهل على زبائنك إيجادك، أو اكتبه بنفسك.';

// Answers saved before the lists: «غير ذلك» with the typed text beside it becomes the typed text.
const normalizeCatalog = (c: any) => ({
  category: (c?.category === 'غير ذلك' ? c?.customCategory : c?.category) || '',
  subCategory: c?.subCategory || '',
  specialty: (c?.specialty === 'غير ذلك' ? c?.customSpecialty : c?.specialty) || '',
  customCategory: '',
  customSpecialty: ''
});

// Wee AI's question at each step, in its own words to the owner (the kind's wording first; his first name once he gave it).
const getConciseQuestionText = (stepNum: number, name?: string, kind?: ProjectType, photos = 5): string => {
  const own = kind && KIND_QUESTIONS[kind]?.[stepNum];
  const text = own || ({
    1: 'عرّفني على حالك:',
    2: 'وين مكان شغلك؟ حدد عنوانك:',
    3: 'كيف بيتواصل معك زبائنك؟',
    4: 'شو نوع شغلك واختصاصك؟',
    5: 'احكيلي عن صفحتك: شو بتقدّم وشو بيميزك؟',
    6: 'في لون أو ستايل بتحب تكون عليه صفحتك؟',
    7: 'أي شكل للفواصل بين أقسام صفحتك بتفضّل؟',
    9: 'ارفع شعارك (اللوغو) لصفحتك:',
  } as Record<number, string>)[stepNum] || 'خلصنا، وإجاباتك جاهزة للبناء.';
  return name && stepNum > 1 && !text.includes('يا ') ? `يا ${name}، ${text}` : text;
};

// The answers in short, in the editor's panel; the questions themselves are on the start page.
const AnswersSummary: React.FC<{ done: boolean; rows: [string, string | undefined][]; onEdit: () => void }> = ({ done, rows, onEdit }) => (
  <div className="p-4 space-y-3 text-xs text-neutral-800">
    {done ? (
      <dl className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 bg-white">
        {rows.filter(([, v]) => v && v.trim()).map(([k, v]) => (
          <div key={k} className="px-3 py-2 space-y-0.5">
            <dt className="text-xs font-bold text-neutral-400">{k}</dt>
            <dd className="text-xs font-semibold text-neutral-800 leading-relaxed line-clamp-3">{v}</dd>
          </div>
        ))}
      </dl>
    ) : (
      <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
        أسئلة Wee AI صارت بصفحة البداية: اسم صفحتك، شغلك، وصفها، ألوانها وخدماتك. جاوب عليها وبعدها بيبني Wee AI صفحتك منها.
      </p>
    )}
    <button
      type="button"
      onClick={onEdit}
      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${done ? 'text-neutral-800 bg-white border border-neutral-200 hover:border-neutral-300' : 'text-white bg-brand hover:bg-brand-hover'}`}
    >
      {done ? 'عدّل إجاباتي' : 'جاوب على الأسئلة'}
    </button>
  </div>
);

export const WeeAIChat: React.FC<WeeAIChatProps> = ({
  userId,
  userEmail,
  onCompleteChat,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse,
  onStepChange,
  onBuildPage,
  onFreeTurn,
  onRestorePage,
  pageKind,
  flavor,
  galleryMax: galleryMaxProp,
  planId,
  embedded,
  inFlow,
  onEditAnswers,
  fromStart,
  restoreAvailable,
  introSlot,
  onTopic
}) => {
  // Answers finished once stay finished while the owner walks through them again.
  const finishedRef = useRef(false);
  const byKindRef = useRef<Record<string, { catalogInfo: any; aiAnswers: any }>>({});
  const [freeOpen, setFreeOpen] = useState(false);
  const [freeText, setFreeText] = useState('');
  const [freeBusy, setFreeBusy] = useState(false);
  const [freeLog, setFreeLog] = useState<{ role: 'user' | 'ai'; text: string; ok?: boolean }[]>([]);
  const freeFresh = useRef(false);
  const isGuest = userId === WEE_GUEST_ID;
  // The words of the questions: the flavour's when there is one.
  // The flavour of the answers: the one asked for on the start page, else (in the editor) the one saved with them.
  const [savedFlavor, setSavedFlavor] = useState<ProjectType | undefined>();
  const ownFlavor = flavor ?? (fromStart ? undefined : savedFlavor);
  const tone = ownFlavor || pageKind;
  const galleryMax = Math.max(1, Math.min(15, Math.floor(galleryMaxProp ?? 5)));
  const catalogSource = categorySourceOf(tone);
  const labels = CATALOG_LABELS[catalogSource];
  // Local collapsed state if not externally controlled
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;
  const toggleCollapse = externalOnToggleCollapse || (() => setInternalCollapsed(prev => !prev));

  // Current Step (1 through 12, then 13 = complete)
  const [step, setStep] = useState<number>(1);
  // The answered question being changed (the thread opens its form again); null while the owner is at the newest question.
  const [editing, setEditing] = useState<number | null>(null);
  const [askedLogo, setAskedLogo] = useState(false);
  const [ownFeature, setOwnFeature] = useState('');
  const active = editing ?? step;
  const liveRef = useRef<HTMLDivElement>(null);
  const scrolled = useRef(false);
  useEffect(() => {
    if (!scrolled.current) { scrolled.current = true; return; }
    if (step < 12 || editing) liveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step, editing]);
  // The section questions follow the page model of the chosen package.
  const [qModel, setQModel] = useState<QuestionModel | null>(null);
  // No package picked here (the editor's panel, or «كمّل صفحتك» straight to the questions): the kind's own model asks them.
  const modelPlan = planId || (!pageKind || pageKind === 'page' || ownFlavor ? 'page-free' : `${pageKind}-30`);
  useEffect(() => {
    let live = true;
    setQModel(null);
    loadQuestionModel(modelPlan).then((m) => live && setQModel(m));
    return () => { live = false; };
  }, [modelPlan]);
  const [writeNote, setWriteNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [canRestore, setCanRestore] = useState(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [locationNote, setLocationNote] = useState<{ text: string; ok: boolean } | null>(null);
  const geocodeRun = useRef(0);

  // Form State Values
  const [personalInfo, setPersonalInfo] = useState({
    title: 'سيد',
    fullName: '',
    pageName: '',
    birthDate: '',
    logoUrl: ''
  });

  const [addressInfo, setAddressInfo] = useState({
    governorate: 'دمشق',
    placeType: 'city' as 'city' | 'rural',
    city: '',
    area: '',
    district: '',
    subdistrict: '',
    village: '',
    street: '',
    details: '',
    coordinates: null as { lat: number; lng: number } | null
  });

  const [contactInfo, setContactInfo] = useState({
    email: userEmail || '',
    whatsapp: '',
    phone: '',
    facebook: '',
    tiktok: ''
  });

  const [catalogInfo, setCatalogInfo] = useState({
    category: '',
    subCategory: '',
    specialty: '',
    customCategory: '',
    customSpecialty: ''
  });
  const places = useGovernoratePlaces(active === 2 ? addressInfo.governorate : '');
  const occupationList = useCategories(catalogSource, active === 4);
  const catalogEntry = occupationList?.find(c => c.name === catalogInfo.category.trim());
  const subEntry = catalogEntry?.subs.find(s => s.name === catalogInfo.subCategory.trim());
  const jobOptions = subEntry
    ? subEntry.items
    : catalogEntry
      ? catalogEntry.subs.flatMap(s => s.items)
      : (occupationList || []).flatMap(c => c.subs.flatMap(s => s.items));

  const [aiAnswers, setAiAnswers] = useState({
    description: '',
    colorPalette: '',
    customColor: '#0071e3',
    lookId: '',
    customPalette: [...DEFAULT_PERSONAL_PALETTE] as string[],
    dividerStyle: 'straight',
    wantsGallery: true,
    galleryImages: [] as string[],
    optionalSections: undefined as string[] | undefined,
    sectionAnswers: {} as Record<string, any>,
    heroBgImage: '',
    motionEffects: 'صفحة هادئة وجادة',
    specialInstructions: '',
    services: [] as { name: string; price: string }[],
    features: [] as string[],
  });

  // The 12 page looks, those that suit this kind of page first; the divider answer of older sessions
  // used four short names.
  const buildKind = pageKind === 'page' || pageKind === 'rental' || pageKind === 'hotel' || !pageKind ? 'free' : pageKind;
  const lookChoices = looksFor(buildKind);
  const luminanceIsDark = (hex: string) => luminance(hex) < 0.45;
  const currentDivider = ({ sine: 'double-wave', curved: 'curve-down' } as Record<string, string>)[aiAnswers.dividerStyle] || aiAnswers.dividerStyle;
  const colorSummary = aiAnswers.lookId
    ? `ستايل ${pageLookById(aiAnswers.lookId)?.name || ''}`.trim()
    : (aiAnswers.colorPalette || '').startsWith('مخصص')
      ? 'ألوان شخصية'
      : aiAnswers.colorPalette || 'Wee AI يختار';

  const resetToBlankDefaults = () => {
    setPersonalInfo({
      title: 'سيد',
      pageName: '',
      fullName: '',
      birthDate: '',
      logoUrl: ''
    });
    setAddressInfo({
      governorate: 'دمشق',
      placeType: 'city' as 'city' | 'rural',
      city: '',
      area: '',
      district: '',
      subdistrict: '',
      village: '',
      street: '',
      details: '',
      coordinates: null
    });
    setContactInfo({
      email: userEmail || '',
      whatsapp: '',
      phone: '',
      facebook: '',
      tiktok: ''
    });
    setCatalogInfo({
      category: '',
      subCategory: '',
      specialty: '',
      customCategory: '',
      customSpecialty: ''
    });
    setAiAnswers({
      description: '',
      colorPalette: '',
      customColor: '#0071e3',
      lookId: '',
      customPalette: [...DEFAULT_PERSONAL_PALETTE],
      dividerStyle: 'straight',
      wantsGallery: true,
      galleryImages: [],
      optionalSections: undefined,
      sectionAnswers: {},
      heroBgImage: '',
      motionEffects: 'صفحة هادئة وجادة',
      specialInstructions: '',
      services: [],
      features: [],
    });
    setEditing(null);
    setStep(1);
  };

  // Load existing progress: Firebase first (source of truth across devices), LocalStorage as offline fallback
  useEffect(() => {
    const applyData = (data: any) => {
      // Answers given for another kind of page keep the owner's own details (name, address,
      // contacts, look), not what that business was: its name, kind, description and offer.
      // Each kind keeps its own answers too (byKind), so opening a rental after a hotel brings the
      // rental's own back instead of an empty description.
      byKindRef.current = data.byKind || {};
      const mine = pageKind ? byKindRef.current[pageKind] : null;
      if (mine && pageKind !== data.pageKind) data = { ...data, catalogInfo: mine.catalogInfo, aiAnswers: mine.aiAnswers, pageKind };
      const otherKind = !!pageKind && !!data.pageKind && data.pageKind !== pageKind;
      setSavedFlavor(['restaurant', 'shop', 'cars', 'rental', 'hotel'].includes(data.flavor) ? data.flavor : undefined);
      if (data.personalInfo) setPersonalInfo({ pageName: '', ...data.personalInfo, ...(otherKind ? { pageName: '' } : {}) });
      if (data.addressInfo) setAddressInfo({ placeType: 'city', area: '', district: '', subdistrict: '', village: '', ...data.addressInfo });
      if (data.contactInfo) setContactInfo(data.contactInfo);
      if (data.catalogInfo && !otherKind) setCatalogInfo(normalizeCatalog(data.catalogInfo));
      if (data.aiAnswers) setAiAnswers({ services: [], features: [], ...data.aiAnswers, ...(otherKind ? { description: '', services: [], features: [], specialInstructions: '' } : {}) });
      finishedRef.current = data.currentStep >= 13;
      if (fromStart) setStep(1);
      else if (data.currentStep && data.currentStep <= 13) setStep(data.currentStep === 8 ? (data.personalInfo?.logoUrl ? 12 : 9) : data.currentStep === 10 || data.currentStep === 11 ? 12 : data.currentStep);
      // Photos saved full size by older versions move to Firebase Storage (the next save keeps their links).
      if (!isGuest) {
        hostAnswerImages(data).then((hosted) => {
          if (hosted === data) return;
          // Saved straight away: the full-size copies are what filled the browser storage.
          try { localStorage.setItem('weelink_chat_progress_' + userId, JSON.stringify(hosted)); } catch (e) { console.warn('Silent local save failed:', e); }
          setDoc(doc(db, 'platform_directory', userId), { ...hosted, updatedAt: serverTimestamp() }, { merge: true })
            .catch((err) => console.warn('Silent cloud save failed:', err));
          if (hosted.personalInfo) setPersonalInfo(p => ({ ...p, logoUrl: hosted.personalInfo.logoUrl || '' }));
          if (hosted.aiAnswers) setAiAnswers(p => ({ ...p, heroBgImage: hosted.aiAnswers.heroBgImage || '', galleryImages: hosted.aiAnswers.galleryImages || [] }));
        }).catch(() => {});
      }
    };

    const loadProgress = async () => {
      if (!userId) return;
      // Another account (or none yet): nothing of the last one stays in the questions; only what
      // this account saved is put back.
      finishedRef.current = false;
      resetToBlankDefaults();
      // The browser's own copy can hold full-size photos even when the cloud copy is fine: shrink it too.
      if (!isGuest) {
        try {
          const local = JSON.parse(localStorage.getItem('weelink_chat_progress_' + userId) || 'null');
          if (local) hostAnswerImages(local).then((hosted) => {
            if (hosted !== local) localStorage.setItem('weelink_chat_progress_' + userId, JSON.stringify(hosted));
          }).catch(() => {});
        } catch { /* unreadable copy: the cloud one is used */ }
      }

      try {
        if (isGuest) throw new Error('guest');
        const snap = await getDoc(doc(db, 'platform_directory', userId));
        if (snap.exists()) {
          applyData(snap.data());
          return;
        }
      } catch (err) {
        if (!isGuest) console.warn("Error loading chat progress from Firebase, falling back to local cache:", err);
      }

      // Fallback: local cache (offline, or before first cloud sync)
      try {
        const stored = localStorage.getItem('weelink_chat_progress_' + userId);
        if (stored) {
          applyData(JSON.parse(stored));
          return;
        }
        resetToBlankDefaults();
      } catch (err) {
        console.error("Error loading chat progress:", err);
        resetToBlankDefaults();
      }
    };
    loadProgress();
  }, [userId, userEmail]);

  // Silently trigger canvas loading loop simulation on step changes
  useEffect(() => {
    if (step > 1 || embedded) {
      onStepChange?.(step > 11 ? step - 1 : step); // step 11 is skipped
    }
  }, [step]);

  // Save progress at each transition: instantly to LocalStorage, and live up to Firebase
  const saveProgress = (nextStep: number) => {
    if (!userId) return;
    if (pageKind) byKindRef.current = { ...byKindRef.current, [pageKind]: { catalogInfo, aiAnswers } };
    const dataToSave = {
      personalInfo,
      addressInfo,
      contactInfo,
      catalogInfo,
      aiAnswers,
      ...(pageKind ? { pageKind, byKind: byKindRef.current } : {}),
      ...(ownFlavor ? { flavor: ownFlavor } : {}),
      currentStep: finishedRef.current ? 13 : nextStep,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem('weelink_chat_progress_' + userId, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn("Silent local save failed:", e);
    }
    if (isGuest) return;
    // Live upload to Firebase so progress/step follows the user across devices and sessions
    setDoc(doc(db, 'platform_directory', userId), {
      ...dataToSave,
      updatedAt: serverTimestamp()
    }, { merge: true }).catch((err) => {
      console.warn("Silent cloud save failed (kept locally, will retry next step):", err);
    });
  };

  const goToNextStep = () => {
    let nextStep = step + 1;
    // The gallery (8) and the front photo (10) are no longer steps: the sections of the page model ask them, when the model has them.
    // The logo (9) is skipped when it was already uploaded in step 1, and the visual-effects question (11) is not asked any more.
    if (nextStep === 8) nextStep = personalInfo.logoUrl ? 12 : 9;
    if (nextStep === 10 || nextStep === 11) nextStep = 12;
    if (nextStep === 9) setAskedLogo(true);
    setStep(nextStep);
    saveProgress(nextStep);
  };

  // «التالي» of a form: at the newest question it moves on; on an answer being edited it closes the form and the thread goes on where it was.
  const onNext = () => {
    if (editing != null) {
      setEditing(null);
      saveProgress(step);
    } else goToNextStep();
  };

  // Helper: a photo from the device, shrunk (a phone photo is several MB) and, once signed in,
  // kept in Firebase Storage so the answers hold only its link.
  const pickImage = async (file: File, kind: 'logo' | 'photo') => {
    const small = await shrinkPickedImage(file, kind);
    return isGuest ? small : hostImage(small, kind);
  };
  const handleDeviceImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (url: string) => void,
    kind: 'logo' | 'photo' = 'photo'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pickImage(file, kind).then(onLoaded).catch((err) => console.warn('Could not read the image:', err));
  };

  // Helper: Gallery files (multiple or single)
  const handleGalleryFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).slice(0, galleryMax).forEach(file => {
      pickImage(file, 'photo')
        .then(url => setAiAnswers(prev => (
          prev.galleryImages.length >= galleryMax ? prev : { ...prev, galleryImages: [...prev.galleryImages, url] }
        )))
        .catch((err) => console.warn('Could not read the image:', err));
    });
  };

  // The pin moved (device location, drag or tap): keep the point and fill the address from it.
  // Every field stays editable; a later pin replaces only what the map knows.
  const fillFromPoint = async (point: { lat: number; lng: number }) => {
    setAddressInfo(prev => ({ ...prev, coordinates: point }));
    const run = ++geocodeRun.current;
    setLocationNote({ text: 'جاري قراءة العنوان من الخريطة...', ok: true });
    try {
      const res = await fetch(`/api/geocode?lat=${point.lat}&lng=${point.lng}`);
      const found = res.ok ? await addressFromPoint(await res.json()) : undefined;
      if (run !== geocodeRun.current) return;
      if (found === null) {
        setLocationNote({ text: 'هذا الموقع خارج سوريا. حرّك الدبوس لمكانك أو اختر العنوان من القوائم.', ok: false });
        return;
      }
      if (!found) throw new Error('geocode');
      setAddressInfo(prev => ({ ...prev, ...found, street: found.street || prev.street }));
      setLocationNote({ text: 'عبّينا العنوان من الخريطة. راجع الحقول وعدّل أي شي إذا لزم.', ok: true });
    } catch {
      if (run === geocodeRun.current) setLocationNote({ text: 'حفظنا موقعك، بس ما قدرنا نقرأ العنوان. اختره من القوائم تحت.', ok: false });
    }
  };

  // Opens the map on the device's location; without it, on the chosen governorate.
  const handleGetLocation = () => {
    setMapOpen(true);
    const fallback = () => {
      const [lat, lng] = GOVERNORATE_CENTERS[addressInfo.governorate] || GOVERNORATE_CENTERS['دمشق'];
      setMapCenter(addressInfo.coordinates || { lat, lng });
      setLocationNote({ text: 'ما قدرنا نحدد موقعك تلقائياً. اسحب الدبوس أو اضغط على مكانك بالخريطة.', ok: false });
    };
    if (!navigator.geolocation) return fallback();
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCenter(point);
        fillFromPoint(point);
      },
      () => {
        setGpsLoading(false);
        fallback();
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // The thread's helpers: the owner's first name, the questions reached so far, and his answers in a line.
  const firstName = firstNameOf(personalInfo.fullName, personalInfo.title);
  const path = [1, 2, 3, 4, 5, 6, 7, ...(step >= 9 && (askedLogo || !personalInfo.logoUrl || step === 9) ? [9] : []), ...(step >= 12 ? [12] : [])].filter((n) => n <= Math.min(step, 12));
  const askText = (n: number) => getConciseQuestionText(n, firstName, tone, galleryMax);
  const answerText = (n: number): string => {
    switch (n) {
      case 1: return [`${personalInfo.title} ${personalInfo.fullName}`.trim(), personalInfo.pageName && `صفحتي: ${personalInfo.pageName}`].filter(Boolean).join(' · ');
      case 2: return [addressInfo.governorate, addressInfo.city || addressInfo.village || addressInfo.area, addressInfo.street].filter(Boolean).join('، ');
      case 3: return [contactInfo.phone, contactInfo.whatsapp && `واتساب ${contactInfo.whatsapp}`, contactInfo.email, contactInfo.facebook && 'فيسبوك', contactInfo.tiktok && 'تيك توك'].filter(Boolean).join(' · ') || 'بدون وسائل تواصل الآن';
      case 4: return [catalogInfo.customCategory || catalogInfo.category, catalogInfo.subCategory, catalogInfo.customSpecialty || catalogInfo.specialty].filter(Boolean).join('، ');
      case 5: return aiAnswers.description.trim() || 'بدون وصف، اكتب أنت يا Wee AI';
      case 6: return colorSummary;
      case 7: return SLIDE_DIVIDER_OPTIONS.find((d) => d.id === currentDivider)?.name || currentDivider;
      case 9: return personalInfo.logoUrl ? 'رفعت الشعار' : 'بدون شعار الآن';
      default: return '';
    }
  };

  // The steps before the sections: the owner, the address, the contacts, the work, the description, the colours, the dividers and the logo.
  // Everything else is asked by the sections of the page model.
  const FIXED_STEPS = 8;
  // What the panel beside the chat shows: the step being asked, or (from step 12) the section SectionQuestions reports. The bar counts both.
  const sectionTotal = qModel
    ? (questionPlan(forCategory(qModel, tone, catalogInfo.customCategory || catalogInfo.category), tone).choices.length ? 1 : 0)
      + questionsFor(forCategory(qModel, tone, catalogInfo.customCategory || catalogInfo.category), aiAnswers.optionalSections, tone).length + 1
    : 1;
  const topicRef = useRef(onTopic);
  topicRef.current = onTopic;
  const notesTopic = (): Topic => (step >= 13
    ? { id: 'done', title: 'خلصنا', explain: withName('يا {name}، كل إجاباتك انحفظت. فيك ترجع لأي سؤال فوق وتعدّله بأي وقت، والأسئلة اللي بتتأثر بتعديلك بتتجدد لحالها. وبس تخلّص، بتنفتح صفحتك وبلّش ابنيها فوراً من هالإجابات.', firstName), progress: { n: FIXED_STEPS + sectionTotal, total: FIXED_STEPS + sectionTotal } }
    : { id: 'notes', title: 'ملاحظات خاصة', explain: withName('آخر شي يا {name}، إذا في شي خاص بدك ياه اكتبه هون: شي لازم يظهر بالصفحة، شي ما بدك ياه، أو أسلوب معيّن بالكتابة. وإذا ما في، بتتركه فاضي وبتخلّص.', firstName), note: 'ما بنفّذ غير اللي بتكتبه، وبتقدر تعدّله بعدين.', progress: { n: FIXED_STEPS + sectionTotal, total: FIXED_STEPS + sectionTotal } });
  const onSectionTopic = (t: (Omit<Topic, 'progress'> & { at: { n: number; total: number } }) | null) => {
    if (!t) { topicRef.current?.(notesTopic()); return; }
    const { at, ...rest } = t;
    topicRef.current?.({ ...rest, pageName: personalInfo.pageName, logo: personalInfo.logoUrl, progress: { n: FIXED_STEPS + at.n, total: FIXED_STEPS + sectionTotal } });
  };
  useEffect(() => {
    if (step >= 13 && editing == null) { topicRef.current?.(notesTopic()); return; }
    if (step >= 12 && editing == null) return; // SectionQuestions reports it
    const n = active;
    const help = STEP_HELP[n];
    if (!help) return;
    topicRef.current?.({
      id: `step-${n}`,
      title: getConciseQuestionText(n, firstName, tone, galleryMax),
      explain: withName(help.explain, firstName),
      note: help.note,
      pageName: personalInfo.pageName || personalInfo.fullName,
      logo: personalInfo.logoUrl,
      progress: { n: n === 9 ? FIXED_STEPS : Math.min(n, 7), total: FIXED_STEPS + sectionTotal },
    });
  }, [active, step, editing, firstName, personalInfo.pageName, personalInfo.fullName, personalInfo.logoUrl, sectionTotal]); // eslint-disable-line react-hooks/exhaustive-deps

  // The form of one question; it opens under Wee AI's question while it is asked, or again when the owner edits his answer.
  // The forms of the questions that the page model's sections ask (Eyad, 28 Oct: the model decides what is asked, and when).
  const servicesFields = () => (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 block">خدماتك وأسعارها (اختياري، حتى 8)</label>
                {(aiAnswers.services || []).map((row, i) => (
                  <div key={i} className="flex gap-1.5">
                    <input
                      type="text"
                      value={row.name}
                      onChange={e => setAiAnswers(p => ({ ...p, services: (p.services || []).map((r, j) => (j === i ? { ...r, name: e.target.value } : r)) }))}
                      placeholder="اسم الخدمة"
                      className="flex-1 min-w-0 text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.price}
                      onChange={e => setAiAnswers(p => ({ ...p, services: (p.services || []).map((r, j) => (j === i ? { ...r, price: e.target.value } : r)) }))}
                      placeholder="السعر (اختياري)"
                      className="w-28 text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label="احذف الخدمة"
                      onClick={() => setAiAnswers(p => ({ ...p, services: (p.services || []).filter((_, j) => j !== i) }))}
                      className="px-2 text-neutral-400 hover:text-rose-600 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {(aiAnswers.services || []).length < 8 && (
                  <button
                    type="button"
                    onClick={() => setAiAnswers(p => ({ ...p, services: [...(p.services || []), { name: '', price: '' }] }))}
                    className="w-full py-1.5 border border-dashed border-neutral-300 rounded-lg text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                  >
                    + أضف خدمة
                  </button>
                )}
                <p className="text-xs text-neutral-400">الخدمة بلا سعر بتظهر «حسب الطلب». ما منكتب أي سعر ما كتبته.</p>
              </div>
  );
  const featuresFields = () => (
    <div className="space-y-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 block">شو بتقدموا كمان؟ (اختر اللي بينطبق)</label>
                <div className="flex flex-wrap gap-1.5">
                  {[...(FEATURE_CHOICES[pageKind || 'page'] || []), ...(aiAnswers.features || []).filter((x) => !(FEATURE_CHOICES[pageKind || 'page'] || []).includes(x))].map((f) => {
                    const on = (aiAnswers.features || []).includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setAiAnswers(p => ({ ...p, features: on ? (p.features || []).filter(x => x !== f) : [...(p.features || []), f] }))}
                        className={`px-2.5 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${on ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'}`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={ownFeature}
          onChange={e => setOwnFeature(e.target.value)}
          placeholder="ميزة ثانية تريدها"
          className="flex-1 min-w-0 text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none"
        />
        <button
          type="button"
          onClick={() => { const v = ownFeature.trim(); if (v) setAiAnswers(p => ({ ...p, features: (p.features || []).includes(v) ? p.features : [...(p.features || []), v] })); setOwnFeature(''); }}
          className="px-3 text-xs font-bold rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 cursor-pointer"
        >
          + أضف
        </button>
      </div>
    </div>
  );
  const galleryFields = () => (
    <div className="space-y-3.5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAiAnswers(p => ({ ...p, wantsGallery: true }))}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                  aiAnswers.wantsGallery ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                نعم
              </button>
              <button
                type="button"
                onClick={() => setAiAnswers(p => ({ ...p, wantsGallery: false, galleryImages: [] }))}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                  !aiAnswers.wantsGallery ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                لا
              </button>
            </div>

            {aiAnswers.wantsGallery && (
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <label className="w-full py-2 px-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-center cursor-pointer text-xs font-bold text-neutral-700 flex items-center justify-center gap-1.5 transition-all">
                  <Upload size={13} />
                  <span>رفع حتى {galleryMax} {galleryMax === 1 ? 'صورة' : 'صور'} من الجهاز</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleGalleryFilesUpload}
                    className="hidden"
                  />
                </label>

                {aiAnswers.galleryImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {aiAnswers.galleryImages.slice(0, galleryMax).map((img, i) => (
                      <div key={i} className="relative aspect-square rounded border border-neutral-300 overflow-hidden bg-neutral-100">
                        <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAiAnswers(p => ({ ...p, galleryImages: p.galleryImages.filter((_, idx) => idx !== i) }))}
                          className="absolute inset-0 bg-black/40 text-white flex items-center justify-center text-xs"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

    </div>
  );
  const heroFields = () => (
            <div className="space-y-2">
              <label className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-center cursor-pointer text-xs font-bold text-neutral-700 flex items-center justify-center gap-1.5 transition-all">
                <Upload size={14} />
                <span>رفع صورة الخلفية من الجهاز</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleDeviceImageUpload(e, url => setAiAnswers(p => ({ ...p, heroBgImage: url })))}
                  className="hidden"
                />
              </label>

              {aiAnswers.heroBgImage && (
                <div className="relative h-20 rounded-lg border border-neutral-300 overflow-hidden bg-neutral-100">
                  <img src={aiAnswers.heroBgImage} alt="Hero BG" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAiAnswers(p => ({ ...p, heroBgImage: '' }))}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded text-xs"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <input
                type="url"
                value={aiAnswers.heroBgImage}
                onChange={e => setAiAnswers(p => ({ ...p, heroBgImage: e.target.value }))}
                placeholder="أو ضع رابط صورة الخلفية المباشر"
                className="w-full text-xs py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

  );
  const customForms: Record<string, () => React.ReactNode> = { services: servicesFields, features: featuresFields, gallery: galleryFields, hero: heroFields };
  const customSummary = (id: string): string => {
    if (id === 'services') return (aiAnswers.services || []).filter((r) => r.name?.trim()).map((r) => `${r.name.trim()}${r.price?.trim() ? ` (${r.price.trim()})` : ''}`).join('، ');
    if (id === 'features') return (aiAnswers.features || []).join('، ');
    if (id === 'gallery') return aiAnswers.wantsGallery && aiAnswers.galleryImages.length ? `معرض صور (${aiAnswers.galleryImages.length})` : '';
    if (id === 'hero') return aiAnswers.heroBgImage ? 'أضفت صورة للواجهة' : '';
    return '';
  };
  const customClear = (id: string) => {
    if (id === 'services') setAiAnswers(p => ({ ...p, services: [] }));
    else if (id === 'features') setAiAnswers(p => ({ ...p, features: [] }));
    else if (id === 'gallery') setAiAnswers(p => ({ ...p, wantsGallery: false, galleryImages: [] }));
    else if (id === 'hero') setAiAnswers(p => ({ ...p, heroBgImage: '' }));
  };

  const renderForm = (cur: number) => (
    <>
        
        {/* STEP 1: معلومات شخصية */}
        {cur === 1 && (
          <div className="space-y-3.5">
            {/* اللقب */}
            <div className="flex gap-1.5">
              {['سيد', 'سيدة', 'شركة'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPersonalInfo(p => ({ ...p, title: opt }))}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    personalInfo.title === opt
                      ? 'bg-black text-white border-black'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* اسم الصفحة: عنوان المدخل واسم شريط التنقل */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 block">{PAGE_NAME_LABEL[tone || 'page']}</label>
              <input
                type="text"
                value={personalInfo.pageName || ''}
                onChange={e => setPersonalInfo(p => ({ ...p, pageName: e.target.value }))}
                placeholder={tone === 'restaurant' ? 'مثال: مطعم بيت جدي' : tone === 'shop' ? 'مثال: متجر لمسة' : tone === 'cars' ? 'مثال: معرض الشام للسيارات' : tone === 'rental' ? 'مثال: الشام لتأجير السيارات' : tone === 'hotel' ? 'مثال: فندق الياسمين' : 'مثال: عيادة د. سلمى للأسنان'}
                className="w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none"
              />
              <p className="text-xs text-neutral-400">هو عنوان صفحتك. إذا تركته فاضي بيصير اسمك هو العنوان.</p>
            </div>

            {/* الاسم الكامل */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 block">الاسم الكامل *</label>
              <input
                type="text"
                value={personalInfo.fullName}
                onChange={e => setPersonalInfo(p => ({ ...p, fullName: e.target.value }))}
                placeholder={tone && tone !== 'page' ? 'اسم صاحب العمل أو الشركة' : 'أدخل الاسم أو اسم الشركة'}
                className="w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none"
              />
            </div>

            {/* تاريخ الميلاد: لصفحة شخصية فقط */}
            {(!tone || tone === 'page') && <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-400 block">تاريخ الميلاد (يمكن تخطيه)</label>
              <input
                type="date"
                value={personalInfo.birthDate}
                onChange={e => setPersonalInfo(p => ({ ...p, birthDate: e.target.value }))}
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none"
              />
            </div>}

            {/* صورة اللوغو (رفع من الجهاز أو رابط) */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-neutral-500 block">صورة اللوغو (غير إجباري)</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-center cursor-pointer text-xs font-bold text-neutral-700 flex items-center justify-center gap-1.5 transition-all">
                  <Upload size={13} />
                  <span>رفع من الجهاز</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleDeviceImageUpload(e, url => setPersonalInfo(p => ({ ...p, logoUrl: url })), 'logo')}
                    className="hidden"
                  />
                </label>
                {personalInfo.logoUrl && (
                  <div className="relative w-8 h-8 rounded border border-neutral-300 overflow-hidden shrink-0">
                    <img src={personalInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPersonalInfo(p => ({ ...p, logoUrl: '' }))}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-xs"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
              <input
                type="url"
                value={personalInfo.logoUrl}
                onChange={e => setPersonalInfo(p => ({ ...p, logoUrl: e.target.value }))}
                placeholder="أو ضع رابط الشعار المباشر هنا"
                className="w-full text-xs py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none font-mono text-left"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!personalInfo.fullName.trim()) {
                  alert('الرجاء إدخال الاسم الكامل لمتابعة البناء.');
                  return;
                }
                onNext();
              }}
              className="w-full py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>متابعة</span>
            </button>
          </div>
        )}

        {/* STEP 2: العنوان */}
        {cur === 2 && (
          <div className="space-y-3.5">
            {/* Fill the address from the map: the device's location, then a pin the owner can move. */}
            <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2">
              <button
                type="button"
                disabled={gpsLoading}
                onClick={handleGetLocation}
                className="w-full py-2 px-3 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <MapPin size={13} />
                <span>{gpsLoading ? 'جاري تحديد موقعك...' : mapOpen ? 'رجّع الدبوس لموقعي' : 'حدد موقعي على الخريطة'}</span>
              </button>
              {!mapOpen && <p className="text-xs text-neutral-500">منعبّي العنوان من موقعك، وبتقدر تعدّل أي حقل بعدين.</p>}
              {mapOpen && mapCenter && (
                <Suspense fallback={<div className="h-52 rounded-lg bg-neutral-100 animate-pulse" />}>
                  <LocationPicker value={mapCenter} onPick={(p) => { setMapCenter(p); fillFromPoint(p); }} />
                </Suspense>
              )}
              {mapOpen && mapCenter && <p className="text-xs text-neutral-500">اسحب الدبوس أو اضغط على مكانك بالضبط.</p>}
              {locationNote && (
                <p className={`text-xs font-bold ${locationNote.ok ? 'text-green-600' : 'text-amber-600'}`}>{locationNote.text}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 block">المحافظة (إجباري) *</label>
              <select
                value={addressInfo.governorate}
                onChange={e => setAddressInfo(p => ({ ...p, governorate: e.target.value, city: '', area: '', district: '', subdistrict: '', village: '' }))}
                className="w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white"
              >
                {SYRIAN_GOVERNORATES.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>

            {/* A mixed governorate asks first whether the place is a city or in the countryside. */}
            {(!places || places.type !== 'urban') && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-lg">
                {([['city', 'مدينة'], ['rural', 'ريف']] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAddressInfo(p => ({ ...p, placeType: id }))}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all ${addressInfo.placeType === id ? 'bg-white text-brand shadow-sm' : 'text-neutral-500'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {addressInfo.placeType === 'rural' && places?.type !== 'urban' ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-500 block">المنطقة</label>
                  <ComboInput
                    ariaLabel="المنطقة"
                    value={addressInfo.district}
                    options={(places?.districts || []).map(d => d.name)}
                    placeholder="اختر المنطقة"
                    onChange={district => setAddressInfo(p => ({ ...p, district, subdistrict: '', village: '' }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-500 block">الناحية</label>
                  <ComboInput
                    ariaLabel="الناحية"
                    value={addressInfo.subdistrict}
                    options={subdistrictsOf(places, addressInfo.district).map(s => s.name)}
                    placeholder="اختر الناحية"
                    onChange={subdistrict => setAddressInfo(p => ({ ...p, ...(p.district ? {} : findSubdistrict(places, subdistrict)), subdistrict, village: '' }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-500 block">القرية</label>
                  <ComboInput
                    ariaLabel="القرية"
                    value={addressInfo.village}
                    options={villagesOf(places, addressInfo.district, addressInfo.subdistrict)}
                    placeholder="اختر القرية"
                    onChange={village => setAddressInfo(p => ({ ...p, ...findVillage(places, village, p.district, p.subdistrict), village }))}
                  />
                  <p className="text-xs text-neutral-400">{LIST_HINT}</p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-500 block">المدينة</label>
                  <ComboInput
                    ariaLabel="المدينة"
                    value={addressInfo.city}
                    options={(places?.cities || []).map(c => c.name)}
                    placeholder="اختر المدينة"
                    onChange={city => setAddressInfo(p => ({ ...p, city, area: '' }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-500 block">الحي</label>
                  <ComboInput
                    ariaLabel="الحي"
                    value={addressInfo.area}
                    options={areasOf(places, addressInfo.city)}
                    placeholder={areasOf(places, addressInfo.city).length ? 'اختر الحي' : 'اكتب اسم الحي'}
                    onChange={area => setAddressInfo(p => ({ ...p, area }))}
                  />
                  <p className="text-xs text-neutral-400">{LIST_HINT}</p>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 block">الشارع والرقم</label>
              <input
                type="text"
                value={addressInfo.street}
                onChange={e => setAddressInfo(p => ({ ...p, street: e.target.value }))}
                placeholder="اسم الشارع ورقم البناء"
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 block">تفصيل العنوان</label>
              <textarea
                value={addressInfo.details}
                onChange={e => setAddressInfo(p => ({ ...p, details: e.target.value }))}
                placeholder="معلومات إضافية للوصول..."
                rows={2}
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (!addressInfo.governorate) {
                    alert('يرجى اختيار المحافظة.');
                    return;
                  }
                  onNext();
                }}
                className="flex-1 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: معلومات الاتصال */}
        {cur === 3 && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-600 flex items-center gap-1.5"><EmailIcon size={20} />الإيميل الافتراضي</label>
              <input
                type="email"
                readOnly
                value={contactInfo.email}
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-500 font-mono text-left cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-600 flex items-center gap-1.5"><WhatsAppIcon size={20} />رقم واتساب (إجباري) *</label>
              <input
                type="tel"
                value={contactInfo.whatsapp}
                onChange={e => setContactInfo(p => ({ ...p, whatsapp: e.target.value }))}
                placeholder="+963 900 000 000"
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-600 flex items-center gap-1.5"><PhoneIcon size={20} />رقم الهاتف (غير إجباري)</label>
              <input
                type="tel"
                value={contactInfo.phone}
                onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))}
                placeholder="011 000 000"
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-600 flex items-center gap-1.5"><FacebookIcon size={20} />حساب فيسبوك (غير إجباري)</label>
              <input
                type="url"
                value={contactInfo.facebook}
                onChange={e => setContactInfo(p => ({ ...p, facebook: e.target.value }))}
                placeholder="https://facebook.com/..."
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-600 flex items-center gap-1.5"><TikTokIcon size={20} />حساب Tiktok (غير إجباري)</label>
              <input
                type="url"
                value={contactInfo.tiktok}
                onChange={e => setContactInfo(p => ({ ...p, tiktok: e.target.value }))}
                placeholder="https://tiktok.com/@..."
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (!contactInfo.whatsapp.trim()) {
                    alert('رقم واتساب إجباري لضمان التواصل.');
                    return;
                  }
                  onNext();
                }}
                className="flex-1 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: المهنة والكتالوج */}
        {cur === 4 && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 block">{labels.category}</label>
              <ComboInput
                ariaLabel={labels.category}
                value={catalogInfo.category}
                options={(occupationList || []).map(c => c.name)}
                placeholder={labels.ex[0]}
                onChange={category => {
                  const next = occupationList?.find(c => c.name === category.trim());
                  setCatalogInfo(p => {
                    // Choosing another catalog from the list drops a sub-catalog that is not in it.
                    const keep = !next || next.subs.some(s => s.name === p.subCategory.trim());
                    return { ...p, category, subCategory: keep ? p.subCategory : '', specialty: keep ? p.specialty : '' };
                  });
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 block">{labels.sub}</label>
              <ComboInput
                ariaLabel={labels.sub}
                value={catalogInfo.subCategory}
                options={(catalogEntry?.subs || []).map(s => s.name)}
                placeholder={labels.ex[1]}
                onChange={subCategory => setCatalogInfo(p => ({ ...p, subCategory }))}
              />
              {!labels.item && <p className="text-xs text-neutral-400">{LIST_HINT}</p>}
            </div>

            {labels.item && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-500 block">{labels.item}</label>
                <ComboInput
                  ariaLabel={labels.item}
                  value={catalogInfo.specialty}
                  options={jobOptions}
                  placeholder={labels.ex[2]}
                  onChange={specialty => setCatalogInfo(p => ({ ...p, specialty }))}
                />
                <p className="text-xs text-neutral-400">{LIST_HINT}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (!catalogInfo.category.trim()) {
                    alert(labels.need);
                    return;
                  }
                  onNext();
                }}
                className="flex-1 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: وصف الصفحة والخدمات (طبيعة الصفحة) */}
        {cur === 5 && (
          <div className="space-y-3.5">
            <textarea
              value={aiAnswers.description}
              onChange={e => setAiAnswers(p => ({ ...p, description: e.target.value }))}
              placeholder={DESCRIPTION_HINT[tone || 'page']}
              rows={4}
              className="w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!aiAnswers.description.trim()) {
                    alert('يرجى كتابة وصف بسيط للصفحة.');
                    return;
                  }
                  onNext();
                }}
                className="flex-1 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: اللون المفضل: the 12 page looks, or the personal five colours */}
        {cur === 6 && (
          <div className="space-y-3.5">
            <button
              type="button"
              onClick={() => setAiAnswers(p => ({ ...p, colorPalette: '', lookId: '' }))}
              className={`w-full p-2.5 rounded-xl border text-right text-sm font-bold transition-all cursor-pointer ${
                !aiAnswers.lookId && !(aiAnswers.colorPalette || '').startsWith('مخصص') ? 'border-brand bg-brand/5 ring-2 ring-brand/30 text-brand' : 'border-neutral-200 hover:border-neutral-300 text-neutral-800'
              }`}
            >
              خلّي Wee AI يختار الستايل المناسب لي
            </button>

            <div className="grid grid-cols-2 gap-2">
              {lookChoices.map(look => {
                const on = aiAnswers.lookId === look.id;
                return (
                  <button
                    key={look.id}
                    type="button"
                    onClick={() => setAiAnswers(p => ({ ...p, colorPalette: `ستايل: ${look.name}`, lookId: look.id }))}
                    aria-pressed={on}
                    className={`rounded-xl border overflow-hidden text-right transition-all cursor-pointer ${on ? 'border-brand ring-2 ring-brand/30' : 'border-neutral-200 hover:shadow-md'}`}
                  >
                    <div dir="rtl" className="p-3 flex flex-col gap-1.5" style={{ backgroundColor: look.bg, color: look.ink, fontFamily: `'${look.body}', sans-serif` }}>
                      <span className="text-base leading-snug" style={{ fontFamily: `'${look.head}', serif`, fontWeight: look.headWeight }}>أهلاً فيك</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs font-bold px-3 py-1" style={{ backgroundColor: look.accent, color: luminanceIsDark(look.accent) ? '#fff' : '#111', borderRadius: look.radius > 100 ? 999 : look.radius }}>اطلب</span>
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: look.card }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: look.soft }} />
                      </span>
                    </div>
                    <div className="px-3 py-2 border-t border-neutral-200 bg-white flex items-center justify-between gap-1">
                      <span className="text-sm font-bold text-neutral-900">{look.name}</span>
                      {on ? <Check size={14} className="text-brand" /> : suitsKind(look, buildKind) ? <span className="text-[11px] font-bold text-brand">بيناسبك</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-neutral-100 space-y-2">
              <button
                type="button"
                onClick={() => setAiAnswers(p => ({ ...p, lookId: '', colorPalette: `مخصص: ${(asPalette5(p.customPalette) || DEFAULT_PERSONAL_PALETTE)[4]}` }))}
                className={`w-full p-2.5 rounded-xl border text-right text-sm font-bold transition-all cursor-pointer ${
                  (aiAnswers.colorPalette || '').startsWith('مخصص') ? 'border-brand bg-brand/5 ring-2 ring-brand/30 text-brand' : 'border-neutral-200 hover:border-neutral-300 text-neutral-800'
                }`}
              >
                ألوان شخصية
              </button>
              {(aiAnswers.colorPalette || '').startsWith('مخصص') && (
                <PersonalPalette
                  value={asPalette5(aiAnswers.customPalette) || DEFAULT_PERSONAL_PALETTE}
                  onChange={pal => setAiAnswers(p => ({ ...p, customPalette: pal, customColor: pal[4], colorPalette: `مخصص: ${pal[4]}`, lookId: '' }))}
                />
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onNext}
                className="flex-1 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: تنسيق الشرائح */}
        {cur === 7 && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-3 gap-2.5">
              {SLIDE_DIVIDER_OPTIONS.map(div => {
                const on = currentDivider === div.id;
                return (
                  <button
                    key={div.id}
                    type="button"
                    onClick={() => setAiAnswers(p => ({ ...p, dividerStyle: div.id }))}
                    className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                      on ? 'border-brand bg-brand/5 ring-2 ring-brand/40 shadow-xs' : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                    title={div.name}
                  >
                    <div className="w-full h-11 border border-black/10 rounded-md overflow-hidden shadow-2xs">{div.renderPreview(on)}</div>
                    <span className={`text-xs truncate w-full ${on ? 'font-bold text-brand' : 'text-neutral-600'}`}>{div.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onNext}
                className="flex-1 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 9: صورة اللوغو (إن لم يرفع واحدة في الخطوة 1) */}
        {cur === 9 && (
          <div className="space-y-3.5">
            <div className="space-y-2">
              <label className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-center cursor-pointer text-xs font-bold text-neutral-700 flex items-center justify-center gap-1.5 transition-all">
                <Upload size={14} />
                <span>رفع صورة الشعار من الجهاز</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleDeviceImageUpload(e, url => setPersonalInfo(p => ({ ...p, logoUrl: url })), 'logo')}
                  className="hidden"
                />
              </label>

              {personalInfo.logoUrl && (
                <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  <img src={personalInfo.logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover" />
                  <span className="text-xs text-green-600 font-bold">✓ تم تحديد اللوغو</span>
                </div>
              )}

              <input
                type="url"
                value={personalInfo.logoUrl}
                onChange={e => setPersonalInfo(p => ({ ...p, logoUrl: e.target.value }))}
                placeholder="أو ضع رابط صورة اللوغو"
                className="w-full text-xs py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onNext}
                className="flex-1 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 11: هادئة وتدل على الجدية أم تأثيرات حركية وبصرية */}
        {cur === 11 && (
          <div className="space-y-3.5">
            <div className="space-y-2">
              {[
                { title: 'صفحة هادئة تدل على الجدية', val: 'صفحة هادئة وجادة' },
                { title: 'إضافة بعض التأثيرات الحركية والبصرية', val: 'تأثيرات حركية وبصرية' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setAiAnswers(p => ({ ...p, motionEffects: opt.val }))}
                  className={`w-full p-2.5 rounded-xl border text-right text-xs font-bold transition-all cursor-pointer ${
                    aiAnswers.motionEffects === opt.val ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 text-neutral-800'
                  }`}
                >
                  {opt.title}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onNext}
                className="flex-1 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}
    </>
  );

  // The special notes and the finish button: the last bubble of the thread (finishing opens the site, and Wee AI builds it at once).
  const finale = (
    <AiBubble title={withName('آخر شي يا {name}، في ملاحظات خاصة بتحب أنتبه إلها؟', firstName)} live={step < 13}>
      <AnswerBox>
        <div className="space-y-3">
          <textarea
            value={aiAnswers.specialInstructions}
            onChange={e => setAiAnswers(p => ({ ...p, specialInstructions: e.target.value }))}
            placeholder="اكتب أي ملاحظات أو متطلبات خاصة هنا (يمكن تركه فارغاً)..."
            rows={4}
            className="w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white"
          />
          <button
            type="button"
            onClick={() => {
              // Finishing saves the answers and opens the editor, where Wee AI builds the site from them at once.
              finishedRef.current = true;
              setStep(13);
              saveProgress(13);
              onCompleteChat?.({ personalInfo, addressInfo, contactInfo, catalogInfo, aiAnswers, ...(ownFlavor ? { flavor: ownFlavor } : {}) });
            }}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <span>إنهاء وتجهيز الإجابات</span>
          </button>
        </div>
      </AnswerBox>
    </AiBubble>
  );

  // The thread: every question already reached, Wee AI's words and the answer beneath it. The one being asked (or edited) holds its form.
  const thread = (
    <div className="space-y-3">
      {path.map((n) => {
        if (n === 12) {
          return (
            <div key={n} className="space-y-3">
              {qModel ? (
                <SectionQuestions
                  model={forCategory(qModel, tone, catalogInfo.customCategory || catalogInfo.category)}
                  kind={tone}
                  name={firstName}
                  ticked={aiAnswers.optionalSections}
                  answers={aiAnswers.sectionAnswers || {}}
                  onTicked={(ids) => setAiAnswers((p) => ({ ...p, optionalSections: ids }))}
                  onAnswers={(a) => setAiAnswers((p) => ({ ...p, sectionAnswers: a }))}
                  finale={finale}
                  onTopic={onSectionTopic}
                  custom={{ form: (id) => customForms[id]?.(), summary: customSummary, clear: customClear }}
                />
              ) : (
                // The questions come from the page's model only: while it loads there is nothing to ask yet.
                <AiBubble title={askText(12)} live>
                  <p className="text-xs font-bold text-neutral-500">عم جهّز أسئلة أقسام صفحتك من نموذجها...</p>
                </AiBubble>
              )}
            </div>
          );
        }
        const live = active === n;
        const text = answerText(n);
        return (
          <div key={n} ref={live ? liveRef : undefined} className="space-y-2 scroll-mt-2">
            <AiBubble title={askText(n)} live={live}>
              {live && <AnswerBox>{renderForm(n)}</AnswerBox>}
            </AiBubble>
            {n < step && !live && <UserBubble text={text} onEdit={() => setEditing(n)} />}
          </div>
        );
      })}
      {step >= 13 && (
        <AiBubble title={withName('خلصنا يا {name}! كل إجاباتك انحفظت.', firstName)} live>
          {embedded && onCompleteChat && (
            <button
              type="button"
              onClick={() => onCompleteChat({ personalInfo, addressInfo, contactInfo, catalogInfo, aiAnswers, ...(ownFlavor ? { flavor: ownFlavor } : {}) })}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all"
            >
              {isGuest ? 'اعمل حسابك لتنحفظ صفحتك' : 'ابني صفحتي'}
            </button>
          )}
        </AiBubble>
      )}
    </div>
  );

  // IF COLLAPSED: We return null to avoid covering any bottom sections in the control panel
  if (isCollapsed) {
    return null;
  }

  // IF EXPANDED: Positioned exactly below top drag handle/headers (64px offset) so handle remains free!
  return (
    <div 
      className={`${inFlow ? 'relative flex-1 min-h-0' : `absolute ${embedded ? 'top-0' : 'top-[64px]'} left-0 right-0 bottom-0 z-30`} bg-white flex flex-col overflow-hidden text-right select-none font-sans`}
      dir="rtl"
    >
      {/* Dynamic Typewriter Active Question Header */}
      <div className="flex items-start justify-between gap-2.5 p-3 bg-[#fbfbfd] border-b border-neutral-150 shrink-0">
        <div className="flex items-start gap-2.5">
          {/* The same three dots as the editor's side column */}
          <div className="w-8 h-8 rounded-full bg-brand/5 flex items-center justify-center shrink-0">
            <WeeDots size={22} />
          </div>
          <div className="space-y-0.5 text-right">
            <div className="text-xs font-black text-neutral-400 select-none tracking-wider">مساعدك الشخصي (wee ai)</div>
            <h4 className="font-bold text-neutral-900 text-sm leading-relaxed">
              {onEditAnswers ? (step >= 13 ? 'هي إجاباتك. Wee AI بيبني صفحتك منها.' : 'جاوب على أسئلة Wee AI أولاً، وبعدها بيبني صفحتك.') : 'نحكي سوا خطوة خطوة، وبعدها بيبني Wee AI صفحتك.'}
            </h4>
          </div>
        </div>

        {/* Minimize Button (the docked panel's column has Wee AI's own tile for that) */}
        {!inFlow && <button
          type="button"
          onClick={toggleCollapse}
          className="w-7 h-7 rounded-lg hover:bg-neutral-200 border border-neutral-200/50 text-neutral-500 hover:text-black flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5"
          title="تصغير المحاورة لأسفل لوحة التحكم"
        >
          <ChevronDown size={15} strokeWidth={2.4} />
        </button>}
      </div>

      {introSlot && <div className="p-3 pb-0 shrink-0">{introSlot}</div>}

      {/* The conversation, and «ابن صفحتي» at its end (Eyad, 29 Oct) */}
      <div className="flex-1 min-h-0 overflow-y-auto">
      {/* In the editor: the answers in short, and the way back to the questions */}
      {onEditAnswers ? (
        <AnswersSummary
          done={step >= 13}
          rows={[
            ['اسم الصفحة', personalInfo.pageName || personalInfo.fullName],
            [tone === 'restaurant' ? 'نوع المطعم' : tone === 'shop' ? 'المنتجات' : tone === 'cars' ? 'نوع المعرض' : tone === 'rental' ? 'شو بتأجّر' : tone === 'hotel' ? 'نوع المكان' : 'العمل', [catalogInfo.customCategory || catalogInfo.category, catalogInfo.subCategory, catalogInfo.customSpecialty || catalogInfo.specialty].filter(Boolean).join('، ')],
            ['الوصف', aiAnswers.description],
            ['الألوان', colorSummary],
            ['طابع الصفحة', aiAnswers.motionEffects],
            ['الخدمات', (aiAnswers.services || []).filter((r: { name: string }) => r.name?.trim()).map((r: { name: string }) => r.name).join('، ')],
            ['المزايا', (aiAnswers.features || []).join('، ')],
          ]}
          onEdit={onEditAnswers}
        />
      ) : (
      <div className="p-4 space-y-4 text-xs text-neutral-800">
        {thread}
      </div>
      )}

      {/* Wee AI builds the page from the answers above (after signing up): the last thing in the conversation */}
      {!isGuest && !embedded && <div className="px-4 pb-4 space-y-2">
        {writeNote && (
          <p role="status" className={`text-xs font-semibold leading-relaxed ${writeNote.ok ? 'text-green-700' : 'text-rose-600'}`}>
            {writeNote.message}
          </p>
        )}
        <button
          type="button"
          disabled={!onBuildPage || step < 13 || isBuilding}
          onClick={async () => {
            if (!onBuildPage) return;
            setIsBuilding(true);
            setWriteNote(null);
            try {
              const note = await onBuildPage({ personalInfo, addressInfo, contactInfo, catalogInfo, aiAnswers, ...(ownFlavor ? { flavor: ownFlavor } : {}) });
              setWriteNote(note);
              if (note.ok) setCanRestore(true);
            } finally {
              setIsBuilding(false);
            }
          }}
          className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            step < 13 || !onBuildPage
              ? 'text-neutral-400 bg-neutral-100 border border-neutral-200 cursor-not-allowed'
              : 'text-white bg-gradient-to-l from-violet-600 to-brand hover:brightness-110 cursor-pointer disabled:cursor-wait shadow-[0_6px_16px_rgba(79,70,229,0.25)]'
          }`}
          title={step < 13 ? 'جاوب على الأسئلة أولاً، وبعدها بيبني Wee AI صفحتك' : 'Wee AI يصمم صفحتك من الشرائح الجاهزة بألوانك ونصوصك وصورك'}
        >
          <span className={`rounded-full p-0.5 flex ${step < 13 || !onBuildPage ? '' : 'bg-white'}`}>
            <WeeDots size={16} busy={isBuilding} />
          </span>
          <span>{isBuilding ? 'Wee AI عم يبني صفحتك…' : 'ابن صفحتي'}</span>
        </button>
        {onFreeTurn && step >= 13 && (
          <div className="rounded-xl border border-violet-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setFreeOpen((v) => !v)}
              className="w-full py-2.5 px-3 text-xs font-bold text-violet-700 flex items-center justify-between cursor-pointer"
            >
              <span>تصميم حر (محادثة مع Wee AI)</span>
              <span aria-hidden>{freeOpen ? '▾' : '◂'}</span>
            </button>
            {freeOpen && (
              <div className="border-t border-violet-100 p-2 space-y-2">
                <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs leading-relaxed">
                  {freeLog.length === 0 && <p className="text-neutral-400">اكتب شو بدك تكون صفحتك (الجو، الألوان، الأقسام، الحركات) وWee AI بيصممها بشرائح وعناصر المنصة. بعدها عدّل بالمحادثة: «خلي القسم الأول أغمق»، «زيد قسم آراء».</p>}
                  {freeLog.map((m, i) => (
                    <p key={i} className={`rounded-lg px-2 py-1 font-semibold ${m.role === 'user' ? 'bg-violet-50 text-violet-900' : m.ok === false ? 'bg-rose-50 text-rose-700' : 'bg-neutral-100 text-neutral-700'}`}>{m.text}</p>
                  ))}
                  {freeBusy && <p className="text-violet-600 font-semibold">Wee AI عم يصمم…</p>}
                </div>
                <form
                  className="flex gap-1.5"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const text = freeText.trim();
                    if (!text || freeBusy) return;
                    setFreeText('');
                    setFreeLog((l) => [...l, { role: 'user', text }]);
                    setFreeBusy(true);
                    try {
                      const note = await onFreeTurn({ personalInfo, addressInfo, contactInfo, catalogInfo, aiAnswers, ...(ownFlavor ? { flavor: ownFlavor } : {}) }, text, freeFresh.current);
                      freeFresh.current = false;
                      setFreeLog((l) => [...l, { role: 'ai', text: note.message, ok: note.ok }]);
                      if (note.ok) setCanRestore(true);
                    } finally {
                      setFreeBusy(false);
                    }
                  }}
                >
                  <input
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    disabled={freeBusy}
                    placeholder="اكتب طلبك لـ Wee AI…"
                    className="flex-1 min-w-0 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
                  />
                  <button type="submit" disabled={freeBusy || !freeText.trim()} className="px-3 rounded-lg bg-violet-600 text-white text-xs font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">أرسل</button>
                </form>
                {freeLog.length > 0 && !freeBusy && (
                  <button type="button" onClick={() => { freeFresh.current = true; setFreeLog([]); }} className="text-xs font-semibold text-neutral-500 underline underline-offset-2 cursor-pointer">ابدأ تصميم جديد من الصفر</button>
                )}
              </div>
            )}
          </div>
        )}
        {(canRestore || restoreAvailable) && onRestorePage && !isBuilding && (
          <button
            type="button"
            onClick={() => {
              setWriteNote(onRestorePage());
              setCanRestore(false);
            }}
            className="w-full text-xs font-semibold text-neutral-500 hover:text-neutral-800 underline underline-offset-2 cursor-pointer"
          >
            رجّع صفحتي متل ما كانت
          </button>
        )}
        {step < 13 && !onEditAnswers && <p className="text-xs text-neutral-400 text-center">جاوب على الأسئلة أولاً، وبعدها بيبني Wee AI صفحتك.</p>}
      </div>}
      </div>

    </div>
  );
};
