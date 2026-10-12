// «اعمل صفحتك»: the visitor picks the kind of page first, then answers Wee AI's questions without an
// account. Signing up comes at the end, and the answers move to the new account
// (services/guestAnswers.ts). A signed-in owner skips the questions here: the kind opens straight
// in the editor, where Wee AI waits in the panel.
import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { ArrowLeft, CarFront, FileText, Loader2, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { WeeAIChat, WEE_GUEST_ID } from '../WeeAIChat';
import { guestKindOf, readGuestAnswers, setGuestKind } from '../../services/guestAnswers';
import type { ProjectType } from '../shop/shopTypes';

const HEAD_FONT = "'Readex Pro', 'IBM Plex Sans Arabic', sans-serif";

const KINDS: { type: ProjectType; title: string; line: string; icon: React.ElementType; accent: string }[] = [
  { type: 'page', title: 'صفحة لعملك', line: 'طبيب، محامي، كهربائي، مدرّس… صفحة تعرّف بك وبخدماتك.', icon: FileText, accent: '#0071e3' },
  { type: 'shop', title: 'متجر أونلاين', line: 'منتجاتك بأقسام ومستودع وطلبات وتوصيل.', icon: ShoppingBag, accent: '#1d1d1f' },
  { type: 'restaurant', title: 'مطعم', line: 'منيو وطلب أونلاين وكاشير ومطبخ.', icon: UtensilsCrossed, accent: '#c2410c' },
  { type: 'cars', title: 'معرض سيارات', line: 'سياراتك بالصور والمواصفات والأسعار.', icon: CarFront, accent: '#C8102E' },
];

interface StartPageProps {
  user: User | null;
  onHome: () => void;
  // A signed-in owner picked a kind: open it.
  onOpen: (kind: ProjectType) => void;
  // A guest finished the questions: sign up, then open this kind.
  onSignUp: (kind: ProjectType) => void;
  loadingType?: ProjectType | null;
}

export const StartPage: React.FC<StartPageProps> = ({ user, onHome, onOpen, onSignUp, loadingType }) => {
  const signedIn = !!user && !user.isAnonymous;
  const [kind, setKind] = useState<ProjectType | null>(null);
  const saved = signedIn ? null : guestKindOf(readGuestAnswers());

  const choose = (type: ProjectType) => {
    if (signedIn) return onOpen(type);
    setGuestKind(type);
    setKind(type);
  };

  const chosen = KINDS.find((k) => k.type === kind);

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-[#1c1a17]" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Readex Pro', sans-serif" }}>
      <header className="sticky top-0 z-30 bg-[#f6f3ee]/90 backdrop-blur border-b border-black/5">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button type="button" onClick={kind ? () => setKind(null) : onHome} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5b5348] hover:text-[#c2410c]">
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
        <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: HEAD_FONT }}>شو بدك تعمل؟</h1>
            <p className="text-sm text-[#5b5348] leading-relaxed">
              {signedIn
                ? 'اختر نوع الصفحة لتفتحها في المحرر.'
                : 'اختر نوع صفحتك، وجاوب على أسئلة Wee AI. الحساب بتعمله بالآخر، وإجاباتك بتنحفظ فيه.'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {KINDS.map((k) => (
              <button
                key={k.type}
                type="button"
                disabled={!!loadingType}
                onClick={() => choose(k.type)}
                className="group text-right bg-white rounded-3xl border border-black/10 p-5 flex items-start gap-4 hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)] hover:border-transparent transition disabled:cursor-wait"
              >
                <span className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0" style={{ backgroundColor: k.accent }}>
                  <k.icon size={22} />
                </span>
                <span className="flex-1 min-w-0 space-y-1">
                  <span className="block text-base font-bold" style={{ fontFamily: HEAD_FONT }}>{k.title}</span>
                  <span className="block text-xs text-[#5b5348] leading-relaxed">{k.line}</span>
                  {saved === k.type && <span className="inline-block text-[11px] font-bold text-[#c2410c]">كمّل من حيث وقفت</span>}
                </span>
                {loadingType === k.type ? (
                  <Loader2 size={18} className="animate-spin text-neutral-400 mt-1" />
                ) : (
                  <ArrowLeft size={18} className="text-neutral-300 group-hover:text-[#c2410c] group-hover:-translate-x-1 transition mt-1" />
                )}
              </button>
            ))}
          </div>
        </main>
      ) : (
        <main className="max-w-xl mx-auto px-4 py-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold" style={{ fontFamily: HEAD_FONT }}>
            <span className="w-7 h-7 rounded-xl text-white flex items-center justify-center" style={{ backgroundColor: chosen.accent }}>
              <chosen.icon size={15} />
            </span>
            {chosen.title}
          </div>
          <div className="relative h-[calc(100dvh-8.5rem)] min-h-[460px] rounded-3xl overflow-hidden border border-black/10 bg-white shadow-sm">
            <WeeAIChat
              key={chosen.type}
              userId={WEE_GUEST_ID}
              userEmail=""
              pageKind={chosen.type}
              embedded
              isCollapsed={false}
              onToggleCollapse={() => setKind(null)}
              onCompleteChat={() => onSignUp(chosen.type)}
            />
          </div>
        </main>
      )}
    </div>
  );
};
