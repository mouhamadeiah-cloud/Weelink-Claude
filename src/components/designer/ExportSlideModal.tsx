// «تصدير الشريحة/الصفحة للمعرض»: the designer names the design, picks its kind (required), reads the page's
// law and agrees to it, and the slide goes to the gallery as «بانتظار المراجعة» (Eyad, 14 Oct). The
// law is the text saved in the admin site (services/gallery.ts), never a copy kept here. A slide
// with a phone number, email, link or handle in its texts is refused: contact goes through Weelink.
import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import type { CanvasElement, NavbarConfig } from '../../types';
import { DESIGN_KIND_LABEL, categoriesFor, type DesignKind } from '../../data/slideCategories';
import { exportSlide, readPageLaw, type PageLaw } from '../../services/gallery';
import { CONTACT_KIND_LABEL, findContactInfo, findNavbarContact } from '../../utils/contactCheck';

interface ExportSlideModalProps {
  designerUid: string;
  designerName: string;
  draftSlot: string;
  // A slide, or a page (three slides with a navbar).
  kind: DesignKind;
  // The slide being exported (for a page: its first) and, for a page, the page itself.
  slide: any;
  page?: any;
  navbar?: NavbarConfig;
  // Its elements, in the editor's format (for the contact check) and as they are stored (serialized).
  elements: CanvasElement[];
  storedElements: any[];
  // Why this cannot be exported yet (a page must have exactly three slides), if so.
  problem?: string;
  onClose: () => void;
}

const field = 'w-full h-11 px-3 rounded-ctl border border-line bg-surface text-sm text-ink placeholder:text-faint focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition';

export const ExportSlideModal: React.FC<ExportSlideModalProps> = ({ designerUid, designerName, draftSlot, kind, slide, page, navbar, elements, storedElements, problem, onClose }) => {
  const word = DESIGN_KIND_LABEL[kind];
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [law, setLaw] = useState<PageLaw | null | 'loading'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    readPageLaw()
      .then((l) => alive && setLaw(l))
      .catch(() => alive && setLaw(null));
    return () => {
      alive = false;
    };
  }, []);

  const contact = useMemo(() => [...findContactInfo(elements), ...(kind === 'page' ? findNavbarContact(navbar) : [])], [elements, navbar, kind]);
  const empty = elements.length === 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (law === 'loading' || !law) return;
    if (name.trim().length < 2) return setError('اكتب اسماً للشريحة.');
    if (!category) return setError(kind === 'page' ? 'اختر نوع الصفحة.' : 'اختر تصنيف الشريحة.');
    if (!agreed) return setError('يجب الموافقة على قانون الصفحة قبل التصدير.');
    setBusy(true);
    setError('');
    try {
      await exportSlide({ kind, designerUid, designerName, name, category, draftSlot, slide, page, elements: storedElements, lawVersion: law.version });
      setDone(true);
    } catch (err) {
      console.warn('Could not export the slide:', err);
      setError('تعذّر تصدير الشريحة. تأكد من اتصالك وجرّب مرة ثانية.');
    }
    setBusy(false);
  };

  const blocked = empty || contact.length > 0 || !!problem;

  return (
    <div className="fixed inset-0 z-[4000010] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" dir="rtl" role="dialog" aria-modal="true" aria-label={`تصدير ال${word} للمعرض`} onClick={onClose}>
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-card sm:rounded-card bg-surface border border-line" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-heading font-bold">تصدير ال{word} للمعرض</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-ctl flex items-center justify-center text-muted hover:text-ink hover:bg-bg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-6 space-y-4 text-center">
            <CheckCircle2 size={40} className="mx-auto text-success" />
            <p className="text-body font-bold">وصلت {kind === 'page' ? 'صفحتك' : 'شريحتك'} «{name.trim()}»</p>
            <p className="text-small text-muted leading-relaxed">هي الآن بحالة «بانتظار المراجعة». تظهر في المعرض بعد أن توافق عليها إدارة المنصة.</p>
            <button type="button" onClick={onClose} className="h-11 px-6 rounded-ctl bg-brand hover:bg-brand-hover text-white text-sm font-bold cursor-pointer">تمام</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            {empty && (
              <p role="alert" className="text-small text-danger font-bold flex items-start gap-1.5"><AlertCircle size={15} className="shrink-0 mt-1" /> {kind === 'page' ? 'الصفحة فارغة' : 'الشريحة فارغة'}. صمّم شيئاً فيها أولاً.</p>
            )}
            {problem && (
              <p role="alert" className="text-small text-danger font-bold flex items-start gap-1.5"><AlertCircle size={15} className="shrink-0 mt-1" /> {problem}</p>
            )}
            {contact.length > 0 && (
              <div role="alert" className="rounded-ctl border border-danger/30 bg-danger/5 p-3 space-y-1.5">
                <p className="text-small text-danger font-bold flex items-start gap-1.5"><AlertCircle size={15} className="shrink-0 mt-1" /> ال{word} فيها بيانات تواصل، وهي ممنوعة في المعرض. التواصل يتم عبر Weelink بعد الدفع.</p>
                <ul className="text-tiny text-danger list-disc pr-5 space-y-0.5">
                  {contact.map((c, i) => <li key={i}>{CONTACT_KIND_LABEL[c.kind]} في «{c.elementName}»</li>)}
                </ul>
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-muted">اسم {kind === 'page' ? 'الصفحة' : 'الشريحة'}</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={kind === 'page' ? 'مثال: صفحة عيادة أسنان' : 'مثال: واجهة عيادة بالأزرق'} className={field} />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-muted">{kind === 'page' ? 'نوع الصفحة (إجباري)' : 'التصنيف (إجباري)'}</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
                <option value="">{kind === 'page' ? 'اختر نوع الصفحة…' : 'اختر نوع الشريحة…'}</option>
                {categoriesFor(kind).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-muted">قانون الصفحة ومسؤوليتك عن التصميم</span>
              {law === 'loading' ? (
                <div className="h-40 rounded-ctl border border-line flex items-center justify-center text-muted"><Loader2 size={18} className="animate-spin" /></div>
              ) : law ? (
                <div className="h-56 overflow-y-auto rounded-ctl border border-line bg-bg p-3 text-small leading-relaxed whitespace-pre-wrap select-text">{law.text}</div>
              ) : (
                <p role="alert" className="text-small text-danger font-bold">قانون الصفحة غير منشور بعد، فلا يمكن التصدير الآن. حاول لاحقاً.</p>
              )}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={!law || law === 'loading'} className="mt-1 w-4 h-4 accent-[var(--color-brand)] shrink-0" />
              <span className="text-small leading-relaxed">قرأت قانون الصفحة وأوافق عليه، وأتحمل المسؤولية الكاملة عن هذا التصميم.</span>
            </label>

            {error && <p role="alert" className="text-small text-danger font-bold flex items-start gap-1.5"><AlertCircle size={15} className="shrink-0 mt-1" /> {error}</p>}

            <button type="submit" disabled={busy || blocked || !law || law === 'loading'} className="w-full h-12 rounded-ctl bg-brand hover:bg-brand-hover text-white text-sm font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {busy && <Loader2 size={16} className="animate-spin" />}
              {busy ? 'جاري التصدير...' : 'تصدير للمعرض'}
            </button>
            <p className="text-tiny text-faint text-center">بعد التصدير تبقى ال{word} «بانتظار المراجعة» حتى توافق عليها إدارة المنصة.</p>
          </form>
        )}
      </div>
    </div>
  );
};
