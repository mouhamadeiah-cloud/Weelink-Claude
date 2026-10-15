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
}

export const GalleryEditBar: React.FC<Props> = ({ as, name, kind, status, pendingEdit, saving, savedNote, onSave, onLeave }) => {
  const word = kind === 'page' ? 'الصفحة' : 'الشريحة';
  const note = as === 'admin'
    ? `تعدّل ${word} مباشرة بصفتك الإدارة. «حفظ» يحفظ التعديل في المعرض كما هو (حالتها: ${status === 'approved' ? 'منشورة' : status === 'rejected' ? 'مرفوضة' : 'بانتظار المراجعة'})، والنشر بزر «قبول ونشر» في الإدارة.`
    : status === 'approved'
      ? `${word} منشورة في المعرض. «حفظ وإعادة النشر» يرسل تعديلك للمراجعة، وتبقى النسخة المنشورة كما هي حتى تقبله الإدارة.${pendingEdit ? ' هذه آخر نسخة أرسلتها.' : ''}`
      : `«حفظ وإعادة النشر» يحفظ التعديل ويعيد ${word} إلى «بانتظار المراجعة».`;
  return (
    <div dir="rtl" className="w-full bg-warn/10 border-b border-warn/30 px-4 lg:px-6 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 z-30 text-xs">
      <span className="font-bold text-warn shrink-0">تعديل «{name}» · {as === 'admin' ? 'الإدارة' : 'مصمم'}</span>
      <span className="text-muted min-w-0 flex-1 truncate" title={note}>{note}</span>
      {savedNote && <span className="font-bold text-success">{savedNote}</span>}
      <button type="button" disabled={saving} onClick={onSave} className="h-8 px-3 rounded-ctl bg-brand text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {as === 'admin' ? 'حفظ' : 'حفظ وإعادة النشر'}
      </button>
      <button type="button" onClick={onLeave} className="h-8 px-3 rounded-ctl border border-line bg-surface text-ink font-bold inline-flex items-center gap-1.5 cursor-pointer"><X size={14} /> {as === 'admin' ? 'إغلاق' : 'العودة لمسوداتي'}</button>
    </div>
  );
};
