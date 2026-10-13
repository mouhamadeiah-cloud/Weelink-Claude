// «ستايل الصفحة»: the 12 page looks as the specimen cards Eyad approved, each drawn in its own
// fonts and colours but filled with the owner's own name, first heading, first text and first price.
// The looks that suit the kind of page come first; the one the site has now is marked.

import React from 'react';
import { Check, Undo2 } from 'lucide-react';
import { looksFor, suitsKind, type PageLook } from '../../data/pageLooks';
import type { BuildKind } from '../../services/pageBuilder';
import { buttonText } from '../../services/applyLook';

export interface LookSample {
  name: string; // the site's name
  title: string; // first heading
  text: string; // first paragraph
  button: string; // first button
  item?: { name: string; price: string }; // first dish, product, car or price
}

const headSize = (look: PageLook) => (look.head === 'Amiri' || look.head === 'Aref Ruqaa' ? 25 : look.head === 'Lemonada' || look.head === 'Noto Kufi Arabic' ? 19 : 21);

const LookCard: React.FC<{ look: PageLook; sample: LookSample; current: boolean; suits: boolean; onPick: () => void }> = ({ look, sample, current, suits, onPick }) => {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={current}
      className={`w-full text-right rounded-card overflow-hidden border bg-surface transition-shadow cursor-pointer ${current ? 'border-brand ring-2 ring-brand/30' : 'border-line hover:shadow-md'}`}
    >
      <div dir="rtl" className="p-4 flex flex-col gap-2" style={{ backgroundColor: look.bg, color: look.ink, fontFamily: `'${look.body}', sans-serif` }}>
        <span className="text-xs font-bold truncate" style={{ color: look.price }}>{sample.name}</span>
        <span className="leading-snug line-clamp-2" style={{ fontFamily: `'${look.head}', serif`, fontWeight: look.headWeight, fontSize: headSize(look), textWrap: 'balance' } as React.CSSProperties}>
          {sample.title}
        </span>
        <span className="text-sm leading-relaxed line-clamp-2" style={{ color: look.muted }}>{sample.text}</span>
        <span className="flex items-center gap-2.5 flex-wrap mt-0.5">
          <span className="text-sm font-bold px-4 py-1.5" style={{ backgroundColor: look.accent, color: buttonText(look), borderRadius: look.radius }}>{sample.button}</span>
          <span className="text-xs tracking-wider" style={{ color: look.price }}>★★★★★</span>
        </span>
        {sample.item && (
          <span className="mt-1 px-3 py-2 flex items-center justify-between gap-2 border" style={{ backgroundColor: look.card === look.bg ? look.soft : look.card, borderColor: look.line, borderRadius: look.radius > 100 ? 16 : look.radius }}>
            <span className="text-sm font-bold truncate">{sample.item.name}</span>
            <span className="text-sm font-bold whitespace-nowrap" style={{ color: look.price }}>{sample.item.price}</span>
          </span>
        )}
      </div>
      <div className="px-4 py-3 flex flex-col gap-1.5 border-t border-line">
        <span className="flex items-center justify-between gap-2">
          <span className="text-base font-bold text-ink">{look.name}</span>
          {current ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand"><Check size={14} />ستايل صفحتك</span>
          ) : suits ? (
            <span className="text-xs font-bold text-brand bg-brand/10 rounded-full px-2.5 py-0.5">بيناسب صفحتك</span>
          ) : null}
        </span>
        <span className="text-xs text-muted">{look.head === look.body ? `${look.head} للعناوين والنصوص` : `${look.head} للعناوين، ${look.body} للنصوص`}</span>
        <span className="text-xs text-ink">{look.forWho}</span>
      </div>
    </button>
  );
};

export const PageLookPicker: React.FC<{
  kind: BuildKind;
  current?: string;
  sample: LookSample;
  onPick: (look: PageLook) => void;
  onUndo?: () => void; // brings back the site as it was before the last pick
}> = ({ kind, current, sample, onPick, onUndo }) => (
  <div className="flex flex-col gap-3">
    <p className="text-xs text-muted leading-relaxed">كل ستايل فيه خطّين وألوانه، وبيتطبّق على كل صفحات موقعك سوا. الألوان والخطوط اللي غيّرتها بإيدك بتضل متل ما هي.</p>
    {onUndo && (
      <button type="button" onClick={onUndo} className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-hover cursor-pointer">
        <Undo2 size={14} />
        رجّع الستايل اللي قبل
      </button>
    )}
    {looksFor(kind).map((look) => (
      <LookCard key={look.id} look={look} sample={sample} current={current === look.id} suits={suitsKind(look, kind)} onPick={() => onPick(look)} />
    ))}
  </div>
);
