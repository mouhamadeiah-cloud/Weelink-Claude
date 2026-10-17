// «طلبات الدفع» in the admin site (server/billing.ts): the invoices customers asked for before publishing a
// paid project, with their transfer number or receipt photo. The team approves one (its payment and invoice
// are written and the project's period starts), rejects it with a reason, or gives an unpaid project more
// time before it is deleted. Also the switch that turns paying before publishing on.
import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import {
  AdminError, BillingOrder, ORDER_STATUS, OrderStatus, PAY_WAYS,
  adminBillingEnforce, adminBillingSettings, adminOrder, adminOrderApprove, adminOrderExtend, adminOrderReject, adminOrders,
} from '../../services/adminApi';

const money = (n: number) => `${n.toLocaleString('ar-SY')} ل.س`;
const day = (ms: number) => (ms ? new Date(ms).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const inputCls = 'w-full rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';
const TONE: Record<string, string> = { attached: 'text-warn', unpaid: 'text-muted', paid: 'text-success', rejected: 'text-danger', deleted: 'text-faint' };
const FILTERS: [string, string][] = [['attached', 'بانتظار الفحص'], ['unpaid', 'غير مدفوع'], ['rejected', 'مرفوض'], ['paid', 'مدفوع'], ['deleted', 'محذوف'], ['all', 'الكل']];
const ERRORS: Record<string, string> = { reason: 'اكتب سبباً (3 أحرف على الأقل).', 'bad-state': 'تغيّرت حالة الطلب. حدّث القائمة.', 'past-date': 'اختر تاريخاً بعد اليوم.', 'bad-date': 'اختر تاريخاً.' };

export const OrdersView: React.FC<{ onSessionEnd: () => void; can: string[] }> = ({ onSessionEnd, can }) => {
  const [status, setStatus] = useState('attached');
  const [data, setData] = useState<{ rows: BillingOrder[]; counts: Record<string, number> } | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState('');

  const fail = useCallback((e: unknown, fallback: string) => {
    if ((e as AdminError)?.code === 'session') return onSessionEnd();
    setError(ERRORS[(e as AdminError)?.code] || fallback);
  }, [onSessionEnd]);

  const load = useCallback(async (s: string) => {
    setError('');
    try {
      setData(await adminOrders(s));
    } catch (e) {
      fail(e, 'تعذّر تحميل الطلبات.');
    }
  }, [fail]);
  useEffect(() => { load(status); }, [status, load]);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">طلبات الدفع</h1>
      <p className="text-small text-muted">المشاريع المدفوعة بتنشر بس بعد ما تأكد إشعار دفعها. التأكيد بيكتب الدفعة والفاتورة وبيبلّش صلاحية المشروع من اليوم (أو من آخر مدته إذا تجديد). المشروع يلي ما اندفع بينحذف بعد شهرين من فاتورته، إلا إذا مدّدت.</p>
      {can.includes('billing-enforce') && <EnforceCard onSessionEnd={onSessionEnd} />}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([id, label]) => (
          <button key={id} onClick={() => setStatus(id)} className={`rounded-full border px-3 py-1 text-small ${status === id ? 'border-brand bg-brand text-white' : 'border-line bg-surface hover:bg-bg'}`}>
            {label}{id !== 'all' && data?.counts[id] ? ` (${data.counts[id].toLocaleString('ar-SY')})` : ''}
          </button>
        ))}
      </div>
      {error && <p className="text-small text-danger">{error}</p>}
      {!data ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[820px] text-right text-small">
            <thead className="border-b border-line text-muted">
              <tr>{['التاريخ', 'الزبون', 'المشروع', 'الباقة', 'المبلغ', 'الدفع', 'الحالة', 'الحذف'].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.rows.map((o) => (
                <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer border-b border-line last:border-0 hover:bg-bg">
                  <td className="px-3 py-2">{day(o.createdAt)}</td>
                  <td className="px-3 py-2">{o.name || o.email || '—'}</td>
                  <td className="px-3 py-2" dir="ltr">{o.siteName || o.project}</td>
                  <td className="px-3 py-2">{o.planName} · {o.period === 'yearly' ? 'سنوي' : 'شهري'}{o.renewal ? ' · تجديد' : ''}</td>
                  <td className="px-3 py-2 tabular-nums">{money(o.total)}</td>
                  <td className="px-3 py-2">{o.way ? PAY_WAYS[o.way] || o.way : '—'}{o.transferNo ? ` · ${o.transferNo}` : ''}{o.hasImage ? ' · صورة' : ''}</td>
                  <td className={`px-3 py-2 font-medium ${TONE[o.status] || ''}`}>{ORDER_STATUS[o.status]}</td>
                  <td className="px-3 py-2">{o.deleteAt && ['unpaid', 'rejected', 'attached'].includes(o.status) ? day(o.deleteAt) : '—'}</td>
                </tr>
              ))}
              {!data.rows.length && <tr><td colSpan={8} className="px-3 py-8 text-center text-muted">لا طلبات.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {openId && <OrderDetail id={openId} onClose={() => setOpenId('')} onChanged={() => load(status)} fail={fail} />}
    </section>
  );
};

const OrderDetail: React.FC<{ id: string; onClose: () => void; onChanged: () => void; fail: (e: unknown, fallback: string) => void }> = ({ id, onClose, onChanged, fail }) => {
  const [data, setData] = useState<{ order: BillingOrder; image: string; paidUntil: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [reject, setReject] = useState<string | null>(null);
  const [extend, setExtend] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [zoom, setZoom] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await adminOrder(id));
    } catch (e) {
      fail(e, 'تعذّر تحميل الطلب.');
      onClose();
    }
  }, [id, fail, onClose]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg('');
    try {
      setMsg(await fn());
      setReject(null);
      setExtend(null);
      await load();
      onChanged();
    } catch (e) {
      const code = (e as AdminError)?.code;
      if (code === 'session') return fail(e, '');
      setMsg(ERRORS[code] || 'تعذّر التنفيذ.');
    }
    setBusy(false);
  };

  const o = data?.order;
  const open = o && (['unpaid', 'attached', 'rejected'] as OrderStatus[]).includes(o.status);
  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <aside className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-heading font-semibold">طلب دفع</h2>
          <button onClick={onClose} className="rounded-ctl p-1 hover:bg-bg" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        {!o ? <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin text-muted" /> : (
          <div className="flex flex-col gap-4 text-small">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-muted">الزبون</dt><dd>{o.name || '—'} · <span dir="ltr">{o.email}</span></dd>
              <dt className="text-muted">المشروع</dt><dd dir="ltr" className="text-right">{o.siteName || o.project}</dd>
              <dt className="text-muted">الحالة</dt><dd className={`font-medium ${TONE[o.status] || ''}`}>{ORDER_STATUS[o.status]}{o.rejectReason ? ` · ${o.rejectReason}` : ''}</dd>
              <dt className="text-muted">الفاتورة</dt><dd>{day(o.createdAt)}</dd>
              {data.paidUntil > 0 && <><dt className="text-muted">صالح حالياً لحد</dt><dd>{day(data.paidUntil)}</dd></>}
              {o.deleteAt > 0 && open && <><dt className="text-muted">بينحذف</dt><dd className="text-danger">{day(o.deleteAt)}</dd></>}
              {o.decidedBy && <><dt className="text-muted">قرّر</dt><dd>{o.decidedBy} · {day(o.decidedAt)}</dd></>}
            </dl>

            <div className="rounded-ctl border border-line p-3">
              {o.items.map((i) => <div key={i.label} className="flex justify-between gap-2 py-0.5"><span>{i.label}</span><span className="tabular-nums">{i.amount ? money(i.amount) : 'مجاناً'}</span></div>)}
              <div className="mt-1 flex justify-between gap-2 border-t border-line pt-1.5 font-semibold"><span>المجموع</span><span className="tabular-nums">{money(o.total)}</span></div>
            </div>

            <div>
              <h3 className="mb-1 font-medium">إشعار الدفع</h3>
              {o.way ? <p>{PAY_WAYS[o.way] || o.way}{o.transferNo ? <> · رقم: <b dir="ltr">{o.transferNo}</b></> : ''}</p> : <p className="text-faint">لسا ما بعت إشعار.</p>}
              {data.image && (
                <button onClick={() => setZoom(true)} className="mt-2 block">
                  <img src={data.image} alt="صورة الإشعار" className="max-h-64 rounded-ctl border border-line" />
                </button>
              )}
            </div>

            {msg && <p className="text-success">{msg}</p>}
            {open && (
              reject !== null ? (
                <div className="flex flex-col gap-2 rounded-ctl border border-line bg-bg p-3">
                  <input autoFocus value={reject} onChange={(e) => setReject(e.target.value)} placeholder="سبب الرفض (بيوصل للزبون)" className={inputCls} />
                  <div className="flex gap-2">
                    <button disabled={busy || reject.trim().length < 3} onClick={() => run(async () => { await adminOrderReject(o.id, reject); return 'انرفض الطلب ووصل الزبون إيميل بالسبب.'; })} className="inline-flex items-center gap-1 rounded-ctl bg-danger px-3 py-1.5 text-white disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} رفض</button>
                    <button onClick={() => setReject(null)} className="rounded-ctl px-3 py-1.5 hover:bg-bg">رجوع</button>
                  </div>
                </div>
              ) : extend !== null ? (
                <div className="flex flex-col gap-2 rounded-ctl border border-line bg-bg p-3">
                  <label className="text-muted">موعد الحذف الجديد
                    <input type="date" value={extend} onChange={(e) => setExtend(e.target.value)} className={`${inputCls} mt-1`} />
                  </label>
                  <div className="flex gap-2">
                    <button disabled={busy || !extend} onClick={() => run(async () => { const r = await adminOrderExtend(o.id, extend); return `صار موعد الحذف ${day(r.deleteAt)}.`; })} className="inline-flex items-center gap-1 rounded-ctl bg-brand px-3 py-1.5 text-white disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} حفظ</button>
                    <button onClick={() => setExtend(null)} className="rounded-ctl px-3 py-1.5 hover:bg-bg">رجوع</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button disabled={busy} onClick={() => window.confirm(`تأكيد استلام ${money(o.total)}؟ بتنكتب الدفعة والفاتورة وبتبلش صلاحية المشروع.`) && run(async () => { const r = await adminOrderApprove(o.id); return `تأكّد الدفع. المشروع صالح لحد ${day(r.paidUntil)}، ووصل الزبون إيميل بالفاتورة.`; })} className="inline-flex items-center gap-1 rounded-ctl bg-brand px-3 py-1.5 text-white hover:bg-brand-hover disabled:opacity-50">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} تأكيد الدفع
                  </button>
                  {o.status === 'attached' && <button onClick={() => setReject('')} className="rounded-ctl border border-danger px-3 py-1.5 text-danger hover:bg-bg">رفض</button>}
                  {!o.renewal && <button onClick={() => setExtend('')} className="rounded-ctl border border-line px-3 py-1.5 hover:bg-bg">تمديد موعد الحذف</button>}
                </div>
              )
            )}
          </div>
        )}
      </aside>
      {zoom && data?.image && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(false)}>
          <img src={data.image} alt="صورة الإشعار" className="max-h-full max-w-full rounded-ctl" />
        </div>
      )}
    </div>
  );
};

// Turning paying before publishing on: every account that exists now becomes a test account first.
const EnforceCard: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [s, setS] = useState<{ enforce: boolean; since: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    adminBillingSettings().then(setS).catch((e) => (e as AdminError)?.code === 'session' && onSessionEnd());
  }, [onSessionEnd]);
  const toggle = async () => {
    if (!s) return;
    const on = !s.enforce;
    if (!window.confirm(on ? 'تفعيل الدفع قبل النشر؟ كل الحسابات الموجودة هلق بتصير حسابات تجريبية وبتضل تنشر بدون دفع. الحسابات الجديدة بتدفع.' : 'إيقاف الدفع قبل النشر؟ الكل بينشر بدون دفع لحد ما تفعّله من جديد.')) return;
    setBusy(true);
    try {
      const r = await adminBillingEnforce(on);
      setS({ enforce: r.enforce, since: Date.now() });
      setMsg(on ? `تفعّل. ${r.marked.toLocaleString('ar-SY')} حساب صار تجريبي.` : 'توقف.');
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setMsg('تعذّر الحفظ.');
    }
    setBusy(false);
  };
  if (!s) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex-1 min-w-[220px]">
        <p className="font-medium">الدفع قبل النشر: <span className={s.enforce ? 'text-success' : 'text-warn'}>{s.enforce ? `مفعّل من ${day(s.since)}` : 'متوقف'}</span></p>
        <p className="text-tiny text-faint">لما يكون متوقف، كل المشاريع بتنشر بدون دفع. التفعيل بيخلّي الحسابات الموجودة تجريبية (بدون حدود).</p>
        {msg && <p className="text-tiny text-muted">{msg}</p>}
      </div>
      <button disabled={busy} onClick={toggle} className={`inline-flex items-center gap-1 rounded-ctl px-3 py-1.5 text-white disabled:opacity-50 ${s.enforce ? 'bg-danger' : 'bg-brand hover:bg-brand-hover'}`}>
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {s.enforce ? 'إيقاف' : 'تفعيل'}
      </button>
    </div>
  );
};
