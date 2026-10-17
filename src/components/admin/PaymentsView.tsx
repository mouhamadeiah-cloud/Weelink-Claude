// «كل الدفعات» in the admin site: every payment with filters and the money total, an invoice link
// and sending the invoice by email.
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminError, PAY_METHODS, Payment, adminInvoiceSend, adminPayments, invoiceUrl } from '../../services/adminApi';

const money = (n: number) => `${n.toLocaleString('ar-SY')} ل.س`;
const day = (ms: number) => (ms ? new Date(ms).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const inputCls = 'rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';

export const SEND_ERRORS: Record<string, string> = {
  'email-not-configured': 'الإيميل غير مُعدّ في Cloudflare (EMAIL_FROM و RESEND_API_KEY).',
  'no-email': 'لا يوجد إيميل لهذا المشترك.',
  refused: 'رفض مزوّد الإيميل الإرسال. غالباً دومين الإرسال غير مؤكَّد في Resend.',
};

export const PaymentsView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [filter, setFilter] = useState({ month: '', method: '', q: '' });
  const [data, setData] = useState<{ rows: Payment[]; matched: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (f: typeof filter) => {
    setError('');
    try {
      setData(await adminPayments(f));
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل الدفعات.');
    }
  }, [onSessionEnd]);

  useEffect(() => {
    const t = setTimeout(() => load(filter), filter.q ? 400 : 0);
    return () => clearTimeout(t);
  }, [filter, load]);

  const send = async (p: Payment) => {
    setSending(p.id);
    setNotice('');
    try {
      await adminInvoiceSend(p.id);
      setNotice(`أُرسلت الفاتورة ${p.invoiceNo} إلى ${p.email}.`);
      load(filter);
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setNotice(SEND_ERRORS[(e as AdminError)?.code] || 'تعذّر الإرسال.');
    }
    setSending('');
  };

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">كل الدفعات</h1>
      <div className="flex flex-wrap items-center gap-2">
        <input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} placeholder="ابحث باسم المشترك أو الإيميل أو رقم الفاتورة" className={`${inputCls} min-w-[220px] flex-1`} />
        <input type="month" value={filter.month} onChange={(e) => setFilter({ ...filter, month: e.target.value })} className={inputCls} />
        <select value={filter.method} onChange={(e) => setFilter({ ...filter, method: e.target.value })} className={inputCls}>
          <option value="">كل الطرق</option>
          {Object.entries(PAY_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {error && <p className="text-small text-danger">{error}</p>}
      {notice && <p className="text-small text-muted">{notice}</p>}
      {!data ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : (
        <>
          <p className="text-small text-muted">{data.matched.toLocaleString('ar-SY')} دفعة · المجموع <b className="text-ink">{money(data.total)}</b></p>
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[820px] text-right text-small">
              <thead className="border-b border-line text-muted">
                <tr>{['الفاتورة', 'المشترك', 'الباقة', 'المبلغ', 'الطريقة', 'التاريخ', 'حتى', ''].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.rows.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2" dir="ltr">{p.invoiceNo}</td>
                    <td className="px-3 py-2">{p.name || p.email || '—'}</td>
                    <td className="px-3 py-2">{p.planName} · {p.period === 'yearly' ? 'سنوي' : 'شهري'}</td>
                    <td className="px-3 py-2 tabular-nums">{money(p.amount)}</td>
                    <td className="px-3 py-2">{PAY_METHODS[p.method] || p.method}{p.receiptNo ? ` · ${p.receiptNo}` : ''}</td>
                    <td className="px-3 py-2">{day(p.paidAt)}</td>
                    <td className="px-3 py-2">{day(p.coversTo)}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <a href={invoiceUrl(p)} target="_blank" rel="noreferrer" className="text-brand hover:underline">الفاتورة</a>
                      <button disabled={sending === p.id} onClick={() => send(p)} className="mr-3 text-brand hover:underline disabled:opacity-50">{p.sentAt ? 'إعادة إرسال' : 'إرسال بالإيميل'}</button>
                    </td>
                  </tr>
                ))}
                {!data.rows.length && <tr><td colSpan={8} className="px-3 py-8 text-center text-muted">لا دفعات.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
