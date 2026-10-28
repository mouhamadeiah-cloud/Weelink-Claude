// The pieces of Wee AI's question thread: it reads like a chat (Eyad, 28 Oct) — Wee AI's question with its explanation, the form to answer
// right beneath it, and once answered the answer as the owner's own bubble, which can be opened again to change it.
import React from 'react';
import { Pencil } from 'lucide-react';
import { WeeDots } from '../ui/WeeDots';

/** Wee AI's side: the question, then what it is for (the explanation) and the notes under it. */
export const AiBubble: React.FC<{ title: string; explain?: string; note?: string; preview?: React.ReactNode; children?: React.ReactNode }> = ({ title, explain, note, preview, children }) => (
  <div className="flex items-start gap-2 animate-in fade-in">
    <div className="w-7 h-7 rounded-full bg-brand/5 flex items-center justify-center shrink-0 mt-0.5"><WeeDots size={18} /></div>
    <div className="min-w-0 flex-1 space-y-2">
      <div className="rounded-2xl rounded-tr-sm bg-[#f5f5f7] px-3 py-2.5 space-y-1.5">
        <p className="text-xs font-bold text-neutral-900 leading-relaxed">{title}</p>
        {explain && <p className="text-[11.5px] font-semibold text-neutral-600 leading-relaxed">{explain}</p>}
        {preview}
        {note && <p className="text-[11px] font-bold text-brand leading-relaxed">تنويه: {note}</p>}
      </div>
      {children}
    </div>
  </div>
);

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
