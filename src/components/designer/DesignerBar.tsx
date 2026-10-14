// The strip under the top bar in «وضع المصمم»: the designer's drafts (up to ten, one slide each) and
// the note on Wee AI, which needs tokens that cannot be bought yet (Eyad, 14 Oct). Hand design is
// always open.
import React from 'react';
import { Coins, Plus, Sparkles, Trash2 } from 'lucide-react';
import { MAX_DRAFTS, type DraftMeta } from '../../services/designerDrafts';

interface DesignerBarProps {
  drafts: DraftMeta[];
  activeSlot: string;
  busy: boolean;
  onOpen: (slot: string) => void;
  onNew: () => void;
  onDelete: (slot: string) => void;
}

export const DesignerBar: React.FC<DesignerBarProps> = ({ drafts, activeSlot, busy, onOpen, onNew, onDelete }) => {
  const full = drafts.length >= MAX_DRAFTS;
  return (
    <div dir="rtl" className="w-full bg-brand/5 border-b border-brand/15 px-4 lg:px-6 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 z-30">
      <span className="text-xs font-bold text-brand shrink-0">وضع المصمم</span>

      <div className="flex items-center gap-1.5 overflow-x-auto min-w-0 flex-1" role="tablist" aria-label="مسوداتك">
        {drafts.map((d, i) => (
          <span key={d.slot} className={`shrink-0 inline-flex items-center rounded-ctl border text-xs font-bold ${d.slot === activeSlot ? 'bg-brand text-white border-brand' : 'bg-surface text-ink border-line hover:border-brand/40'}`}>
            <button type="button" role="tab" aria-selected={d.slot === activeSlot} disabled={busy} onClick={() => onOpen(d.slot)} className="h-8 pl-2 pr-3 cursor-pointer disabled:cursor-wait">
              {d.name || `مسودة ${i + 1}`}
            </button>
            {drafts.length > 1 && (
              <button type="button" disabled={busy} onClick={() => onDelete(d.slot)} aria-label={`حذف ${d.name || `مسودة ${i + 1}`}`} title="حذف المسودة" className={`h-8 w-7 flex items-center justify-center cursor-pointer ${d.slot === activeSlot ? 'text-white/80 hover:text-white' : 'text-faint hover:text-danger'}`}>
                <Trash2 size={13} />
              </button>
            )}
          </span>
        ))}
        <button type="button" disabled={busy || full} onClick={onNew} title={full ? `الحد الأقصى ${MAX_DRAFTS} مسودات` : 'مسودة جديدة'} className="shrink-0 h-8 px-3 rounded-ctl border border-dashed border-brand/40 text-brand text-xs font-bold inline-flex items-center gap-1 hover:bg-brand/5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
          <Plus size={14} /> مسودة جديدة
        </button>
        <span className="shrink-0 text-xs text-muted tabular-nums">{drafts.length}/{MAX_DRAFTS}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0 text-xs text-muted">
        <span className="inline-flex items-center gap-1"><Sparkles size={13} /> Wee AI يحتاج رصيد توكنز</span>
        <button type="button" disabled title="شراء التوكنز غير متاح حالياً" className="h-8 px-3 rounded-ctl border border-line bg-surface text-faint text-xs font-bold inline-flex items-center gap-1 cursor-not-allowed">
          <Coins size={13} /> شراء توكنز · قريباً
        </button>
      </div>
    </div>
  );
};
