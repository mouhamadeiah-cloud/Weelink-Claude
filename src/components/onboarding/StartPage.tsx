// «اعمل صفحتك»: everyone picks the kind of page first, then answers Wee AI's questions here (Eyad,
// 12 Oct: one way in for all). A visitor answers without an account and signs up at the end; the
// answers move to the new account (services/guestAnswers.ts). A signed-in owner answers under their
// account, with their earlier answers filled in, and the editor opens and builds the page.
// The browser's back button goes from the questions back to the kinds.
import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { ArrowLeft, CarFront, Check, FileText, Loader2, ShoppingBag, Sparkles, UtensilsCrossed } from 'lucide-react';
import { WeeAIChat, WEE_GUEST_ID } from '../WeeAIChat';
import { guestKindOf, readGuestAnswers, setGuestKind } from '../../services/guestAnswers';
import { FOOD_PHOTOS, foodPhoto } from '../restaurant/restaurantTypes';
import { CAR_PHOTOS, carPhoto } from '../../data/carShowroomTemplate';
import type { ProjectType } from '../shop/shopTypes';

const HEAD_FONT = "'Readex Pro', 'IBM Plex Sans Arabic', sans-serif";
const photo = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

const HERO = photo('1522071820081-009f0129c71c', 1600);
const STEPS = ['اختار نوع صفحتك', 'جاوب على أسئلة Wee AI', 'اعمل حسابك وصفحتك جاهزة'];
const QUESTION_COUNT = 12;

const KINDS: { type: ProjectType; title: string; line: string; perks: string[]; icon: React.ElementType; accent: string; image: string }[] = [
  {
    type: 'page',
    title: 'صفحة لعملك',
    line: 'طبيب، محامي، كهربائي، مدرّس… صفحة تعرّف بك وبخدماتك.',
    perks: ['خدماتك وأسعارك', 'عنوانك على الخريطة', 'واتساب واتصال مباشر'],
    icon: FileText,
    accent: '#0071e3',
    image: photo('1504307651254-35680f356dfd'),
  },
  {
    type: 'shop',
    title: 'متجر أونلاين',
    line: 'منتجاتك بأقسام ومستودع وطلبات وتوصيل.',
    perks: ['سلة وطلب من الموبايل', 'مستودع وحسابات', 'عروض بالواجهة'],
    icon: ShoppingBag,
    accent: '#7c3aed',
    image: photo('1441986300917-64674bd600d8'),
  },
  {
    type: 'restaurant',
    title: 'مطعم',
    line: 'منيو وطلب أونلاين وكاشير ومطبخ.',
    perks: ['منيو بالصور', 'الطلبات للمطبخ لحظياً', 'طاولات QR'],
    icon: UtensilsCrossed,
    accent: '#c2410c',
    image: foodPhoto(FOOD_PHOTOS.grill, 1200),
  },
  {
    type: 'cars',
    title: 'معرض سيارات',
    line: 'سياراتك بالصور والمواصفات والأسعار.',
    perks: ['بحث متقدم للزوار', 'طلبات تجربة', 'مصاريف وربح كل سيارة'],
    icon: CarFront,
    accent: '#C8102E',
    image: carPhoto(CAR_PHOTOS.showroom, 1200),
  },
];

interface StartPageProps {
  user: User | null;
  // The account the answers belong to (a team member's is the owner's).
  accountId: string;
  // Opens straight on this kind's questions (from «عدّل إجاباتي» in the editor).
  initialKind?: ProjectType | null;
  onHome: () => void;
  // A signed-in owner finished the questions: open this kind and build it from the answers.
  onBuild: (kind: ProjectType, answers: any) => void;
  // A guest finished the questions: sign up, then open this kind.
  onSignUp: (kind: ProjectType) => void;
  loadingType?: ProjectType | null;
}

export const StartPage: React.FC<StartPageProps> = ({ user, accountId, initialKind, onHome, onBuild, onSignUp, loadingType }) => {
  const signedIn = !!user && !user.isAnonymous;
  const [kind, setKind] = useState<ProjectType | null>(initialKind || null);
  const [step, setStep] = useState(1);
  const saved = signedIn ? null : guestKindOf(readGuestAnswers());

  // The questions are a step of their own in the browser's history: back returns to the kinds.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (e.state?.screen === 'start') setKind(e.state.kind || null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const choose = (type: ProjectType) => {
    if (!signedIn) setGuestKind(type);
    setStep(1);
    setKind(type);
    window.history.pushState({ screen: 'start', kind: type }, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const backToKinds = () => {
    if (window.history.state?.screen === 'start' && window.history.state.kind) window.history.back();
    else setKind(null);
  };

  const chosen = KINDS.find((k) => k.type === kind);
  const progress = Math.min(1, (Math.min(step, QUESTION_COUNT + 1) - 1) / QUESTION_COUNT);

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-[#1c1a17]" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Readex Pro', sans-serif" }}>
      <header className="sticky top-0 z-30 bg-[#f6f3ee]/85 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button type="button" onClick={kind ? backToKinds : onHome} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5b5348] hover:text-[#c2410c] transition">
            → {kind ? 'نوع الصفحة' : 'الرئيسية'}
          </button>
          <div className="flex-1" />
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#40a9ff] text-white flex items-center justify-center font-bold">W</span>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>weelink</span>
          </span>
        </div>
      </header>

      {!chosen ? (
        <main key="kinds" className="max-w-6xl mx-auto px-4 py-5 sm:py-8 space-y-6 sm:space-y-8">
          {/* Hero: what happens, in three steps */}
          <section className="wl-rise relative rounded-[2rem] overflow-hidden min-h-[260px] sm:min-h-[320px] flex items-end text-white">
            <img src={HERO} alt="" className="wl-drift absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
            <div className="relative p-5 sm:p-8 w-full space-y-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/15 backdrop-blur rounded-full px-3 py-1">
                <Sparkles size={13} /> مجاناً، مع Wee AI
              </span>
              <h1 className="text-3xl sm:text-5xl font-bold leading-tight" style={{ fontFamily: HEAD_FONT }}>شو بدك تعمل؟</h1>
              <p className="text-sm sm:text-base opacity-90 max-w-xl leading-relaxed">
                {signedIn ? 'اختر نوع صفحتك وجاوب على كم سؤال، وWee AI بيبنيها إلك. إجاباتك القديمة معبّاية، بس عدّل اللي بدك.' : 'اختر نوع صفحتك وجاوب على كم سؤال. الحساب بتعمله بالآخر، وإجاباتك بتنحفظ فيه.'}
              </p>
              {!signedIn && (
                <ol className="flex flex-wrap gap-2">
                  {STEPS.map((s, i) => (
                    <li key={s} className="flex items-center gap-2 bg-white/12 backdrop-blur rounded-full pl-3 pr-1 py-1 text-xs font-bold">
                      <span className="w-6 h-6 rounded-full bg-white text-[#1c1a17] flex items-center justify-center text-[11px]">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          {/* The four kinds, as photo cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {KINDS.map((k, i) => (
              <button
                key={k.type}
                type="button"
                disabled={!!loadingType}
                onClick={() => choose(k.type)}
                style={{ animationDelay: `${120 + i * 90}ms` }}
                className="wl-rise group relative rounded-3xl overflow-hidden text-right text-white min-h-[220px] sm:min-h-[340px] flex items-end shadow-sm hover:shadow-[0_24px_50px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition duration-300 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c2410c]"
              >
                <img src={k.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500" style={{ background: `linear-gradient(to top, ${k.accent}cc, transparent 70%)` }} />
                {saved === k.type && (
                  <span className="absolute top-3 right-3 bg-white text-[#c2410c] text-[11px] font-bold rounded-full px-2.5 py-1 shadow">إجاباتك محفوظة</span>
                )}
                <span className="relative p-5 w-full space-y-2">
                  <span className="w-11 h-11 rounded-2xl flex items-center justify-center mb-1 shadow-lg" style={{ backgroundColor: k.accent }}>
                    <k.icon size={20} />
                  </span>
                  <span className="block text-xl font-bold" style={{ fontFamily: HEAD_FONT }}>{k.title}</span>
                  <span className="block text-xs opacity-90 leading-relaxed">{k.line}</span>
                  <span className="hidden sm:grid gap-1 pt-1 max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
                    {k.perks.map((p) => (
                      <span key={p} className="flex items-center gap-1.5 text-[11px] font-bold"><Check size={12} /> {p}</span>
                    ))}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold pt-1">
                    {loadingType === k.type ? <Loader2 size={14} className="animate-spin" /> : null}
                    ابدأ
                    <ArrowLeft size={14} className="transition group-hover:-translate-x-1.5" />
                  </span>
                </span>
              </button>
            ))}
          </section>
        </main>
      ) : (
        <main key="chat" className="max-w-6xl mx-auto px-4 py-4 sm:py-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-6 lg:items-start space-y-3 lg:space-y-0">
          {/* The chosen kind's photo: a banner on a phone, a tall panel beside the questions on a wide screen */}
          <aside className="wl-rise relative rounded-3xl overflow-hidden text-white h-36 lg:h-[calc(100dvh-7rem)] lg:sticky lg:top-20 lg:order-2">
            <img src={chosen.image} alt="" className="wl-drift absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute bottom-0 inset-x-0 p-4 lg:p-7 space-y-2 lg:space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: chosen.accent }}>
                  <chosen.icon size={18} />
                </span>
                <span className="text-xl lg:text-3xl font-bold" style={{ fontFamily: HEAD_FONT }}>{chosen.title}</span>
              </div>
              <p className="hidden lg:block text-sm opacity-90 leading-relaxed max-w-md">{chosen.line}</p>
              <ul className="hidden lg:grid gap-2">
                {chosen.perks.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm font-bold"><span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><Check size={13} /></span>{p}</li>
                ))}
              </ul>
              {/* How far along the questions are */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold opacity-90">
                  <span>{step > QUESTION_COUNT ? 'خلصت الأسئلة' : `السؤال ${step} من ${QUESTION_COUNT}`}</span>
                  <span>{Math.round(progress * 100)}٪</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/25 overflow-hidden">
                  <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${Math.max(4, progress * 100)}%` }} />
                </div>
              </div>
            </div>
          </aside>
          <div className="wl-rise relative h-[calc(100dvh-14rem)] lg:h-[calc(100dvh-7rem)] min-h-[440px] rounded-3xl overflow-hidden border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] lg:order-1" style={{ animationDelay: '120ms' }}>
            <WeeAIChat
              key={chosen.type}
              userId={signedIn ? accountId : WEE_GUEST_ID}
              userEmail={signedIn ? user?.email || "" : ""}
              pageKind={chosen.type}
              embedded
              fromStart
              isCollapsed={false}
              onToggleCollapse={backToKinds}
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
    </div>
  );
};
