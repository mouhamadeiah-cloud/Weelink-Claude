// «اطلب هذا المصمم»: the customer asks a gallery designer to design their page (Eyad, 14 Oct). The price is
// the one for the package of the customer's page (the server works it out); the customer pays the Weelink
// office, which holds the money until the design is confirmed, and talking to the designer opens once the
// office has the money. The brief carries no contact details: nothing takes the two outside Weelink.
import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { AlertCircle, Loader2, ShieldCheck, X } from 'lucide-react';
import { createOrder, orderErrorText, quoteOrder } from '../../services/designOrders';
import { contactKindsIn, CONTACT_KIND_LABEL } from '../../utils/contactCheck';
import { formatPounds } from '../../data/plans';

interface HireDialogProps {
  user: User;
  designerUid: string;
  designerName: string;
  // The gallery design the customer saw, if they came from one.
  slideId?: string;
  slideName?: string;
  onClose: () => void;
  onCreated: (orderId: string) => void;
}

export const HireDialog: React.FC<HireDialogProps> = ({ user, designerUid, designerName, slideId = '', slideName = '', onClose, onCreated }) => {
  const [price, setPrice] = useState<number | null>(null);
  const [brief, setBrief] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    quoteOrder(user)
      .then((q) => alive && setPrice(q.price))
      .catch((e) => alive && setError(orderErrorText(e)));
    return () => {
      alive = false;
    };
  }, [user]);

  const contact = contactKindsIn(brief);
  const ready = brief.trim().length >= 10 && contact.length === 0 && price !== null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      const { id } = await createOrder(user, designerUid, slideId, brief.trim());
      onCreated(id);
    } catch (err) {
      setError(orderErrorText(err));
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" dir="rtl" role="dialog" aria-modal="true" aria-label="اطلب مصمماً" onClick={onClose}>
      <form onSubmit={submit} className="w-full sm:max-w-lg max-h-[94vh] overflow-y-auto rounded-t-card sm:rounded-card bg-surface border border-line" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-heading font-bold">اطلب {designerName || 'المصمم'} لصفحتك</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-ctl flex items-center justify-center text-muted hover:text-ink hover:bg-bg cursor-pointer"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {slideName && <p className="text-sm text-muted">أعجبك تصميمه «{slideName}». اطلب منه تصميماً بهذا الأسلوب لصفحتك.</p>}
          <div className="rounded-card bg-bg border border-line p-4 flex items-center justify-between gap-3">
            <span className="text-sm text-muted">سعر التصميم حسب باقة صفحتك</span>
            <span className="text-heading font-bold tabular-nums">{price === null ? <Loader2 size={18} className="animate-spin text-faint" /> : formatPounds(price)}</span>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-muted">ماذا تريد منه؟</span>
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={5} maxLength={1000} placeholder="شو نوع عملك، وشو بدك بالصفحة، وأي ألوان أو أفكار عندك…" className="w-full rounded-ctl border border-line bg-surface p-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </label>
          {contact.length > 0 && (
            <p role="alert" className="text-sm font-bold text-danger flex items-start gap-1.5"><AlertCircle size={15} className="shrink-0 mt-0.5" /> ممنوع كتابة {contact.map((k) => CONTACT_KIND_LABEL[k]).join(' أو ')} هنا. التواصل مع المصمم يتم داخل Weelink بعد الدفع.</p>
          )}
          <div className="flex items-start gap-2.5 text-xs text-muted leading-relaxed">
            <ShieldCheck size={16} className="shrink-0 text-success mt-0.5" />
            <span>تدفع المبلغ لمكتب Weelink ويبقى عنده معلّقاً. بعد أن يؤكّد المكتب استلامه يُفتح التواصل مع المصمم هنا، ولا يصل المبلغ للمصمم إلا بعد أن تستلم التصميم وتؤكّد.</span>
          </div>
          {error && <p role="alert" className="text-sm font-bold text-danger flex items-start gap-1.5"><AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}</p>}
          <button type="submit" disabled={!ready || busy} className="w-full h-12 rounded-ctl bg-brand hover:bg-brand-hover text-white text-sm font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />} {busy ? 'جاري إنشاء الطلب...' : 'أنشئ الطلب'}
          </button>
        </div>
      </form>
    </div>
  );
};
