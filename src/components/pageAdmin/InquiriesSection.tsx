// The messages visitors sent from the page's «نموذج تواصل», in its admin: the unread ones first.
import React, { useEffect, useState } from 'react';
import { Check, Loader2, Mail, MessageSquare, Phone, Trash2 } from 'lucide-react';
import { Inquiry, deleteInquiry, markInquiryRead, watchInquiries } from '../../services/contact';
import type { ProjectKey } from '../../utils/projectKeys';

const when = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('ar-SY', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

interface InquiriesSectionProps {
  owner: string;
  project: ProjectKey;
  watch?: typeof watchInquiries;
}

export const InquiriesSection: React.FC<InquiriesSectionProps> = ({ owner, project, watch = watchInquiries }) => {
  const [rows, setRows] = useState<Inquiry[] | null | 'error'>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setRows(null);
    return watch(owner, project, setRows, () => setRows('error'));
  }, [owner, project]);

  const list = Array.isArray(rows) ? rows : [];
  const unread = list.filter((r) => !r.read).length;
  const run = (job: Promise<unknown>) => job.then(() => setFailed(false), () => setFailed(true));

  return (
    <section className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
        <MessageSquare size={15} /> الرسائل
        {unread > 0 && <span className="px-2 py-0.5 rounded-full bg-brand text-white text-[11px]">{unread.toLocaleString('ar-SY')} جديدة</span>}
      </div>
      {rows === null ? (
        <Loader2 size={20} className="animate-spin text-neutral-400" />
      ) : rows === 'error' ? (
        <div className="text-xs text-neutral-500">ما قدرنا نقرأ الرسائل هلق. جرّب بعد شوي.</div>
      ) : list.length === 0 ? (
        <div className="text-xs text-neutral-500 leading-relaxed">ما وصلتك رسائل بعد. أضف «نموذج تواصل» من «إضافة» وبتوصلك رسائل زوارك هون وعالإيميل.</div>
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.id} className={`rounded-xl border p-3 space-y-1.5 ${r.read ? 'border-neutral-200 bg-white' : 'border-brand/30 bg-blue-50/40'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-ink">{r.name}</span>
                {r.kind === 'order' && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">طلب</span>}
                {r.kind === 'car' && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">طلب سيارة</span>}
                <span className="text-xs text-neutral-400 flex-1">{when(r.createdAt)}</span>
                {!r.read && (
                  <button type="button" onClick={() => run(markInquiryRead(owner, r.id))} className="h-8 px-2.5 rounded-lg bg-white border border-neutral-200 text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <Check size={13} /> تمت القراءة
                  </button>
                )}
                <button
                  type="button"
                  aria-label="حذف الرسالة"
                  onClick={() => window.confirm(`حذف رسالة ${r.name}؟`) && run(deleteInquiry(owner, r.id))}
                  className="w-8 h-8 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{r.message}</p>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <a href={`tel:${r.phone}`} className="px-2.5 py-1 rounded-lg bg-bg flex items-center gap-1" dir="ltr"><Phone size={12} /> {r.phone}</a>
                {r.email && <a href={`mailto:${r.email}`} className="px-2.5 py-1 rounded-lg bg-bg flex items-center gap-1" dir="ltr"><Mail size={12} /> {r.email}</a>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {failed && <div className="text-xs text-red-600 font-bold">ما انحفظ التغيير. جرّب مرة ثانية.</div>}
    </section>
  );
};
