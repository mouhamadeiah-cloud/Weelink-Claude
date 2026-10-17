// «اعمل صفحتك»: everyone picks the kind of page first, then answers Wee AI's questions here (Eyad,
// 12 Oct: one way in for all). A visitor answers without an account and signs up at the end; the
// answers move to the new account (services/guestAnswers.ts). A signed-in owner answers under their
// account, with their earlier answers filled in, and the editor opens and builds the page.
// The browser's back button goes from the questions back to the kinds.
import { PlatformNav } from '../platform/PlatformNav';
import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { ArrowLeft, CarFront, Check, ClipboardList, FileText, Loader2, Palette, ShoppingBag, Sparkles, UtensilsCrossed } from 'lucide-react';
import { WeeAIChat, WEE_GUEST_ID } from '../WeeAIChat';
import { PlanPicker } from './PlanPicker';
import { DesignerGallery } from '../gallery/DesignerGallery';
import { AttentionDot, useOrderAttention } from '../../services/orderAttention';
import { DesignOrdersPanel } from '../designOrders/DesignOrdersPanel';
import type { GallerySlide } from '../../services/galleryView';
import { guestKindOf, readGuestAnswers, setGuestKind } from '../../services/guestAnswers';
import { CAR_PHOTOS, carPhoto } from '../../data/carShowroomTemplate';
import type { ProjectType } from '../shop/shopTypes';

// One of the account's projects on «مشاريعي»: its key (src/utils/projectKeys.ts), and its address when published.
export type MyProject = { key: string; kind: ProjectType; name: string; published: string | null; url: string | null };

const photo = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

const HERO = photo('1522071820081-009f0129c71c', 1600);
const STEPS = ['اختار نوع مشروعك', 'اختار باقتك', 'جاوب على أسئلة Wee AI', 'اعمل حسابك ومشروعك جاهز'];
const QUESTION_COUNT = 12;

// Photos of running the business, unlike the home page's search and order cards (Eyad, 12 Oct).
const KINDS: { type: ProjectType; title: string; line: string; perks: string[]; icon: React.ElementType; image: string }[] = [
  {
    type: 'page',
    title: 'مشروع لعملك',
    line: 'طبيب، محامي، كهربائي، مدرّس… مشروع يعرّف بك وبخدماتك.',
    perks: ['خدماتك وأسعارك', 'عنوانك على الخريطة', 'واتساب واتصال مباشر'],
    icon: FileText,
    image: photo('1454165804606-c3d57bc86b40'),
  },
  {
    type: 'shop',
    title: 'متجر أونلاين',
    line: 'منتجاتك بأقسام ومستودع وطلبات وتوصيل.',
    perks: ['سلة وطلب من الموبايل', 'مستودع وحسابات', 'عروض بالواجهة'],
    icon: ShoppingBag,
    image: photo('1460925895917-afdab827c52f'),
  },
  {
    type: 'restaurant',
    title: 'مطعم',
    line: 'منيو وطلب أونلاين وكاشير ومطبخ.',
    perks: ['منيو بالصور', 'الطلبات للمطبخ لحظياً', 'طاولات QR'],
    icon: UtensilsCrossed,
    image: photo('1517248135467-4c7edcad34c4'),
  },
  {
    type: 'cars',
    title: 'معرض سيارات',
    line: 'سياراتك بالصور والمواصفات والأسعار.',
    perks: ['بحث متقدم للزوار', 'طلبات تجربة', 'مصاريف وربح كل سيارة'],
    icon: CarFront,
    image: carPhoto(CAR_PHOTOS.dark, 1200),
  },
];

interface StartPageProps {
  user: User | null;
  // The account the answers belong to (a team member's is the owner's).
  accountId: string;
  // Opens straight on this kind's questions (from «عدّل إجاباتي» in the editor).
  initialKind?: ProjectType | null;
  onHome: () => void;
  // The top bar's account entries (the same bar as the front page).
  onOpenMyPage?: () => void;
  onLaw?: () => void;
  onAccount?: () => void;
  onMyAccount?: (section?: 'notices') => void;
  onLogout?: () => void;
  // A signed-in owner finished the questions: open this kind and build it from the answers.
  onBuild: (kind: ProjectType, answers: any) => void;
  // A guest finished the questions: sign up, then open this kind.
  onSignUp: (kind: ProjectType) => void;
  // «انضم لمصممينا»: a visitor signs up as a designer; a signed-in owner becomes one.
  onDesigner: () => void;
  // «أضف لصفحتي مجاناً» on a gallery design: it goes into the signed-in owner's own page.
  onAddDesign?: (slide: GallerySlide, fit: boolean) => Promise<{ ok: boolean; message: string }>;
  // «تعديل» on a design of the signed-in designer's own: the editor opens on it.
  onEditDesign?: (slide: GallerySlide) => void;
  loadingType?: ProjectType | null;
  // The kinds this account already has a project of (the free package is once per account).
  owned?: ProjectType[];
  // «مشاريعي»: the account's projects, published or not (Eyad, 17 Oct). Null while they load.
  projects?: MyProject[] | null;
  onOpenProject?: (key: string) => void;
  onUnpublish?: (key: string) => Promise<boolean>;
}

export const StartPage: React.FC<StartPageProps> = ({ user, accountId, initialKind, onHome, onOpenMyPage, onLaw, onAccount, onMyAccount, onLogout, onBuild, onSignUp, onDesigner, onAddDesign, onEditDesign, loadingType, owned = [], projects = null, onOpenProject, onUnpublish }) => {
  const signedIn = !!user && !user.isAnonymous;
  const attention = useOrderAttention(signedIn && user ? user.uid : '');
  const [kind, setKind] = useState<ProjectType | null>(initialKind || null);
  // After the kind come its packages, then the questions (Eyad, 12 Oct). Editing the answers from
  // the editor opens straight on the questions.
  const [stage, setStage] = useState<'plans' | 'questions'>(initialKind ? 'questions' : 'plans');
  const [step, setStep] = useState(1);
  // The design orders window («طلبات التصميم»), open on an order or on the list.
  const [orders, setOrders] = useState<{ id: string } | null>(null);
  const saved = signedIn ? null : guestKindOf(readGuestAnswers());

  // The questions are a step of their own in the browser's history: back returns to the kinds.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (e.state?.screen === 'start') {
        setKind(e.state.kind || null);
        setStage(e.state.stage === 'questions' ? 'questions' : 'plans');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // A kind always starts a new project; the ones started before open from «مشاريعي».
  const choose = (type: ProjectType) => {
    if (!signedIn) setGuestKind(type);
    setStep(1);
    setKind(type);
    setStage('plans');
    window.history.pushState({ screen: 'start', kind: type, stage: 'plans' }, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const startQuestions = () => {
    setStage('questions');
    window.history.pushState({ screen: 'start', kind, stage: 'questions' }, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // One step back: from the questions to the packages, from the packages to the kinds.
  const stepBack = () => {
    if (window.history.state?.screen === 'start' && window.history.state.kind) window.history.back();
    else if (stage === 'questions' && !initialKind) setStage('plans');
    else setKind(null);
  };

  const chosen = KINDS.find((k) => k.type === kind);
  const progress = Math.min(1, (Math.min(step, QUESTION_COUNT + 1) - 1) / QUESTION_COUNT);

  return (
    <div className="min-h-screen bg-bg text-ink" dir="rtl">
      <PlatformNav
        current="start"
        user={user}
        onHome={onHome}
        onStart={() => { if (kind) setKind(null); else window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onOpenMyPage={onOpenMyPage || onHome}
        onLaw={onLaw || onHome}
        onAccount={onAccount || onHome}
        onMyAccount={onMyAccount || onHome}
        onLogout={onLogout || onHome}
        extra={signedIn && !kind ? (
          <button type="button" onClick={() => setOrders({ id: '' })} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-ink">
            <ClipboardList size={14} /> طلبات التصميم <AttentionDot n={attention} />
          </button>
        ) : undefined}
      />
      {kind && (
        <div className="mx-auto max-w-6xl px-4 pt-3">
          <button type="button" onClick={stepBack} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand">
            → {stage === 'questions' && !initialKind ? 'الباقات' : 'نوع المشروع'}
          </button>
        </div>
      )}

      {!chosen ? (
        <main key="kinds" className="max-w-6xl mx-auto px-4 py-5 sm:py-8 space-y-6 sm:space-y-8">
          {/* Hero: what happens, in three steps */}
          <section className="wl-rise relative rounded-card overflow-hidden bg-ink min-h-[260px] sm:min-h-[320px] flex items-end text-white">
            <img src={HERO} alt="" className="wl-drift absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
            <div className="relative p-5 sm:p-8 w-full space-y-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 backdrop-blur rounded-full px-3 py-1">
                <Sparkles size={13} /> مجاناً، مع Wee AI
              </span>
              <h1 className="text-title sm:text-display font-bold">شو بدك تعمل؟</h1>
              <p className="text-sm sm:text-base opacity-90 max-w-xl leading-relaxed">
                {signedIn ? 'اختر نوع مشروعك وباقتك وجاوب على كم سؤال، وبعدين بتصممها بإيدك أو بيبنيها إلك Wee AI. إجاباتك القديمة معبّاية، بس عدّل اللي بدك.' : 'اختر نوع مشروعك وباقتك وجاوب على كم سؤال. الحساب بتعمله بالآخر، وإجاباتك بتنحفظ فيه.'}
              </p>
              {!signedIn && (
                <ol className="flex flex-wrap gap-2">
                  {STEPS.map((s, i) => (
                    <li key={s} className="flex items-center gap-2 bg-white/12 backdrop-blur rounded-full pl-3 pr-1 py-1 text-xs font-bold">
                      <span className="w-6 h-6 rounded-full bg-white text-ink flex items-center justify-center text-xs">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          {signedIn && <MyProjects projects={projects} loadingType={loadingType} onOpen={onOpenProject} onUnpublish={onUnpublish} />}

          {/* The four kinds, as photo cards */}
          {signedIn && <h2 className="text-heading font-bold">إضافة مشروع</h2>}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {KINDS.map((k, i) => (
              <button
                key={k.type}
                type="button"
                disabled={!!loadingType}
                onClick={() => choose(k.type)}
                style={{ animationDelay: `${120 + i * 90}ms` }}
                className="wl-rise group relative rounded-card overflow-hidden text-right text-white bg-ink min-h-[220px] sm:min-h-[340px] flex items-end transition duration-300 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
              >
                <img src={k.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />
                {saved === k.type && (
                  <span className="absolute top-3 right-3 bg-surface text-brand text-xs font-bold rounded-full px-2.5 py-1">إجاباتك محفوظة</span>
                )}
                <span className="relative p-5 w-full space-y-2">
                  <span className="flex items-center gap-2 text-heading font-bold"><k.icon size={20} className="shrink-0" />{k.title}</span>
                  <span className="block text-xs opacity-90 leading-relaxed">{k.line}</span>
                  <span className="hidden sm:grid gap-1 pt-1 max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
                    {k.perks.map((p) => (
                      <span key={p} className="flex items-center gap-1.5 text-xs font-bold"><Check size={12} /> {p}</span>
                    ))}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold pt-1">
                    {loadingType === k.type ? <Loader2 size={14} className="animate-spin" /> : null}
                    {signedIn && owned.includes(k.type) ? 'مشروع جديد' : 'ابدأ'}
                    <ArrowLeft size={14} className="transition group-hover:-translate-x-1.5" />
                  </span>
                </span>
              </button>
            ))}

            {/* The fifth card: designers join here (their own sign-up, a free page with a gallery of their slides) */}
            <button
              type="button"
              disabled={!!loadingType}
              onClick={onDesigner}
              style={{ animationDelay: `${120 + KINDS.length * 90}ms` }}
              className="wl-rise group relative rounded-card overflow-hidden text-right text-white bg-ink min-h-[220px] sm:min-h-[340px] sm:col-span-2 lg:col-span-1 flex items-end transition duration-300 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
            >
              <img src="/designers/designer-card.jpg" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-[25%_70%] transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />
              <span className="relative p-5 w-full space-y-2">
                <span className="flex items-center gap-2 text-heading font-bold"><Palette size={20} className="shrink-0" />انضم لمصممينا</span>
                <span className="block text-xs opacity-90 leading-relaxed">اعمل مشروعك مجاناً واكسب من التصميم للزبائن.</span>
                <span className="hidden sm:grid gap-1 pt-1 max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
                  {['معرض لشرائحك باسمك', 'زبائن يضيفون شرائحك لمشاريعهم', 'أرباح من تصميم مشاريع الزبائن'].map((p) => (
                    <span key={p} className="flex items-center gap-1.5 text-xs font-bold"><Check size={12} /> {p}</span>
                  ))}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold pt-1">
                  انضم
                  <ArrowLeft size={14} className="transition group-hover:-translate-x-1.5" />
                </span>
              </span>
            </button>
          </section>

          {/* The designers' approved slides, under the cards */}
          <DesignerGallery user={user} onEditDesign={onEditDesign} onAddToMyPage={onAddDesign} onOpenOrders={(id) => setOrders({ id: id || '' })} />
        </main>
      ) : stage === 'plans' ? (
        <PlanPicker key={`plans-${chosen.type}`} kind={chosen.type} owner={signedIn ? accountId : 'guest'} title={chosen.title} onPicked={startQuestions} freeTaken={signedIn && chosen.type === 'page' && owned.includes('page')} />
      ) : (
        <main key="chat" className="max-w-6xl mx-auto px-4 py-4 sm:py-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-6 lg:items-start space-y-3 lg:space-y-0">
          {/* The chosen kind's photo: a banner on a phone, a tall panel beside the questions on a wide screen */}
          <aside className="wl-rise relative rounded-card overflow-hidden text-white bg-ink h-36 lg:h-[calc(100dvh-7rem)] lg:sticky lg:top-20 lg:order-2">
            <img src={chosen.image} alt="" className="wl-drift absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute bottom-0 inset-x-0 p-4 lg:p-7 space-y-2 lg:space-y-4">
              <div className="flex items-center gap-2.5">
                <chosen.icon size={22} className="shrink-0" />
                <span className="text-heading lg:text-title font-bold">{chosen.title}</span>
              </div>
              <p className="hidden lg:block text-sm opacity-90 leading-relaxed max-w-md">{chosen.line}</p>
              <ul className="hidden lg:grid gap-2">
                {chosen.perks.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm font-bold"><span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><Check size={13} /></span>{p}</li>
                ))}
              </ul>
              {/* How far along the questions are */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold opacity-90">
                  <span>{step > QUESTION_COUNT ? 'خلصت الأسئلة' : `السؤال ${step} من ${QUESTION_COUNT}`}</span>
                  <span>{Math.round(progress * 100)}٪</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/25 overflow-hidden">
                  <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${Math.max(4, progress * 100)}%` }} />
                </div>
              </div>
            </div>
          </aside>
          <div className="wl-rise relative h-[calc(100dvh-14rem)] lg:h-[calc(100dvh-7rem)] min-h-[440px] rounded-card overflow-hidden border border-line bg-surface lg:order-1" style={{ animationDelay: '120ms' }}>
            <WeeAIChat
              key={`${chosen.type}-${signedIn ? accountId : WEE_GUEST_ID}`}
              userId={signedIn ? accountId : WEE_GUEST_ID}
              userEmail={signedIn ? user?.email || "" : ""}
              pageKind={chosen.type}
              embedded
              fromStart
              isCollapsed={false}
              onToggleCollapse={stepBack}
              onStepChange={setStep}
              onCompleteChat={(answers) => {
                setStep(QUESTION_COUNT + 1);
                if (signedIn) onBuild(chosen.type, answers);
                else onSignUp(chosen.type);
              }}
            />
          </div>
        </main>
      )}

      {orders && user && !user.isAnonymous && <DesignOrdersPanel user={user} initialOrderId={orders.id} onClose={() => setOrders(null)} />}
    </div>
  );
};

const KIND_NAME: Record<ProjectType, string> = { page: 'صفحة', shop: 'متجر', cars: 'معرض سيارات', restaurant: 'مطعم' };

// «مشاريعي»: every project of the account, published or a draft. A published one keeps running while
// it is edited; «نشر» in the editor puts the changes live, «إيقاف النشر» takes it down.
const MyProjects: React.FC<{ projects: MyProject[] | null; loadingType?: ProjectType | null; onOpen?: (key: string) => void; onUnpublish?: (key: string) => Promise<boolean> }> = ({ projects, loadingType, onOpen, onUnpublish }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const stop = async (p: MyProject) => {
    if (!onUnpublish || !window.confirm(`إيقاف نشر «${p.name || KIND_NAME[p.kind]}»؟ الرابط بيوقف لحد ما تنشرو من جديد، ومشروعك بيضل محفوظ.`)) return;
    setBusy(p.key);
    const ok = await onUnpublish(p.key);
    setBusy(null);
    if (!ok) window.alert('ما قدرنا نوقف النشر. جرّب مرة ثانية.');
  };
  return (
    <section className="space-y-3" aria-labelledby="my-projects">
      <h2 id="my-projects" className="text-heading font-bold">مشاريعي</h2>
      {projects === null ? (
        <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={15} className="animate-spin" /> عم نجيب مشاريعك…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted">ما عندك مشاريع لسا. اختار نوع مشروعك تحت وبلّش.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => (
            <li key={p.key} className="rounded-card border border-line bg-surface p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-muted">{KIND_NAME[p.kind]}</p>
                  <p className="text-sm font-bold truncate">{p.name || 'بدون اسم'}</p>
                </div>
                <span className={`shrink-0 text-xs font-bold rounded-full px-2.5 py-1 ${p.published ? 'bg-brand/10 text-brand' : 'bg-bg text-muted'}`}>{p.published ? 'منشور' : 'مسودة'}</span>
              </div>
              {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand truncate hover:underline" dir="ltr">{p.url.replace(/^https?:\/\//, '')}</a>}
              <div className="mt-auto flex flex-wrap gap-2">
                <button type="button" disabled={!!loadingType || !onOpen} onClick={() => onOpen?.(p.key)} className="h-9 px-3.5 rounded-ctl bg-brand hover:bg-brand-hover text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-60">
                  {p.published ? 'تعديل' : 'كمّل المشروع'} <ArrowLeft size={13} />
                </button>
                {p.published && onUnpublish && (
                  <button type="button" disabled={busy === p.key} onClick={() => stop(p)} className="h-9 px-3.5 rounded-ctl border border-line text-xs font-bold text-muted hover:text-ink inline-flex items-center gap-1.5 disabled:opacity-60">
                    {busy === p.key && <Loader2 size={13} className="animate-spin" />} إيقاف النشر
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
