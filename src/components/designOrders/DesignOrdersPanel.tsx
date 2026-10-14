// «طلبات التصميم»: the orders an account made as a customer and got as a designer, each with its status
// and its messages (Eyad, 14 Oct). Talking opens once the Weelink office has the money; the designer says
// when the work is delivered, the customer confirms it (and the office then pays the designer) or opens a
// complaint. Messages carry no phone number, email or link (the server refuses them).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { AlertCircle, CheckCircle2, Loader2, Send, X } from 'lucide-react';
import {
  CAN_TALK, DesignOrder, OrderMessage, STATUS_LABEL,
  cancelOrder, confirmOrder, deliverOrder, disputeOrder, orderErrorText, sendOrderMessage, subscribeMessages, subscribeMyOrders,
} from '../../services/designOrders';
import { contactKindsIn, CONTACT_KIND_LABEL } from '../../utils/contactCheck';
import { formatPounds } from '../../data/plans';

interface Props {
  user: User;
  initialOrderId?: string;
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

const OrderDetail: React.FC<{ user: User; order: DesignOrder; me: 'customer' | 'designer' }> = ({ user, order, me }) => {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [complaint, setComplaint] = useState<string | null>(null);

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
      {order.status === 'disputed' && order.disputeReason && <p className="text-sm text-danger leading-relaxed">الشكوى: {order.disputeReason}</p>}
      {error && <p role="alert" className="text-sm font-bold text-danger flex items-start gap-1.5"><AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}</p>}

      <Thread user={user} order={order} me={me} />
    </div>
  );
};

export const DesignOrdersPanel: React.FC<Props> = ({ user, initialOrderId, onClose }) => {
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
              <OrderDetail key={current.o.id} user={user} order={current.o} me={current.me} />
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
