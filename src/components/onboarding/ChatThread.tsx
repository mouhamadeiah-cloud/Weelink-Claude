// The pieces of Wee AI's question thread: it reads like a chat (Eyad, 28 Oct) — Wee AI's question with its explanation, the form to answer
// right beneath it, and once answered the answer as the owner's own bubble, which can be opened again to change it.
import React from 'react';
import { Pencil } from 'lucide-react';
import { WeeDots } from '../ui/WeeDots';

// The question being asked is typed out letter by letter (the old header did so); a question already answered shows whole.
const useTyped = (text: string, on: boolean): string => {
  const [n, setN] = React.useState(on ? 0 : text.length);
  React.useEffect(() => {
    if (!on) { setN(text.length); return; }
    setN(0);
    let i = 0;
    const t = setInterval(() => { i += 1; setN(i); if (i >= text.length) clearInterval(t); }, 18);
    return () => clearInterval(t);
  }, [text, on]);
  return text.slice(0, n);
};

/** Wee AI's side: the question. The one being asked is a big card of its own, typed out, with the answer box separate beneath it; the
 *  explanation and the picture are in the panel beside the chat (ExplainPanel). */
export const AiBubble: React.FC<{ title: string; live?: boolean; children?: React.ReactNode }> = ({ title, live, children }) => {
  const shown = useTyped(title, !!live);
  return (
    <div className="flex items-start gap-2 animate-in fade-in">
      <div className={`${live ? 'w-9 h-9' : 'w-7 h-7'} rounded-full bg-brand/5 flex items-center justify-center shrink-0 mt-0.5`}><WeeDots size={live ? 24 : 18} /></div>
      <div className="min-w-0 flex-1 space-y-2.5">
        {live ? (
          <div className="rounded-2xl rounded-tr-sm border border-brand/25 bg-white shadow-md px-4 py-3.5">
            <p className="text-[11px] font-black text-brand tracking-wide mb-1">Wee AI</p>
            <p className="text-base font-black text-neutral-900 leading-relaxed min-h-[1.6em]" aria-label={title}>{shown}</p>
          </div>
        ) : (
          <div className="rounded-2xl rounded-tr-sm bg-[#f5f5f7] px-3 py-2.5">
            <p className="text-xs font-bold text-neutral-700 leading-relaxed">{title}</p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

/** The owner's side: his answer in short, and the way back to change it. */
export const UserBubble: React.FC<{ text: string; onEdit?: () => void }> = ({ text, onEdit }) => (
  <div className="flex justify-end">
    <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-brand text-white px-3 py-2 space-y-1">
      <p className="text-xs font-semibold leading-relaxed whitespace-pre-line break-words">{text}</p>
      {onEdit && (
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-[11px] font-bold text-white/80 hover:text-white cursor-pointer">
          <Pencil size={11} /> تعديل
        </button>
      )}
    </div>
  </div>
);

/** The form under an open question, set apart from the bubbles. */
export const AnswerBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-3">{children}</div>
);

/** The line shown in place of an answer he skipped. */
export const SKIPPED_TEXT = 'تخطّيت هذا السؤال، اكتبه أنت يا Wee AI';
