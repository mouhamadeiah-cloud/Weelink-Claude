// «مراجعة الشرائح»: the slides designers exported to the gallery wait here as «بانتظار المراجعة»
// until the platform approves or rejects them. A rejection needs a reason. The preview is the live
// slide, drawn the way the gallery will draw it (videos and motion play). Only an approved slide ever appears in the gallery.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, ShieldCheck, X } from 'lucide-react';
import { AdminError, GallerySlideRow, SlideStatus, adminSlideReview, adminSlides } from '../../services/adminApi';
import { categoryLabel } from '../../data/slideCategories';
import { LivePage, LiveSlide } from '../gallery/LiveSlide';
import { deserializeElements } from '../../utils/elementStorage';
import { findContactInfo, findNavbarContact, CONTACT_KIND_LABEL } from '../../utils/contactCheck';

const TABS: [SlideStatus, string][] = [['pending', 'بانتظار المراجعة'], ['approved', 'مقبولة'], ['rejected', 'مرفوضة']];
const date = (ms: number) => (ms ? new Date(ms).toLocaleString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const SlideCard: React.FC<{ row: GallerySlideRow; onChanged: () => void; onSessionEnd: () => void }> = ({ row, onChanged, onSessionEnd }) => {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  // A second look at the texts, the same check the designer's export runs.
  const elements = useMemo(() => deserializeElements(row.elements), [row.elements]);
  const contact = [...findContactInfo(elements), ...(row.kind === 'page' ? findNavbarContact(row.page?.navbar) : [])];

  const review = async (decision: 'approve' | 'reject') => {
    setBusy(true);
    setError('');
    try {
      await adminSlideReview(row.id, decision, reason);
      onChanged();
    } catch (e) {
      const code = (e as AdminError)?.code;
      if (code === 'session') return onSessionEnd();
      setError(code === 'reason' ? 'اكتب سبب الرفض (3 أحرف على الأقل).' : code === 'bad-category' ? 'تصنيف الشريحة غير معروف.' : 'تعذّر الحفظ. جرّب مرة ثانية.');
    }
    setBusy(false);
  };

  return (
    <article className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="overflow-hidden rounded-ctl border border-line">{row.kind === 'page' && row.page ? <LivePage page={row.page} elements={elements} maxHeight={420} /> : <LiveSlide slide={row.slide} elements={elements} />}</div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-small">
        <dt className="text-muted">المصمم</dt><dd>{row.designerName || '—'} <span className="text-tiny text-faint" dir="ltr">{row.designerUid.slice(0, 8)}</span></dd>
        <dt className="text-muted">النوع</dt><dd>{row.kind === 'page' ? 'صفحة (ثلاث شرائح مع شريط تنقل) · ' : 'شريحة · '}{categoryLabel(row.category)}</dd>
        <dt className="text-muted">التصدير</dt><dd>{date(row.createdAt)}</dd>
        <dt className="text-muted">وافق على القانون</dt><dd>النسخة {row.lawVersion} · {row.acceptedAt ? date(Date.parse(row.acceptedAt)) : '—'}</dd>
        {row.status === 'rejected' && <><dt className="text-muted">سبب الرفض</dt><dd className="text-danger">{row.reason || '—'}</dd></>}
        {row.reviewedBy && <><dt className="text-muted">راجعها</dt><dd>{row.reviewedBy}</dd></>}
      </dl>
      {contact.length > 0 && (
        <p className="rounded-ctl bg-danger/5 p-2 text-small text-danger">فيها بيانات تواصل: {contact.map((c) => CONTACT_KIND_LABEL[c.kind]).join('، ')}</p>
      )}
      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      {row.status !== 'approved' && !rejecting && (
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => review('approve')} className="inline-flex items-center gap-1.5 rounded-ctl bg-success px-4 py-2 text-small font-medium text-white hover:opacity-90 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} قبول ونشر في المعرض
          </button>
          {row.status === 'pending' && (
            <button disabled={busy} onClick={() => setRejecting(true)} className="inline-flex items-center gap-1.5 rounded-ctl border border-line px-4 py-2 text-small font-medium text-danger hover:bg-bg disabled:opacity-50">
              <X className="h-4 w-4" /> رفض
            </button>
          )}
        </div>
      )}
      {row.status === 'approved' && (
        <button disabled={busy} onClick={() => setRejecting(true)} className="self-start rounded-ctl border border-line px-4 py-2 text-small text-danger hover:bg-bg disabled:opacity-50">سحبها من المعرض</button>
      )}
      {rejecting && (
        <div className="flex flex-col gap-2">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} placeholder="سبب الرفض (يُحفظ مع الشريحة)" className="w-full rounded-ctl border border-line bg-surface p-2.5 text-small outline-none focus:border-brand" />
          <div className="flex gap-2">
            <button disabled={busy || reason.trim().length < 3} onClick={() => review('reject')} className="inline-flex items-center gap-1.5 rounded-ctl bg-danger px-4 py-2 text-small font-medium text-white hover:opacity-90 disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} تأكيد الرفض
            </button>
            <button disabled={busy} onClick={() => { setRejecting(false); setReason(''); }} className="rounded-ctl px-4 py-2 text-small text-muted hover:bg-bg">إلغاء</button>
          </div>
        </div>
      )}
    </article>
  );
};

export const SlidesReviewView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [status, setStatus] = useState<SlideStatus>('pending');
  const [rows, setRows] = useState<GallerySlideRow[] | null>(null);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async (st: SlideStatus) => {
    setError('');
    try {
      const r = await adminSlides(st);
      setRows(r.rows);
      setPending(r.counts.pending);
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل الشرائح.');
      setRows([]);
    }
  }, [onSessionEnd]);

  useEffect(() => {
    setRows(null);
    load(status);
  }, [status, load]);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="flex items-center gap-2 text-title font-semibold"><ShieldCheck className="h-6 w-6 text-brand" /> مراجعة الشرائح</h1>
      <p className="text-small text-muted leading-relaxed">الشرائح التي صدّرها المصممون. لا تظهر في المعرض إلا بعد قبولها.</p>
      <div className="flex flex-wrap gap-2">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setStatus(id)} className={`rounded-full border px-4 py-1.5 text-small ${status === id ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted hover:bg-bg'}`}>
            {label}{id === 'pending' && pending > 0 ? ` (${pending.toLocaleString('ar-SY')})` : ''}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-small text-danger">{error}</p>}
      {rows === null ? <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-muted" /> : rows.length === 0 ? (
        <p className="mt-8 text-center text-muted">لا توجد شرائح هنا.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => <SlideCard key={r.id} row={r} onChanged={() => load(status)} onSessionEnd={onSessionEnd} />)}
        </div>
      )}
    </section>
  );
};
