// The strip over the editor while a design of the gallery is being edited (Eyad, 15 Oct): the admin edits any design in
// place; a designer edits one of their own, and a change to an approved design goes to review before it replaces it.
import React from 'react';
import { Loader2, Save, X } from 'lucide-react';

interface Props {
  as: 'admin' | 'designer';
  name: string;
  kind: 'slide' | 'page';
  // The design's status in the gallery.
  status: string;
  // The designer already sent a change that waits for review (this is it).
  pendingEdit: boolean;
  saving: boolean;
  savedNote: string;
  onSave: () => void;
  onLeave: () => void;
  // A ready slide of the admin's own list: its name and category are edited here, and the AI slot of the selected element.
  ready?: {
    category: string;
    categories: { id: string; name: string }[];
    onName: (name: string) => void;
    onCategory: (category: string) => void;
    slot: { type: string; value: string; auto: boolean; onChange: (value: string) => void } | null;
  };
}

// The slot names the page builder knows for each kind of element (src/data/aiSlots.ts).
const SLOT_SUGGESTIONS: Record<string, string[]> = {
  text: ['title', 'eyebrow', 'sub', 'text', 'note', 'quote', 'owner', 'role', 'ticker', 'points.0.title', 'points.0.text', 'points.1.title', 'points.1.text', 'points.2.title', 'points.2.text', 'facts.0.number', 'facts.0.label', 'facts.1.number', 'facts.1.label', 'chips.0', 'chips.1', 'items.0.name', 'items.0.price', 'items.0.desc', 'caption.0', 'phone.value', 'phone.label', 'whatsapp.value', 'whatsapp.label', 'address.value', 'address.label', 'hours.value', 'hours.label'],
  button: ['cta', 'whatsapp', 'phone'],
  image: ['image', 'avatar', 'photos.0', 'photos.1', 'photos.2'],
  map: ['map'],
  contactForm: ['form'],
  gallery: ['gallery'],
};
const slotTypes = (type: string) => (type === 'heading' || type === 'paragraph' || type === 'badge' ? 'text' : type);

export const GalleryEditBar: React.FC<Props> = ({ as, name, kind, status, pendingEdit, saving, savedNote, onSave, onLeave, ready }) => {
  const word = kind === 'page' ? 'الصفحة' : 'الشريحة';
  const note = as === 'admin'
    ? `تعدّل ${word} مباشرة بصفتك الإدارة. «حفظ» يحفظ التعديل في المعرض كما هو (حالتها: ${status === 'approved' ? 'منشورة' : status === 'rejected' ? 'مرفوضة' : 'بانتظار المراجعة'})، والنشر بزر «قبول ونشر» في الإدارة.`
    : status === 'approved'
      ? `${word} منشورة في المعرض. «حفظ وإعادة النشر» يرسل تعديلك للمراجعة، وتبقى النسخة المنشورة كما هي حتى تقبله الإدارة.${pendingEdit ? ' هذه آخر نسخة أرسلتها.' : ''}`
      : `«حفظ وإعادة النشر» يحفظ التعديل ويعيد ${word} إلى «بانتظار المراجعة».`;
  return (
    <div dir="rtl" className="w-full bg-warn/10 border-b border-warn/30 px-4 lg:px-6 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 z-30 text-xs">
      {ready ? (
        <>
          <span className="font-bold text-warn shrink-0">شريحة جاهزة · الإدارة</span>
          <input value={name} onChange={(e) => ready.onName(e.target.value)} maxLength={60} placeholder="اسم الشريحة" className="h-8 w-40 rounded-ctl border border-line bg-surface px-2 text-ink" />
          <select value={ready.category} onChange={(e) => ready.onCategory(e.target.value)} className="h-8 rounded-ctl border border-line bg-surface px-2 text-ink">
            {ready.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex min-w-0 flex-1 items-center gap-2 text-muted" title="الخانة التي يكتبها الذكاء الاصطناعي في العنصر المحدد. تُعرف تلقائياً عند الحفظ، وما تكتبه هنا يبقى كما هو.">
            <span className="shrink-0">خانة العنصر المحدد</span>
            {ready.slot && SLOT_SUGGESTIONS[slotTypes(ready.slot.type)] ? (
              <>
                <input list="ready-slot-names" value={ready.slot.value} onChange={(e) => ready.slot!.onChange(e.target.value.trim())} placeholder={ready.slot.auto ? 'تلقائية' : 'بلا خانة'} dir="ltr" className="h-8 w-40 rounded-ctl border border-line bg-surface px-2 text-ink" />
                <datalist id="ready-slot-names">{SLOT_SUGGESTIONS[slotTypes(ready.slot.type)].map((n) => <option key={n} value={n} />)}</datalist>
                {ready.slot.auto && <span className="shrink-0 text-tiny">وُجدت تلقائياً</span>}
              </>
            ) : <span className="text-tiny">حدّد نصاً أو زراً أو صورة</span>}
          </label>
        </>
      ) : (
        <>
          <span className="font-bold text-warn shrink-0">تعديل «{name}» · {as === 'admin' ? 'الإدارة' : 'مصمم'}</span>
          <span className="text-muted min-w-0 flex-1 truncate" title={note}>{note}</span>
        </>
      )}
      {savedNote && <span className="font-bold text-success">{savedNote}</span>}
      <button type="button" disabled={saving} onClick={onSave} className="h-8 px-3 rounded-ctl bg-brand text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {ready ? 'حفظ في الجاهزة' : as === 'admin' ? 'حفظ' : 'حفظ وإعادة النشر'}
      </button>
      <button type="button" onClick={onLeave} className="h-8 px-3 rounded-ctl border border-line bg-surface text-ink font-bold inline-flex items-center gap-1.5 cursor-pointer"><X size={14} /> {as === 'admin' ? 'إغلاق' : 'العودة لمسوداتي'}</button>
    </div>
  );
};
