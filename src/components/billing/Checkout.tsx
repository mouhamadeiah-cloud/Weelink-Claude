// The invoice before a paid project is published (server/billing.ts has the whole flow): the package
// and the bigger ones the customer could take instead, monthly or yearly, a restaurant's extra devices,
// then how they paid (a transfer's number or a photo of its receipt). Sent, it waits «قيد الفحص» until
// the Weelink team confirms it; only then can the project be published. Paid online (Stripe, when it is
// set up) there is nothing to send: the customer goes to Stripe's page and the payment approves itself.
import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { CheckCircle2, Clock, CreditCard, ImagePlus, Loader2, Minus, Plus, Receipt, Trash2, XCircle } from 'lucide-react';
import { kindOf } from '../../utils/projectKeys';
import { formatPounds, EXTRA_DEVICE } from '../../data/plans';
import { MAX_DEVICES } from '../../utils/invoice';
import {
  PAY_WAYS, attachProof, billingErrorText, payOnline, chosenPlanOf, createOrder, invoiceFor, paidPlansOf, payWayName, shrinkReceipt,
  type BillingOrder, type Period,
} from '../../services/billing';
import { fetchMyAccount } from '../../services/myAccount';
import { ITEM_WORD, limitsOf, smallestFitting } from '../../utils/planLimits';

interface CheckoutProps {
  user: User;
  owner: string;
  project: string;
  siteName?: string;
  // Set when the project already has a paid period (a renewal).
  paidUntil?: number;
  onOrder?: (order: BillingOrder) => void;
  // What the project holds now: a package too small for its items can't be picked, and a restaurant
  // pays for the active devices its package doesn't include (src/utils/planLimits.ts).
  used?: { items: number; devices: number };
}

const dateText = (t: number) => (t ? new Date(t).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' }) : '—');
const inputCls = 'h-11 w-full rounded-ctl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand';

export const Checkout: React.FC<CheckoutProps> = ({ user, owner, project, siteName, paidUntil, onOrder, used }) => {
  const plans = useMemo(() => paidPlansOf(project), [project]);
  const items = used?.items || 0;
  const fits = (id: string) => limitsOf(id).items >= items;
  const [plan, setPlan] = useState(() => {
    const picked = chosenPlanOf(owner, project);
    return fits(picked) ? picked : smallestFitting(plans.map((p) => p.id), items) || picked;
  });
  const [period, setPeriod] = useState<Period>('monthly');
  const [devices, setDevices] = useState(0);
  const [way, setWay] = useState('syriatel');
  const [transferNo, setTransferNo] = useState('');
  const [image, setImage] = useState('');
  const [order, setOrder] = useState<BillingOrder | null | undefined>(undefined);
  const [payInfo, setPayInfo] = useState('');
  const [online, setOnline] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<'' | 'send' | 'later' | 'image'>('');
  const [error, setError] = useState('');

  // The open invoice of this project, if one was already sent, and how to pay the office.
  useEffect(() => {
    let alive = true;
    fetchMyAccount(user)
      .then((a) => {
        if (!alive) return;
        const open = a.orders.find((o) => o.project === project) || null;
        setOrder(open);
        setPayInfo(a.paymentInfo);
        setOnline(!!a.online);
        if (open) {
          setPlan(open.plan);
          setPeriod(open.period);
          setDevices(open.devices);
          if (open.way) setWay(open.way);
          setTransferNo(open.transferNo);
        }
      })
      .catch(() => alive && setOrder(null));
    return () => {
      alive = false;
    };
  }, [user, project]);

  // The active devices the package doesn't include are paid as extras.
  const needDevices = Math.max(0, (used?.devices || 0) - limitsOf(plan).devices);
  useEffect(() => { if (devices < needDevices) setDevices(needDevices); }, [devices, needDevices]);
  const invoice = invoiceFor(project, plan, period, Math.max(devices, needDevices));
  const restaurant = kindOf(project) === 'restaurant';
  const current = plans.find((p) => p.id === plan);

  const pickImage = async (file?: File) => {
    if (!file) return;
    setBusy('image');
    setError('');
    try {
      setImage(await shrinkReceipt(file));
    } catch {
      setError(billingErrorText('bad-image'));
    }
    setBusy('');
  };

  // The invoice is sent again only when the package, period or devices changed.
  const ensureOrder = async () => {
    if (order && order.plan === plan && order.period === period && order.devices === devices) return order;
    const r = await createOrder(user, { project, plan, period, devices, siteName });
    return r.order;
  };

  // Online: the invoice is saved, then the browser goes to Stripe and comes back here.
  const payNow = async () => {
    if (!invoice) return;
    setBusy('send');
    setError('');
    try {
      const next = await ensureOrder();
      setOrder(next);
      const r = await payOnline(user, { id: next.id, returnUrl: window.location.href });
      window.location.assign(r.url);
      return;
    } catch (e) {
      setError(billingErrorText((e as Error).message));
    }
    setBusy('');
  };

  const send = async (later: boolean) => {
    if (!invoice) return;
    if (!later && !transferNo.trim() && !image && !order?.hasImage) return setError(billingErrorText('no-proof'));
    setBusy(later ? 'later' : 'send');
    setError('');
    try {
      let next = await ensureOrder();
      if (!later) next = (await attachProof(user, { id: next.id, way, transferNo: transferNo.trim(), image })).order;
      setOrder(next);
      setImage('');
      setEditing(false);
      onOrder?.(next);
    } catch (e) {
      setError(billingErrorText((e as Error).message));
    }
    setBusy('');
  };

  if (order === undefined) return <div className="py-6 flex justify-center"><Loader2 size={22} className="animate-spin text-brand" /></div>;

  // Sent: it waits for the team.
  if (order?.status === 'attached' && !editing) {
    return (
      <div className="space-y-3">
        <div className="rounded-card bg-[#fff4e6] p-4 text-sm text-[#7a3d00] flex gap-2.5">
          <Clock size={18} className="shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-black">إشعار الدفع قيد الفحص</p>
            <p>وصل إشعارك ({payWayName(order.way)}{order.transferNo ? ` · ${order.transferNo}` : ''}{order.hasImage ? ' · مع صورة' : ''}). أول ما يأكده فريق Weelink بيوصلك إيميل، وبتقدر تنشر مشروعك.</p>
          </div>
        </div>
        <InvoiceTable items={order.items} total={order.total} />
        <button type="button" onClick={() => setEditing(true)} className="text-xs font-bold text-muted underline hover:text-ink">تعديل الإشعار أو الباقة</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {order?.status === 'rejected' && (
        <div className="rounded-card bg-danger/10 p-3 text-sm text-danger flex gap-2">
          <XCircle size={17} className="shrink-0 mt-0.5" />
          <span><b>ما قدرنا نأكد الإشعار السابق.</b>{order.rejectReason ? ` السبب: ${order.rejectReason}` : ''} ارفع إشعار جديد.</span>
        </div>
      )}
      <p className="text-sm text-muted leading-relaxed">
        {paidUntil && paidUntil > Date.now()
          ? `مشروعك صالح لحد ${dateText(paidUntil)}. التجديد بينضاف على آخر المدة.`
          : 'هالمشروع بباقة مدفوعة، فبينشر بعد ما ندفع فاتورته ويأكدها فريق Weelink. المدة بتبلش من يوم التأكيد.'}
      </p>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-muted">الباقة</span>
          <div className="inline-flex rounded-full border border-line bg-surface p-0.5 text-xs font-bold">
            {(['monthly', 'yearly'] as Period[]).map((p) => (
              <button key={p} type="button" onClick={() => setPeriod(p)} className={`rounded-full px-3 py-1 ${period === p ? 'bg-brand text-white' : 'text-muted'}`}>
                {p === 'monthly' ? 'شهري' : 'سنوي (وفّر 10%)'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {plans.map((p) => {
            const on = p.id === plan;
            const bigger = current && p.monthly > current.monthly;
            const small = !fits(p.id);
            return (
              <button key={p.id} type="button" disabled={small} onClick={() => setPlan(p.id)} className={`rounded-card border p-3 text-right transition disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'border-brand bg-brand/5 ring-2 ring-brand/15' : 'border-line bg-surface hover:border-brand/40'}`}>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black">{p.name}</span>
                  {on ? <CheckCircle2 size={16} className="text-brand" /> : bigger ? <span className="text-[11px] font-bold text-brand">ترقية</span> : null}
                </span>
                <span className="mt-0.5 block text-xs font-bold tabular-nums">{formatPounds(invoiceFor(project, p.id, period)?.items[0].amount || 0)}</span>
                <ul className="mt-2 space-y-0.5 text-[11px] text-muted leading-snug">
                  {p.features.slice(0, 4).map((f) => <li key={f}>• {f}</li>)}
                </ul>
                {small && <span className="mt-1.5 block text-[11px] font-bold text-danger">عندك {items} {ITEM_WORD[kindOf(project)]}، وهي بتسمح بـ {limitsOf(p.id).items}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {restaurant && (
        <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-3">
          <div>
            <p className="text-sm font-bold">أجهزة إضافية</p>
            <p className="text-xs text-muted">كاشير، مطبخ، بار أو جرسون: {formatPounds(EXTRA_DEVICE)} بالشهر للجهاز</p>
            {needDevices > 0 && <p className="text-xs font-bold text-muted">عندك {used?.devices} أجهزة شغّالة، والباقة فيها {limitsOf(plan).devices}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="أقل" disabled={devices <= needDevices} onClick={() => setDevices(devices - 1)} className="h-8 w-8 rounded-full border border-line flex items-center justify-center disabled:opacity-40"><Minus size={14} /></button>
            <span className="w-6 text-center text-sm font-black tabular-nums">{devices}</span>
            <button type="button" aria-label="أكتر" disabled={devices >= MAX_DEVICES} onClick={() => setDevices(devices + 1)} className="h-8 w-8 rounded-full border border-line flex items-center justify-center disabled:opacity-40"><Plus size={14} /></button>
          </div>
        </div>
      )}

      {invoice && <InvoiceTable items={invoice.items} total={invoice.total} />}

      <div>
        <span className="mb-2 block text-xs font-bold text-muted">طريقة الدفع</span>
        <div className="flex flex-wrap gap-2">
          {PAY_WAYS.filter((w) => !w.online || online).map((w) => (
            <button
              key={w.id}
              type="button"
              disabled={w.soon}
              onClick={() => setWay(w.id)}
              className={`h-9 rounded-full border px-3.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${way === w.id ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink hover:border-brand/40'}`}
            >
              {w.name}{w.soon ? ' (قريباً)' : ''}
            </button>
          ))}
        </div>
        {payInfo && <p className="mt-3 whitespace-pre-line rounded-card bg-bg p-3 text-xs leading-relaxed text-ink">{payInfo}</p>}
      </div>

      {way === 'online' ? (
        <p className="text-xs text-muted leading-relaxed">بتنفتح صفحة دفع آمنة من Stripe بنفس المبلغ بالعملة الأجنبية. بعد الدفع بترجع لهون وبيتأكد الدفع لحاله.</p>
      ) : (
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted">رقم الحوالة أو العملية</span>
          <input className={inputCls} dir="ltr" value={transferNo} onChange={(e) => setTransferNo(e.target.value)} placeholder="123456789" />
        </label>
        <div>
          <span className="mb-1 block text-xs font-bold text-muted">أو صورة الإشعار</span>
          {image ? (
            <div className="flex items-center gap-2">
              <img src={image} alt="صورة الإشعار" className="h-11 w-11 rounded-ctl border border-line object-cover" />
              <span className="flex-1 text-xs font-bold text-[#1d6b34]">تم اختيار الصورة</span>
              <button type="button" onClick={() => setImage('')} aria-label="إزالة الصورة" className="h-9 w-9 rounded-ctl text-muted hover:text-danger flex items-center justify-center"><Trash2 size={15} /></button>
            </div>
          ) : (
            <label className="h-11 rounded-ctl border border-dashed border-line bg-surface px-3 text-xs font-bold text-muted inline-flex w-full items-center justify-center gap-1.5 cursor-pointer hover:border-brand/40">
              {busy === 'image' ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
              {order?.hasImage ? 'تغيير الصورة المرفوعة' : 'ارفع صورة'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
            </label>
          )}
        </div>
      </div>
      )}

      {error && <p className="text-xs font-bold text-danger">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={!!busy || !invoice} onClick={() => (way === 'online' ? payNow() : send(false))} className="h-12 w-full sm:flex-1 rounded-ctl bg-brand text-base font-black text-white hover:bg-brand-hover disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {busy === 'send' ? <Loader2 size={18} className="animate-spin" /> : way === 'online' ? <CreditCard size={18} /> : <Receipt size={18} />} {way === 'online' ? 'ادفع هلق' : 'أرسل إشعار الدفع'}
        </button>
        {(!order || order.status === 'unpaid') && (
          <button type="button" disabled={!!busy || !invoice} onClick={() => send(true)} className="h-12 rounded-ctl border border-line bg-surface px-4 text-sm font-bold text-muted hover:text-ink disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {busy === 'later' && <Loader2 size={16} className="animate-spin" />} {order ? 'الفاتورة محفوظة' : 'احفظ الفاتورة وادفع بعدين'}
          </button>
        )}
      </div>
      {!paidUntil && (
        <p className="text-xs text-muted leading-relaxed">
          {order?.deleteAt
            ? `إذا ما اندفعت الفاتورة لحد ${dateText(order.deleteAt)} بينحذف المشروع.`
            : 'إذا ما اندفعت الفاتورة خلال شهرين بينحذف المشروع.'}
          {' '}الفاتورة وإشعار الدفع موجودين كمان بصفحة «حسابي».
        </p>
      )}
    </div>
  );
};

const InvoiceTable: React.FC<{ items: { label: string; amount: number }[]; total: number }> = ({ items, total }) => (
  <div className="rounded-card border border-line bg-surface p-3 text-sm">
    {items.map((i) => (
      <div key={i.label} className="flex justify-between gap-3 py-1">
        <span>{i.label}</span>
        <span className="tabular-nums whitespace-nowrap">{i.amount ? formatPounds(i.amount) : 'مجاناً'}</span>
      </div>
    ))}
    <div className="mt-1 flex justify-between gap-3 border-t border-line pt-2 font-black">
      <span>المجموع</span>
      <span className="tabular-nums whitespace-nowrap">{formatPounds(total)}</span>
    </div>
  </div>
);
