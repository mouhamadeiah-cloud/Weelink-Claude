// «طلبات التصميم»: a customer hired a gallery designer (api/design-orders.ts). The office takes the customer's
// money and marks it paid (which opens the talking between the two), holds it until the customer confirms
// the design, then pays the designer their part; a complaint is decided here (pay the designer or refund
// the customer). The messages of an order are readable here, for complaints.
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  AdminDesignOrder, AdminError, AdminOrderMessage, PAY_METHODS, PayMethod,
  adminDesignOrder, adminDesignOrders, adminPaymentInfo, adminRecountDesigner, adminSetPaymentInfo, adminOrderPaid, adminOrderRefund, adminOrderRelease,
} from '../../services/adminApi';
import { STATUS_LABEL } from '../../services/designOrders';

const money = (n: number) => `${n.toLocaleString('ar-SY')} ل.س`;
const when = (ms: number) => (ms ? new Date(ms).toLocaleString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const short = (id: string) => id.slice(0, 6).toUpperCase();
const inputCls = 'w-full rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';
const btn = 'inline-flex items-center justify-center gap-1.5 rounded-ctl px-4 py-2 text-small font-medium disabled:opacity-50';

const FILTERS: [string, string][] = [['', 'الكل'], ['awaiting_payment', 'بانتظار الدفع'], ['paid', 'مدفوع'], ['delivered', 'سُلّم'], ['confirmed', 'مؤكَّد (للصرف)'], ['disputed', 'شكاوى'], ['paid_out', 'مكتمل'], ['refunded', 'مُسترد'], ['cancelled', 'ملغى']];
const tone = (s: string) => (s === 'confirmed' || s === 'disputed' || s === 'awaiting_payment' ? 'text-warn' : s === 'paid_out' ? 'text-success' : s === 'refunded' || s === 'cancelled' ? 'text-faint' : 'text-ink');

const Detail: React.FC<{ id: string; onClose: () => void; onChanged: () => void; onSessionEnd: () => void }> = ({ id, onClose, onChanged, onSessionEnd }) => {
  const [data, setData] = useState<{ order: AdminDesignOrder; messages: AdminOrderMessage[] } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [method, setMethod] = useState<PayMethod>('office');
  const [receipt, setReceipt] = useState('');
  const [note, setNote] = useState('');
  const [recount, setRecount] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await adminDesignOrder(id));
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل الطلب.');
    }
  }, [id, onSessionEnd]);
  useEffect(() => { load(); }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError('');
    try {
      await fn();
      await load();
      onChanged();
      setNote('');
    } catch (e) {
      const code = (e as AdminError)?.code;
      if (code === 'session') return onSessionEnd();
      setError(code === 'bad-state' ? 'حالة الطلب تغيّرت. أعد تحميل الصفحة.' : code === 'reason' ? 'اكتب السبب (3 أحرف على الأقل).' : 'تعذّر التنفيذ.');
    }
    setBusy('');
  };

  const o = data?.order;
  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/30" onClick={onClose}>
      <aside dir="rtl" className="h-full w-full max-w-lg overflow-y-auto bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-heading font-semibold">طلب #{short(id)}</h2>
          <button onClick={onClose} className="rounded-ctl p-1 hover:bg-bg" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        {!o ? (error ? <p className="text-small text-danger">{error}</p> : <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted" />) : (
          <div className="flex flex-col gap-4">
            <div className={`text-small font-medium ${tone(o.status)}`}>{STATUS_LABEL[o.status]}{o.late && <span className="mr-1.5 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger">شكوى متأخرة</span>}</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-small">
              <dt className="text-muted">الزبون</dt><dd dir="ltr" className="text-right">{o.customerEmail || o.customerUid} <span className="text-faint">({o.customerAlias})</span></dd>
              <dt className="text-muted">المصمم</dt><dd>{o.designerName} <span dir="ltr" className="text-faint">{o.designerEmail}</span></dd>
              {o.slideName && <><dt className="text-muted">تصميم أعجبه</dt><dd>{o.slideName}</dd></>}
              <dt className="text-muted">السعر (باقة {o.planId})</dt><dd className="tabular-nums">{money(o.price)}</dd>
              <dt className="text-muted">حصة المصمم</dt><dd className="tabular-nums">{money(o.designerShare)}</dd>
              <dt className="text-muted">حصة المنصة</dt><dd className="tabular-nums">{money(o.platformShare)}</dd>
              <dt className="text-muted">أُنشئ</dt><dd>{when(o.createdAt)}</dd>
              <dt className="text-muted">الطلب</dt><dd className="whitespace-pre-wrap">{o.brief}</dd>
              {o.disputeReason && <><dt className="text-muted">الشكوى</dt><dd className="text-danger">{o.disputeReason}</dd></>}
              {o.rating && <><dt className="text-muted">تقييم الزبون</dt><dd>{'★'.repeat(o.rating.stars)}{'☆'.repeat(5 - o.rating.stars)}{o.rating.text ? ` · ${o.rating.text}` : ''}</dd></>}
              {o.payment && <><dt className="text-muted">الدفع</dt><dd>{PAY_METHODS[o.payment.method as PayMethod] || o.payment.method} · {when(o.payment.at)}{o.payment.receiptNo ? ` · إيصال ${o.payment.receiptNo}` : ''} · {o.payment.by}</dd></>}
              {o.payout && <><dt className="text-muted">صرف المصمم</dt><dd>{money(o.payout.amount)} · {when(o.payout.at)} · {o.payout.by}{o.payout.note ? ` · ${o.payout.note}` : ''}</dd></>}
              {o.refund && <><dt className="text-muted">إلغاء/استرداد</dt><dd>{o.refund.reason} · {when(o.refund.at)} · {o.refund.by}</dd></>}
            </dl>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-small">
              <button type="button" disabled={!!busy} onClick={() => run('recount', async () => { const r = await adminRecountDesigner(o.designerUid); setNote(''); setRecount(`مكتملة ${r.stats.completed} · تقييمات ${r.stats.ratingCount} · ${r.stats.verified ? 'معتمد' : 'غير معتمد'}`); })} className="rounded-ctl border border-line px-3 py-1.5 font-medium text-muted hover:text-ink disabled:opacity-50">إعادة حساب إحصاء المصمم</button>
              {recount && <span className="text-muted">{recount}</span>}
            </div>

            {o.status === 'awaiting_payment' && (
              <div className="flex flex-col gap-2 rounded-card border border-line p-3">
                <p className="text-small font-medium">تأكيد استلام المبلغ من الزبون ({money(o.price)})</p>
                <select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)} className={inputCls}>
                  {(Object.keys(PAY_METHODS) as PayMethod[]).map((m) => <option key={m} value={m}>{PAY_METHODS[m]}</option>)}
                </select>
                <input value={receipt} onChange={(e) => setReceipt(e.target.value)} placeholder="رقم الإيصال (اختياري)" className={inputCls} />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة (اختياري)" className={inputCls} />
                <button disabled={!!busy} onClick={() => run('paid', () => adminOrderPaid(o.id, method, receipt, note))} className={`${btn} bg-brand text-white hover:bg-brand-hover`}>{busy === 'paid' && <Loader2 className="h-4 w-4 animate-spin" />} استلمنا المبلغ: افتح التواصل</button>
              </div>
            )}
            {(o.status === 'confirmed' || o.status === 'disputed') && (
              <div className="flex flex-col gap-2 rounded-card border border-line p-3">
                <p className="text-small font-medium">صرف حصة المصمم ({money(o.designerShare)})</p>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة (طريقة التحويل، رقم...)" className={inputCls} />
                <button disabled={!!busy} onClick={() => run('release', () => adminOrderRelease(o.id, note))} className={`${btn} bg-success text-white hover:opacity-90`}>{busy === 'release' && <Loader2 className="h-4 w-4 animate-spin" />} حوّلنا حصة المصمم</button>
              </div>
            )}
            {['awaiting_payment', 'paid', 'delivered', 'confirmed', 'disputed'].includes(o.status) && (
              <div className="flex flex-col gap-2 rounded-card border border-line p-3">
                <p className="text-small font-medium">{o.status === 'awaiting_payment' ? 'إلغاء الطلب' : 'رد المبلغ للزبون وإغلاق الطلب'}</p>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="السبب" className={inputCls} />
                <button disabled={!!busy || note.trim().length < 3} onClick={() => run('refund', () => adminOrderRefund(o.id, note))} className={`${btn} border border-line text-danger hover:bg-bg`}>{busy === 'refund' && <Loader2 className="h-4 w-4 animate-spin" />} {o.status === 'awaiting_payment' ? 'ألغِ الطلب' : 'رُدّ المبلغ'}</button>
              </div>
            )}
            {error && <p role="alert" className="text-small text-danger">{error}</p>}

            <div>
              <p className="mb-2 text-small font-medium">المحادثة ({data!.messages.length})</p>
              <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto rounded-card border border-line bg-bg p-3 text-small">
                {data!.messages.length === 0 && <span className="text-faint">لا رسائل.</span>}
                {data!.messages.map((m) => (
                  <div key={m.id} className={m.role === 'system' ? 'text-center text-tiny text-muted' : ''}>
                    {m.role !== 'system' && <b className="ml-1">{m.role === 'customer' ? 'الزبون' : 'المصمم'}:</b>}{m.text} <span className="text-tiny text-faint">{when(m.at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

// How the customer pays the office: shown to the customer with the price and in the unpaid order.
const PaymentInfo: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [text, setText] = useState<string | null>(null);
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    adminPaymentInfo().then((r) => { setText(r.text); setSaved(r.text); }).catch((e) => { if ((e as AdminError)?.code === 'session') onSessionEnd(); else setText(''); });
  }, [onSessionEnd]);
  if (text === null) return null;
  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      await adminSetPaymentInfo(text);
      setSaved(text);
      setMsg('انحفظ.');
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setMsg('تعذّر الحفظ.');
    }
    setBusy(false);
  };
  return (
    <details className="rounded-card border border-line bg-surface p-4" open={!saved}>
      <summary className="cursor-pointer text-small font-medium">تعليمات الدفع التي تظهر للزبون {saved ? '' : '(لم تُكتب بعد)'}</summary>
      <div className="mt-3 flex flex-col gap-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={1500} placeholder="مثال: التحويل إلى حساب … باسم … أو التسليم في مكتب … من 10 إلى 6. اذكر رقم الطلب في الحوالة." className="w-full rounded-ctl border border-line bg-bg p-3 text-small outline-none focus:border-brand" />
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={busy || text === saved} className="rounded-ctl bg-brand px-4 py-2 text-small font-medium text-white disabled:opacity-50">حفظ</button>
          {msg && <span className="text-small text-muted">{msg}</span>}
        </div>
      </div>
    </details>
  );
};

export const DesignOrdersView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [status, setStatus] = useState('');
  const [data, setData] = useState<{ rows: AdminDesignOrder[]; counts: Record<string, number> } | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState('');

  const load = useCallback(async (st: string) => {
    setError('');
    try {
      setData(await adminDesignOrders(st));
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل الطلبات.');
      setData({ rows: [], counts: {} });
    }
  }, [onSessionEnd]);
  useEffect(() => { setData(null); load(status); }, [status, load]);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">طلبات التصميم</h1>
      <p className="text-small text-muted leading-relaxed">طلبات الزبائن من المصممين. المبلغ يبقى عند المكتب إلى أن يؤكّد الزبون استلام التصميم، ثم تُصرف حصة المصمم (70%) وتبقى حصة المنصة (30%).</p>
      <PaymentInfo onSessionEnd={onSessionEnd} />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([id, label]) => (
          <button key={id} onClick={() => setStatus(id)} className={`rounded-full border px-3.5 py-1.5 text-small ${status === id ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted hover:bg-bg'}`}>
            {label}{id && data?.counts[id] ? ` (${data.counts[id].toLocaleString('ar-SY')})` : ''}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-small text-danger">{error}</p>}
      {data === null ? <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-muted" /> : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[820px] text-right text-small">
            <thead className="border-b border-line text-muted">
              <tr>{['الطلب', 'الزبون', 'المصمم', 'السعر', 'حصة المصمم', 'الحالة', 'آخر تحديث'].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.rows.map((o) => (
                <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer border-b border-line last:border-0 hover:bg-bg">
                  <td className="px-3 py-2">#{short(o.id)}</td>
                  <td className="px-3 py-2" dir="ltr">{o.customerEmail || o.customerAlias}</td>
                  <td className="px-3 py-2">{o.designerName}</td>
                  <td className="px-3 py-2 tabular-nums">{money(o.price)}</td>
                  <td className="px-3 py-2 tabular-nums">{money(o.designerShare)}</td>
                  <td className={`px-3 py-2 ${tone(o.status)}`}>{STATUS_LABEL[o.status]}{o.late && <span className="mr-1.5 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger">متأخرة</span>}</td>
                  <td className="px-3 py-2">{when(o.updatedAt)}</td>
                </tr>
              ))}
              {!data.rows.length && <tr><td colSpan={7} className="px-3 py-8 text-center text-muted">لا طلبات.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {openId && <Detail id={openId} onClose={() => setOpenId('')} onChanged={() => load(status)} onSessionEnd={onSessionEnd} />}
    </section>
  );
};
