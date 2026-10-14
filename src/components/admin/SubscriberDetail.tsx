// One subscriber in the admin site: profile, pages, status (freeze / cancel / activate, each with
// a reason) and the history of what the team did, with notes.
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { PLANS, formatPounds, yearlyPrice } from '../../data/plans';
import {
  AdminError, PAY_METHODS, PayMethod, Period, SubscriberDetail as Detail, SubscriberStatus,
  adminAddNote, adminAddPayment, adminInvoiceSend, adminPostponeFreeze, adminSetStatus, adminSubscriber, adminTokensAdjust, invoiceUrl,
} from '../../services/adminApi';
import { SEND_ERRORS } from './PaymentsView';

const KIND: Record<string, string> = { free: 'صفحة', restaurant: 'مطعم', shop: 'متجر', cars: 'سيارات' };
const STATUS_LABEL: Record<SubscriberStatus, string> = { active: 'نشط', frozen: 'مجمّد', cancelled: 'ملغى' };
const STATUS_COLOR: Record<SubscriberStatus, string> = { active: 'text-success', frozen: 'text-warn', cancelled: 'text-danger' };
const when = (ms: number) => (ms ? new Date(ms).toLocaleString('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const ACTIONS: Record<SubscriberStatus, { to: SubscriberStatus; label: string; sure: string }[]> = {
  active: [
    { to: 'frozen', label: 'تجميد', sure: 'سيُمنع من الدخول وتظهر صفحاته «غير متاحة مؤقتاً». يمكن التفعيل لاحقاً.' },
    { to: 'cancelled', label: 'إلغاء الاشتراك', sure: 'مثل التجميد مع علامة «ملغى». بياناته تبقى ولا تُحذف.' },
  ],
  frozen: [
    { to: 'active', label: 'تفعيل', sure: 'يعود حسابه وصفحاته كما كانت، ويُلغى موعد التجميد التلقائي (لتاريخ محدد استعمل «تأجيل التجميد»).' },
    { to: 'cancelled', label: 'إلغاء الاشتراك', sure: 'يصير «ملغى». بياناته تبقى ولا تُحذف.' },
  ],
  cancelled: [{ to: 'active', label: 'إعادة التفعيل', sure: 'يعود حسابه وصفحاته كما كانت، ويُلغى موعد التجميد التلقائي (لتاريخ محدد استعمل «تأجيل التجميد»).' }],
};

const KIND_AR: Record<string, string> = { page: 'صفحة', restaurant: 'مطعم', shop: 'متجر', cars: 'سيارات' };
// The paid packages with the price from plans.ts (the admin may change the amount for a discount).
const PAID_PLANS = Object.entries(PLANS).flatMap(([kind, list]) => list.filter((p) => p.monthly > 0).map((p) => ({ id: p.id, name: `${KIND_AR[kind] || kind} ${p.name}`, monthly: p.monthly })));
const day = (ms: number) => (ms ? new Date(ms).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' }) : '—');
const money = (n: number) => formatPounds(n);

const inputCls = 'w-full rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';

export const SubscriberDetail: React.FC<{ uid: string; can: string[]; onClose: () => void; onChanged: () => void; onSessionEnd: () => void }> = ({ uid, can, onClose, onChanged, onSessionEnd }) => {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<SubscriberStatus | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState<{ plan: string; period: Period; amount: string; method: PayMethod; receiptNo: string; note: string } | null>(null);
  const [postpone, setPostpone] = useState<{ date: string; reason: string } | null>(null);
  const [info, setInfo] = useState('');
  const [tok, setTok] = useState<{ delta: string; reason: string } | null>(null);

  const fail = useCallback((e: unknown, fallback: string) => {
    if ((e as AdminError)?.code === 'session') return onSessionEnd();
    const code = (e as AdminError)?.code;
    setError(code === 'reason' ? 'اكتب سبباً (3 أحرف على الأقل).' : code === 'past-date' ? 'اختر تاريخاً بعد اليوم.' : SEND_ERRORS[code] || fallback);
  }, [onSessionEnd]);

  const load = useCallback(async () => {
    try {
      setData(await adminSubscriber(uid));
    } catch (e) {
      fail(e, 'تعذّر تحميل المشترك.');
    }
  }, [uid, fail]);
  useEffect(() => { load(); }, [load]);

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    setError('');
    try {
      await adminSetStatus(uid, pending, reason);
      setPending(null);
      setReason('');
      await load();
      onChanged();
    } catch (e) {
      fail(e, 'تعذّر تنفيذ الإجراء. جرّب مرة ثانية.');
    }
    setBusy(false);
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    setError('');
    try {
      await adminAddNote(uid, note);
      setNote('');
      await load();
    } catch (e) {
      fail(e, 'تعذّر حفظ الملاحظة.');
    }
    setBusy(false);
  };

  const choosePlan = (plan: string, period: Period) => {
    const pl = PAID_PLANS.find((x) => x.id === plan);
    return pl ? String(period === 'yearly' ? yearlyPrice(pl.monthly) : pl.monthly) : '';
  };
  const openPay = () => {
    const plan = data?.subscription?.plan || PAID_PLANS[0].id;
    const period = data?.subscription?.period || 'monthly';
    setPay({ plan, period, amount: choosePlan(plan, period), method: 'office', receiptNo: '', note: '' });
    setError('');
    setInfo('');
  };
  const savePay = async () => {
    if (!pay) return;
    setBusy(true);
    setError('');
    try {
      const planName = PAID_PLANS.find((x) => x.id === pay.plan)?.name || pay.plan;
      const r = await adminAddPayment({ uid, plan: pay.plan, planName, period: pay.period, amount: Number(pay.amount) || 0, method: pay.method, receiptNo: pay.receiptNo, note: pay.note });
      setPay(null);
      setInfo(`سُجّلت الدفعة وصدرت الفاتورة ${r.payment.invoiceNo}. الاشتراك حتى ${day(r.payment.coversTo)}.`);
      await load();
      onChanged();
    } catch (e) {
      fail(e, 'تعذّر تسجيل الدفعة.');
    }
    setBusy(false);
  };
  const saveTokens = async () => {
    if (!tok) return;
    setBusy(true);
    setError('');
    try {
      const r = await adminTokensAdjust(uid, Number(tok.delta), tok.reason);
      setTok(null);
      setInfo(`الرصيد الآن ${r.balance.toLocaleString('ar-SY')} توكن.`);
      await load();
    } catch (e) {
      fail(e, 'تعذّر تعديل الرصيد (اكتب رقماً غير صفر).');
    }
    setBusy(false);
  };

  const savePostpone = async () => {
    if (!postpone) return;
    setBusy(true);
    setError('');
    try {
      await adminPostponeFreeze(uid, postpone.date, postpone.reason);
      setPostpone(null);
      await load();
      onChanged();
    } catch (e) {
      fail(e, 'تعذّر تغيير موعد التجميد.');
    }
    setBusy(false);
  };
  const sendInvoice = async (paymentId: string) => {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await adminInvoiceSend(paymentId);
      setInfo('أُرسلت الفاتورة بالإيميل.');
      await load();
    } catch (e) {
      fail(e, 'تعذّر إرسال الفاتورة.');
    }
    setBusy(false);
  };

  const p = data?.profile;
  const st = data?.status.status || 'active';
  const action = pending ? ACTIONS[st].find((a) => a.to === pending) : null;

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <aside className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-heading font-semibold">{p ? p.name || p.email || 'مشترك' : 'مشترك'}</h2>
          <button onClick={onClose} className="rounded-ctl p-1 hover:bg-bg" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        {!data && !error && <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin text-muted" />}
        {error && <p className="mb-3 text-small text-danger">{error}</p>}
        {data && p && (
          <div className="flex flex-col gap-5 text-small">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-muted">الإيميل</dt><dd dir="ltr" className="text-right">{p.email || '—'}{p.email && !p.verified && <span className="text-warn"> (غير مؤكَّد)</span>}</dd>
              <dt className="text-muted">الهاتف</dt><dd dir="ltr" className="text-right">{p.phone || '—'}</dd>
              <dt className="text-muted">الاشتراك</dt><dd>{when(p.createdAt)}</dd>
              <dt className="text-muted">آخر نشاط</dt><dd>{when(p.lastActive)}</dd>
              <dt className="text-muted">الحالة</dt><dd className={`font-medium ${STATUS_COLOR[st]}`}>{STATUS_LABEL[st]}{data.status.reason && st !== 'active' ? ` · ${data.status.reason}` : ''}</dd>
            </dl>

            <div>
              <h3 className="mb-1 font-medium">الصفحات المنشورة</h3>
              {data.sites.length ? data.sites.map((x) => <div key={x.name}>{KIND[x.project] || x.project} · <span dir="ltr">{x.name}</span></div>) : <span className="text-faint">لا شيء منشور.</span>}
            </div>


            <div>
              <h3 className="mb-2 font-medium">الاشتراك والدفع</h3>
              {data.subscription ? (
                <dl className="mb-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                  <dt className="text-muted">الباقة</dt><dd>{data.subscription.planName} · {data.subscription.period === 'yearly' ? 'سنوي' : 'شهري'}</dd>
                  <dt className="text-muted">ينتهي</dt><dd>{day(data.subscription.endsAt)}</dd>
                  <dt className="text-muted">التجميد التلقائي</dt><dd>{data.subscription.freezeAt ? day(data.subscription.freezeAt) : 'بدون'}</dd>
                </dl>
              ) : <p className="mb-2 text-faint">لا اشتراك مدفوع (صفحة مجانية).</p>}
              {info && <p className="mb-2 text-success">{info}</p>}

              {pay ? (
                <div className="flex flex-col gap-2 rounded-ctl border border-line bg-bg p-3">
                  <select value={pay.plan} onChange={(e) => setPay({ ...pay, plan: e.target.value, amount: choosePlan(e.target.value, pay.period) })} className={inputCls}>
                    {PAID_PLANS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <select value={pay.period} onChange={(e) => setPay({ ...pay, period: e.target.value as Period, amount: choosePlan(pay.plan, e.target.value as Period) })} className={inputCls}>
                      <option value="monthly">شهري</option><option value="yearly">سنوي (خصم 10%)</option>
                    </select>
                    <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value as PayMethod })} className={inputCls}>
                      {Object.entries(PAY_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <input type="number" min={0} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder="المبلغ بالليرة" className={inputCls} />
                  <input value={pay.receiptNo} onChange={(e) => setPay({ ...pay, receiptNo: e.target.value })} placeholder="رقم الإيصال (اختياري)" className={inputCls} />
                  <input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} placeholder="ملاحظة (اختياري)" className={inputCls} />
                  <p className="text-tiny text-faint">الاشتراك يمتد من نهاية اشتراكه الحالي (أو من اليوم إن انتهى) ويصير موعد التجميد عند انتهائه.</p>
                  <div className="flex gap-2">
                    <button disabled={busy} onClick={savePay} className="inline-flex items-center gap-1 rounded-ctl bg-brand px-3 py-1.5 text-white hover:bg-brand-hover disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} تسجيل الدفعة</button>
                    <button onClick={() => setPay(null)} className="rounded-ctl px-3 py-1.5 hover:bg-surface">رجوع</button>
                  </div>
                </div>
              ) : postpone ? (
                <div className="flex flex-col gap-2 rounded-ctl border border-line bg-bg p-3">
                  <label className="text-muted">تاريخ التجميد الجديد (اتركه فارغاً: بدون تجميد تلقائي)
                    <input type="date" value={postpone.date} onChange={(e) => setPostpone({ ...postpone, date: e.target.value })} className={`${inputCls} mt-1`} />
                  </label>
                  <input value={postpone.reason} onChange={(e) => setPostpone({ ...postpone, reason: e.target.value })} placeholder="السبب (مطلوب)" className={inputCls} />
                  <div className="flex gap-2">
                    <button disabled={busy || postpone.reason.trim().length < 3} onClick={savePostpone} className="inline-flex items-center gap-1 rounded-ctl bg-brand px-3 py-1.5 text-white hover:bg-brand-hover disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} حفظ</button>
                    <button onClick={() => setPostpone(null)} className="rounded-ctl px-3 py-1.5 hover:bg-surface">رجوع</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {can.includes('add-payment') && <button onClick={openPay} className="rounded-ctl border border-line px-3 py-1.5 hover:bg-bg">تسجيل دفعة</button>}
                  {can.includes('postpone-freeze') && <button onClick={() => { setPostpone({ date: '', reason: '' }); setError(''); setInfo(''); }} className="rounded-ctl border border-line px-3 py-1.5 hover:bg-bg">تأجيل التجميد</button>}
                </div>
              )}

              {data.payments.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {data.payments.map((x) => (
                    <li key={x.id} className="rounded-ctl border border-line px-3 py-2">
                      <div className="flex justify-between gap-2"><span dir="ltr">{x.invoiceNo}</span><b className="tabular-nums">{money(x.amount)}</b></div>
                      <div className="text-tiny text-faint">{x.planName} · {PAY_METHODS[x.method] || x.method} · {day(x.paidAt)}</div>
                      <div className="mt-1 flex gap-3 text-tiny">
                        <a href={invoiceUrl(x)} target="_blank" rel="noreferrer" className="text-brand hover:underline">الفاتورة</a>
                        <button disabled={busy} onClick={() => sendInvoice(x.id)} className="text-brand hover:underline disabled:opacity-50">{x.sentAt ? 'إعادة الإرسال بالإيميل' : 'إرسال بالإيميل'}</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div hidden={!can.includes('tokens-overview')}>
              <h3 className="mb-2 font-medium">توكنز Wee AI</h3>
              <p className="mb-2">
                الرصيد: <b className="tabular-nums">{data.tokens.balance === null ? `لم يستعمل بعد (يبدأ بـ ${data.tokens.free.toLocaleString('ar-SY')})` : data.tokens.balance.toLocaleString('ar-SY')}</b>
                {data.tokens.used > 0 && <span className="text-faint"> · استهلك {data.tokens.used.toLocaleString('ar-SY')}</span>}
              </p>
              {tok ? (
                <div className="flex flex-col gap-2 rounded-ctl border border-line bg-bg p-3">
                  <input type="number" value={tok.delta} onChange={(e) => setTok({ ...tok, delta: e.target.value })} placeholder="عدد التوكنز (موجب للشحن، سالب للخصم)" className={inputCls} />
                  <input value={tok.reason} onChange={(e) => setTok({ ...tok, reason: e.target.value })} placeholder="السبب (مطلوب)" className={inputCls} />
                  <div className="flex gap-2">
                    <button disabled={busy || !Number(tok.delta) || tok.reason.trim().length < 3} onClick={saveTokens} className="inline-flex items-center gap-1 rounded-ctl bg-brand px-3 py-1.5 text-white hover:bg-brand-hover disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} حفظ</button>
                    <button onClick={() => setTok(null)} className="rounded-ctl px-3 py-1.5 hover:bg-surface">رجوع</button>
                  </div>
                </div>
              ) : can.includes('tokens-adjust') && <button onClick={() => { setTok({ delta: '', reason: '' }); setError(''); setInfo(''); }} className="rounded-ctl border border-line px-3 py-1.5 hover:bg-bg">شحن أو خصم</button>}
              {data.calls.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1">
                  {data.calls.map((c, i) => (
                    <li key={i} className="flex justify-between gap-2 text-tiny text-muted">
                      <span>{when(c.at)} · {c.kind === 'build-page' ? 'ابن صفحتي' : c.kind === 'write-texts' ? 'اكتب النصوص' : c.kind}{c.ok ? '' : ` · فشل ${c.reason}`}</span>
                      <span className="tabular-nums" dir="ltr">{c.tokens.toLocaleString('en')} · ${c.costUsd.toFixed(4)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div hidden={!can.includes('set-status')}>
              <h3 className="mb-2 font-medium">الإجراءات</h3>
              {!pending ? (
                <div className="flex flex-wrap gap-2">
                  {ACTIONS[st].map((a) => (
                    <button key={a.to} onClick={() => { setPending(a.to); setReason(''); setError(''); }}
                      className={`rounded-ctl border px-3 py-1.5 hover:bg-bg ${a.to === 'cancelled' ? 'border-danger text-danger' : 'border-line'}`}>{a.label}</button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 rounded-ctl border border-line bg-bg p-3">
                  <p>{action?.sure}</p>
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={pending === 'active' ? 'السبب (اختياري)' : 'السبب (مطلوب)'} className={inputCls} />
                  <div className="flex gap-2">
                    <button disabled={busy || (pending !== 'active' && reason.trim().length < 3)} onClick={confirm}
                      className="inline-flex items-center gap-1 rounded-ctl bg-brand px-3 py-1.5 text-white hover:bg-brand-hover disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} تأكيد: {action?.label}</button>
                    <button onClick={() => setPending(null)} className="rounded-ctl px-3 py-1.5 hover:bg-surface">رجوع</button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 font-medium">ملاحظة للإدارة</h3>
              <div className="flex gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} placeholder="اكتب ملاحظة وسجّلها بالتاريخ" className={inputCls} />
                <button disabled={busy || !note.trim()} onClick={addNote} className="rounded-ctl border border-line px-3 hover:bg-bg disabled:opacity-50">حفظ</button>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">السجل</h3>
              {data.events.length ? (
                <ol className="flex flex-col gap-2 border-r border-line pr-3">
                  {data.events.map((e) => (
                    <li key={e.id}>
                      <div className="text-tiny text-faint">{when(e.at)} · {e.admin}</div>
                      <div>{e.type === 'payment' ? <span className="font-medium text-success">دفعة</span> : e.type === 'freeze-date' ? <span className="font-medium text-warn">موعد التجميد</span> : e.type === 'status' ? <span className={`font-medium ${STATUS_COLOR[e.status as SubscriberStatus] || ''}`}>{STATUS_LABEL[e.status as SubscriberStatus] || e.status}</span> : <span className="text-muted">ملاحظة</span>}{e.text ? ` · ${e.text}` : ''}</div>
                    </li>
                  ))}
                </ol>
              ) : <span className="text-faint">لا أحداث بعد.</span>}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
