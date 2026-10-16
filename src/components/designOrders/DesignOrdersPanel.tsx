// «طلبات التصميم»: the orders an account made as a customer and got as a designer, each with its status
// and its messages (Eyad, 14 Oct). Talking opens once the Weelink office has the money; the designer says
// when the work is delivered, the customer confirms it (and the office then pays the designer) or opens a
// complaint. Messages carry no phone number, email or link (the server refuses them).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Send, Star, X } from 'lucide-react';
import {
  CAN_TALK, DesignOrder, OrderMessage, STATUS_LABEL,
  cancelOrder, confirmOrder, quoteOrder, deliverOrder, disputeOrder, orderErrorText, rateOrder, sendOrderMessage, subscribeMessages, subscribeMyOrders,
} from '../../services/designOrders';
import { accessErrorText, accessStatus, issueAccessCode, restorePage, revokeAccessCode } from '../../services/designAccess';
import { contactKindsIn, CONTACT_KIND_LABEL } from '../../utils/contactCheck';
import { formatPounds } from '../../data/plans';
import timers from '../../data/designOrderTimers.json';

interface Props {
  user: User;
  initialOrderId?: string;
  // Designer mode only: opens the customer's page in the editor with the code (resolves to an error text).
  onEnterClientPage?: (orderId: string, code: string) => Promise<{ ok: boolean; message: string }>;
  onClose: () => void;
}

const when = (ms: number) => (ms ? new Date(ms).toLocaleString('ar-SY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
const shortId = (id: string) => id.slice(0, 6).toUpperCase();
const badge = (s: DesignOrder['status']) =>
  s === 'paid_out' || s === 'confirmed' ? 'bg-success/10 text-success'
    : s === 'cancelled' || s === 'refunded' ? 'bg-bg text-muted'
    : s === 'disputed' ? 'bg-danger/10 text-danger'
    : 'bg-warn/10 text-warn';

const Thread: React.FC<{ user: User; order: DesignOrder; me: 'customer' | 'designer' }> = ({ user, order, me }) => {
  const [rows, setRows] = useState<OrderMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => subscribeMessages(order.id, setRows), [order.id]);
  useEffect(() => endRef.current?.scrollIntoView({ block: 'end' }), [rows.length]);

  const contact = contactKindsIn(text);
  const canTalk = CAN_TALK.includes(order.status);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || contact.length) return;
    setBusy(true);
    setError('');
    try {
      await sendOrderMessage(user, order.id, text.trim());
      setText('');
    } catch (err) {
      setError(orderErrorText(err));
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-card border border-line bg-bg p-3 h-64 overflow-y-auto space-y-2" aria-live="polite">
        {rows.length === 0 && <p className="text-sm text-faint text-center pt-10">{canTalk ? 'ابدأ المحادثة.' : 'تُفتح المحادثة بعد أن يؤكّد المكتب استلام المبلغ.'}</p>}
        {rows.map((m) => m.role === 'system' ? (
          <p key={m.id} className="text-xs text-muted text-center leading-relaxed">{m.text}</p>
        ) : (
          <div key={m.id} className={`flex ${m.role === me ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] rounded-card px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${m.role === me ? 'bg-brand text-white' : 'bg-surface border border-line'}`}>
              {m.text}
              <div className={`text-[11px] mt-1 ${m.role === me ? 'text-white/70' : 'text-faint'}`}>{when(m.at)}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {canTalk && (
        <form onSubmit={send} className="space-y-1.5">
          <div className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="اكتب رسالة…" className="flex-1 h-11 px-3 rounded-ctl border border-line bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
            <button type="submit" disabled={busy || !text.trim() || contact.length > 0} aria-label="إرسال" className="w-11 h-11 rounded-ctl bg-brand hover:bg-brand-hover text-white flex items-center justify-center disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          {contact.length > 0 && <p role="alert" className="text-xs font-bold text-danger">ممنوع كتابة {contact.map((k) => CONTACT_KIND_LABEL[k]).join(' أو ')}: التواصل يتم هنا داخل Weelink.</p>}
          {error && <p role="alert" className="text-xs font-bold text-danger">{error}</p>}
        </form>
      )}
    </div>
  );
};

const Stars: React.FC<{ value: number; onPick?: (n: number) => void }> = ({ value, onPick }) => (
  <span className="inline-flex gap-0.5" role={onPick ? 'radiogroup' : 'img'} aria-label={`${value} من 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" disabled={!onPick} onClick={() => onPick?.(n)} aria-label={`${n}`} className={`${onPick ? 'cursor-pointer' : 'cursor-default'} ${n <= value ? 'text-warn' : 'text-line'}`}><Star size={onPick ? 24 : 16} className={n <= value ? 'fill-current' : ''} /></button>
    ))}
  </span>
);

// After the customer confirmed the work: 1–5 stars and an optional line, once. Only paid orders can be rated.
const RatingBox: React.FC<{ user: User; order: DesignOrder; me: 'customer' | 'designer' }> = ({ user, order, me }) => {
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (order.status !== 'confirmed' && order.status !== 'paid_out') return null;
  if (order.rating) {
    return (
      <div className="rounded-card border border-line bg-bg p-3 space-y-1">
        <div className="flex items-center gap-2 text-sm font-bold">{me === 'customer' ? 'تقييمك' : 'تقييم الزبون'} <Stars value={order.rating.stars} /></div>
        {order.rating.text && <p className="text-sm text-muted whitespace-pre-wrap">{order.rating.text}</p>}
      </div>
    );
  }
  if (me === 'designer') return <p className="text-sm text-muted">لم يقيّم الزبون هذا الطلب بعد.</p>;
  const contact = contactKindsIn(note);
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await rateOrder(user, order.id, stars, note.trim());
    } catch (err) {
      setError(orderErrorText(err));
    }
    setBusy(false);
  };
  return (
    <div className="rounded-card border border-brand/30 bg-brand/5 p-3 space-y-2">
      <p className="text-sm font-bold">كيف كان عمل {order.designerName}؟</p>
      <Stars value={stars} onPick={setStars} />
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder="تعليق اختياري" className="w-full rounded-ctl border border-line bg-surface p-3 text-sm outline-none focus:border-brand" />
      {contact.length > 0 && <p role="alert" className="text-xs font-bold text-danger">ممنوع كتابة {contact.map((k) => CONTACT_KIND_LABEL[k]).join(' أو ')}.</p>}
      {error && <p role="alert" className="text-xs font-bold text-danger">{error}</p>}
      <button type="button" disabled={busy || stars < 1 || contact.length > 0} onClick={submit} className="h-10 px-4 rounded-ctl bg-brand hover:bg-brand-hover text-white text-sm font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5">{busy && <Loader2 size={14} className="animate-spin" />} أرسل التقييم</button>
    </div>
  );
};

const dayTime = (ms: number) => new Date(ms).toLocaleString('ar-SY', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// The three-day code that lets the hired designer into the customer's page. The customer makes it (it is
// shown once, to be told to the designer) and can withdraw it; the designer types it in to open the page.
const AccessBox: React.FC<{ user: User; order: DesignOrder; me: 'customer' | 'designer'; onEnter?: Props['onEnterClientPage'] }> = ({ user, order, me, onEnter }) => {
  const [status, setStatus] = useState<{ active: boolean; expiresAt: number; backupAt?: number } | null>(null);
  const [restored, setRestored] = useState(false);
  const [code, setCode] = useState('');
  const [fresh, setFresh] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const open = order.status === 'paid' || order.status === 'delivered';
  const hasBackup = me === 'customer' && !!status?.backupAt;
  useEffect(() => {
    if (!open && me !== 'customer') return;
    accessStatus(user, order.id).then(setStatus).catch(() => setStatus({ active: false, expiresAt: 0 }));
  }, [user, order.id, open, me]);
  if (!open && !hasBackup) return null;
  const btn = 'h-10 px-4 rounded-ctl text-sm font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5';
  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error && (e as { code?: string }).code === 'x' ? e.message : accessErrorText(e));
    }
    setBusy('');
  };

  if (me === 'customer') {
    return (
      <div className="rounded-card border border-line bg-bg p-3 space-y-2 text-sm leading-relaxed">
        <p className="font-bold inline-flex items-center gap-1.5"><KeyRound size={15} /> دخول المصمم إلى مشروعك</p>
        {open && <p className="text-muted">لو أردت أن يعدّل المصمم مشروعك بنفسه، أعطه رمزاً يعمل 3 أيام. يعدّل تصميم المشروع فقط ولا يرى بياناتك ولا زبائنك ولا طلباتك. تُحفظ نسخة من مشروعك قبل أول تعديل، وتسحب الرمز متى شئت.</p>}
        {fresh && (
          <div className="rounded-ctl border border-brand/40 bg-surface p-3">
            <div className="text-xs text-muted">الرمز (يظهر مرة واحدة: أعطه للمصمم داخل المحادثة)</div>
            <div dir="ltr" className="text-heading font-bold tracking-widest select-all">{fresh}</div>
          </div>
        )}
        {status?.active && !fresh && <p className="text-success font-bold">الرمز فعّال حتى {dayTime(status.expiresAt)}.</p>}
        {open && <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!!busy} onClick={() => run('issue', async () => { const r = await issueAccessCode(user, order.id); setFresh(r.code); setStatus({ active: true, expiresAt: r.expiresAt }); })} className={`${btn} bg-brand hover:bg-brand-hover text-white`}>{busy === 'issue' && <Loader2 size={14} className="animate-spin" />} {status?.active ? 'رمز جديد (يلغي القديم)' : 'أنشئ رمز دخول'}</button>
          {status?.active && <button type="button" disabled={!!busy} onClick={() => run('revoke', async () => { await revokeAccessCode(user, order.id); setFresh(''); setStatus({ active: false, expiresAt: 0 }); })} className={`${btn} border border-line bg-surface text-danger`}>سحب الرمز</button>}
        </div>}
        {hasBackup && !status?.active && (
          <div className="border-t border-line pt-2 space-y-1.5">
            <p className="text-muted">عدّل المصمم مشروعك ولم يعجبك؟ تُحفظ نسخة من مشروعك كما كانت قبل دخوله ({dayTime(status!.backupAt!)}).</p>
            {restored ? <p className="text-success font-bold">رجعت مشروعك كما كانت. افتح مشروعك من جديد لترى النتيجة.</p> : (
              <button type="button" disabled={!!busy} onClick={() => { if (window.confirm('ترجيع مشروعك كما كانت قبل دخول المصمم؟ تعديلاته ستُحذف من مشروعك.')) run('restore', async () => { await restorePage(user, order.id); setRestored(true); }); }} className={`${btn} border border-line bg-surface text-danger`}>{busy === 'restore' && <Loader2 size={14} className="animate-spin" />} استرجع صفحتي كما كانت</button>
            )}
          </div>
        )}
        {error && <p role="alert" className="text-xs font-bold text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-bg p-3 space-y-2 text-sm leading-relaxed">
      <p className="font-bold inline-flex items-center gap-1.5"><KeyRound size={15} /> الدخول إلى صفحة الزبون</p>
      {!status?.active ? (
        <p className="text-muted">لم يعطك الزبون رمز دخول بعد (أو انتهى). اطلبه منه في المحادثة إن احتجت تعدّل صفحته بنفسك.</p>
      ) : onEnter ? (
        <>
          <p className="text-muted">الرمز فعّال حتى {dayTime(status.expiresAt)}. ستعدّل التصميم فقط.</p>
          <div className="flex flex-wrap gap-2">
            <input dir="ltr" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={19} placeholder="XXXX-XXXX-XXXX-XXXX" className="h-10 px-3 rounded-ctl border border-line bg-surface text-sm tracking-widest outline-none focus:border-brand w-60" />
            <button type="button" disabled={!!busy || code.replace(/[^A-Z0-9]/g, '').length !== 16} onClick={() => run('enter', async () => { const r = await onEnter(order.id, code); if (!r.ok) throw Object.assign(new Error(r.message), { code: 'x' }); })} className={`${btn} bg-brand hover:bg-brand-hover text-white`}>{busy === 'enter' && <Loader2 size={14} className="animate-spin" />} افتح صفحة الزبون</button>
          </div>
        </>
      ) : <p className="text-muted">الرمز فعّال حتى {dayTime(status.expiresAt)}. افتح «وضع المصمم» من الصفحة الرئيسية لتدخل بالرمز.</p>}
      {error && <p role="alert" className="text-xs font-bold text-danger">{error}</p>}
    </div>
  );
};

const OrderDetail: React.FC<{ user: User; order: DesignOrder; me: 'customer' | 'designer'; onEnter?: Props['onEnterClientPage'] }> = ({ user, order, me, onEnter }) => {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [complaint, setComplaint] = useState<string | null>(null);
  const [payInfo, setPayInfo] = useState('');
  useEffect(() => {
    if (me !== 'customer' || order.status !== 'awaiting_payment') return;
    quoteOrder(user).then((q) => setPayInfo(q.paymentInfo)).catch(() => {});
  }, [user, me, order.status]);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError('');
    try {
      await fn();
      setComplaint(null);
    } catch (err) {
      setError(orderErrorText(err));
    }
    setBusy('');
  };
  const btn = 'h-10 px-4 rounded-ctl text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-wait inline-flex items-center gap-1.5';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-heading font-bold">طلب #{shortId(order.id)}</h3>
        <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${badge(order.status)}`}>{STATUS_LABEL[order.status]}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">{me === 'customer' ? 'المصمم' : 'الزبون'}</dt><dd className="font-bold">{me === 'customer' ? order.designerName : order.customerAlias}</dd>
        {order.slideName && <><dt className="text-muted">أعجبه تصميم</dt><dd>{order.slideName}</dd></>}
        {me === 'customer'
          ? <><dt className="text-muted">السعر</dt><dd className="font-bold tabular-nums">{formatPounds(order.price)}</dd></>
          : <><dt className="text-muted">حصتك</dt><dd className="font-bold tabular-nums">{formatPounds(order.designerShare)} <span className="text-xs text-faint font-normal">(بعد حصة المنصة)</span></dd></>}
        <dt className="text-muted">طلبه</dt><dd className="whitespace-pre-wrap leading-relaxed">{order.brief}</dd>
      </dl>

      {order.status === 'awaiting_payment' && (
        <div className="rounded-card border border-warn/30 bg-warn/5 p-3 space-y-2 text-sm leading-relaxed">
          {me === 'customer' ? (
            <>
              <p>ادفع <b>{formatPounds(order.price)}</b> لمكتب Weelink وقل لهم رقم الطلب <b dir="ltr">{shortId(order.id)}</b>. يبقى المبلغ عند المكتب إلى أن تستلم التصميم، وتُفتح المحادثة مع المصمم فور تأكيد المكتب استلامه.</p>
              {payInfo && <p className="rounded-ctl border border-line bg-surface p-2.5 whitespace-pre-wrap">{payInfo}</p>}
              <button type="button" disabled={!!busy} onClick={() => run('cancel', () => cancelOrder(user, order.id))} className={`${btn} border border-line bg-surface text-danger`}>{busy === 'cancel' && <Loader2 size={14} className="animate-spin" />} إلغاء الطلب</button>
            </>
          ) : <p>الطلب بانتظار أن يدفع الزبون للمكتب. تُفتح المحادثة بعد تأكيد المكتب استلام المبلغ.</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {me === 'designer' && order.status === 'paid' && (
        <button type="button" disabled={!!busy} onClick={() => run('deliver', () => deliverOrder(user, order.id))} className={`${btn} bg-brand hover:bg-brand-hover text-white`}>{busy === 'deliver' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />} سلّمت العمل</button>
      )}
      {me === 'customer' && order.status === 'delivered' && (
        <button type="button" disabled={!!busy} onClick={() => run('confirm', () => confirmOrder(user, order.id))} className={`${btn} bg-success text-white hover:opacity-90`}>{busy === 'confirm' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />} استلمت التصميم</button>
      )}
      {me === 'customer' && (order.status === 'paid' || order.status === 'delivered') && (complaint === null ? (
        <button type="button" onClick={() => setComplaint('')} className="text-sm font-bold text-danger cursor-pointer">لدي مشكلة في هذا الطلب</button>
      ) : (
        <div className="space-y-2 w-full">
          <textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} rows={3} maxLength={500} placeholder="اشرح المشكلة (يراجعها فريق Weelink)" className="w-full rounded-ctl border border-line bg-surface p-3 text-sm outline-none focus:border-brand" />
          <div className="flex gap-2">
            <button type="button" disabled={!!busy || complaint.trim().length < 5} onClick={() => run('dispute', () => disputeOrder(user, order.id, complaint.trim()))} className={`${btn} bg-danger text-white hover:opacity-90`}>{busy === 'dispute' && <Loader2 size={14} className="animate-spin" />} أرسل الشكوى</button>
            <button type="button" onClick={() => setComplaint(null)} className={`${btn} text-muted`}>تراجع</button>
          </div>
        </div>
      ))}
      </div>
      {order.status === 'delivered' && (
        <p className="text-xs text-muted leading-relaxed">
          {me === 'customer'
            ? `إن لم تؤكد الاستلام أو تفتح شكوى خلال ${timers.autoConfirmDays} أيام من التسليم${order.deliveredAt ? ` (قبل ${new Date(order.deliveredAt + timers.autoConfirmDays * 86400000).toLocaleDateString('ar-SY', { day: 'numeric', month: 'long' })})` : ''} يُعتبر الطلب مستلَماً تلقائياً.`
            : `إن لم يردّ الزبون خلال ${timers.autoConfirmDays} أيام من التسليم يُعتبر الطلب مستلَماً تلقائياً.`}
        </p>
      )}
      {order.status === 'awaiting_payment' && me === 'customer' && <p className="text-xs text-muted">يُلغى الطلب تلقائياً إن لم يُدفع خلال {timers.unpaidCancelDays} أيام.</p>}
      {order.status === 'disputed' && order.disputeReason && <p className="text-sm text-danger leading-relaxed">الشكوى: {order.disputeReason}</p>}
      {error && <p role="alert" className="text-sm font-bold text-danger flex items-start gap-1.5"><AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}</p>}

      <AccessBox user={user} order={order} me={me} onEnter={onEnter} />

      <RatingBox user={user} order={order} me={me} />

      <Thread user={user} order={order} me={me} />
    </div>
  );
};

export const DesignOrdersPanel: React.FC<Props> = ({ user, initialOrderId, onEnterClientPage, onClose }) => {
  const [mine, setMine] = useState<DesignOrder[] | null>(null);
  const [theirs, setTheirs] = useState<DesignOrder[]>([]);
  const [role, setRole] = useState<'customer' | 'designer'>('customer');
  const [openId, setOpenId] = useState(initialOrderId || '');
  useEffect(() => subscribeMyOrders(user.uid, (a, b) => { setMine(a); setTheirs(b); }), [user.uid]);

  // The order shown decides which side is «me»; with none open, the side that has orders.
  const all = useMemo(() => [...(mine || []).map((o) => ({ o, me: 'customer' as const })), ...theirs.map((o) => ({ o, me: 'designer' as const }))], [mine, theirs]);
  const current = all.find((x) => x.o.id === openId) || null;
  useEffect(() => {
    if (!openId && mine && mine.length === 0 && theirs.length > 0) setRole('designer');
  }, [mine, theirs, openId]);
  const list = role === 'customer' ? mine || [] : theirs;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl" role="dialog" aria-modal="true" aria-label="طلبات التصميم" onClick={onClose}>
      <div className="w-full sm:max-w-3xl max-h-[94vh] overflow-y-auto rounded-t-card sm:rounded-card bg-surface border border-line" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line sticky top-0 bg-surface z-10">
          <h2 className="text-heading font-bold">طلبات التصميم</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-ctl flex items-center justify-center text-muted hover:text-ink hover:bg-bg cursor-pointer"><X size={18} /></button>
        </div>
        <div className="p-5">
          {mine === null ? (
            <div className="flex justify-center py-10 text-faint"><Loader2 size={20} className="animate-spin" /></div>
          ) : current ? (
            <div className="space-y-4">
              <button type="button" onClick={() => setOpenId('')} className="text-sm font-bold text-brand cursor-pointer">← كل الطلبات</button>
              <OrderDetail key={current.o.id} user={user} order={current.o} me={current.me} onEnter={onEnterClientPage} />
            </div>
          ) : (
            <div className="space-y-4">
              {theirs.length > 0 && (
                <div className="inline-flex rounded-ctl border border-line bg-surface p-0.5" role="group">
                  {([['customer', `طلباتي كزبون (${(mine || []).length})`], ['designer', `طلبات وصلتني كمصمم (${theirs.length})`]] as ['customer' | 'designer', string][]).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setRole(id)} aria-pressed={role === id} className={`h-9 px-3 rounded-[10px] text-xs font-bold cursor-pointer ${role === id ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{label}</button>
                  ))}
                </div>
              )}
              {list.length === 0 ? (
                <p className="text-sm text-muted text-center py-10">ما في طلبات بعد. اطلب مصمماً من «تصميمات مصممينا».</p>
              ) : (
                <ul className="space-y-2">
                  {list.map((o) => (
                    <li key={o.id}>
                      <button type="button" onClick={() => setOpenId(o.id)} className="w-full text-right rounded-card border border-line hover:border-brand/40 bg-surface p-3 flex items-center gap-3 cursor-pointer">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm truncate">#{shortId(o.id)} · {role === 'customer' ? o.designerName : o.customerAlias}</div>
                          <div className="text-xs text-muted truncate">{o.brief}</div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${badge(o.status)}`}>{STATUS_LABEL[o.status]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
