// «بلاغات التقييمات»: ratings that a page's owner reported to Weelink. The reviewer keeps the rating
// or removes it (it then also leaves the stars under the page's name). Nobody else can delete a rating.
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminError, RatingReport, adminReportDecide, adminReports } from '../../services/adminApi';

const KIND: Record<string, string> = { page: 'صفحة', shop: 'متجر', cars: 'سيارات', restaurant: 'مطعم' };
const inputCls = 'w-full rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';

export const ReportsView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [rows, setRows] = useState<RatingReport[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setRows((await adminReports()).rows);
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل البلاغات.');
    }
  }, [onSessionEnd]);
  useEffect(() => { load(); }, [load]);

  const decide = async (r: RatingReport, decision: 'keep' | 'remove') => {
    setBusy(r.id);
    setError('');
    try {
      await adminReportDecide(r.id, decision, note[r.id] || '');
      await load();
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تنفيذ القرار.');
    }
    setBusy('');
  };

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">بلاغات التقييمات</h1>
      {error && <p className="text-small text-danger">{error}</p>}
      {!rows ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : !rows.length ? <p className="text-small text-faint">لا بلاغات تنتظر المراجعة.</p> : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-card border border-line bg-surface p-3 text-small">
              <div className="flex flex-wrap justify-between gap-2 text-muted">
                <span>{KIND[r.project] || r.project} · بلّغ: {r.reporter || '—'}</span>
                <span>{r.at ? new Date(r.at).toLocaleDateString('ar-SY', { dateStyle: 'medium' }) : ''}</span>
              </div>
              <div className="mt-2 rounded-ctl bg-bg p-2">
                <div className="text-warn" dir="ltr">{'★'.repeat(r.stars)}{'☆'.repeat(Math.max(0, 5 - r.stars))} <span className="text-muted" dir="rtl">· {r.rater || 'زائر'}</span></div>
                <p className="mt-1 whitespace-pre-wrap">{r.text || '(بدون نص)'}</p>
              </div>
              <p className="mt-2"><b>سبب البلاغ:</b> <span className="whitespace-pre-wrap">{r.reason || '—'}</span></p>
              <input value={note[r.id] || ''} onChange={(e) => setNote({ ...note, [r.id]: e.target.value })} placeholder="ملاحظة للسجل (اختياري)" className={`${inputCls} mt-2`} />
              <div className="mt-2 flex gap-2">
                <button disabled={busy === r.id} onClick={() => decide(r, 'remove')} className="rounded-ctl bg-danger px-3 py-1.5 text-white hover:opacity-90 disabled:opacity-50">حذف التقييم</button>
                <button disabled={busy === r.id} onClick={() => decide(r, 'keep')} className="rounded-ctl border border-line px-3 py-1.5 hover:bg-bg disabled:opacity-50">إبقاؤه</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
