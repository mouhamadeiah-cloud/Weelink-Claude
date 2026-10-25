// الطلبات: the guests' orders, live from the website and the tables' QR codes, newest first and
// filtered by status. Each order shows its dishes with the guest's choices, the guest's details
// and the totals, and moves through جديد ← قيد التحضير ← جاهز ← تم التسليم (or ملغى); a delivered
// order adds its sale to the accounts. Orders kept on this device before the live orders could be
// reached are listed with them.
import React, { useState } from 'react';
import { Phone, MapPin, Bike, Store, Trash2, MessageCircle, Armchair } from 'lucide-react';
import { MenuOrder, ORDER_STATUSES, OrderStatus } from '../restaurantTypes';
import { describeLine } from '../menuCartStore';
import { deleteOrder, setOrderPayment, setOrderStatus, syncOrderLedger } from '../restaurantCloud';
import { Card, EmptyState, formatMoney } from '../../shop/adminUi';
import { whatsappHref } from '../../cars/carModel';
import { CloudNotice, RestaurantTabProps } from './shared';

const orderTime = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('ar-SY-u-nu-latn', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const orderPlace = (o: MenuOrder) => (o.type === 'table' ? `طاولة ${o.table}` : o.type === 'delivery' ? 'توصيل' : 'استلام');

// A Syrian number written as 09… becomes 9639… for WhatsApp.
const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.startsWith('00') ? d.slice(2) : d.startsWith('0') ? `963${d.slice(1)}` : d;
};

const isOpen = (o: MenuOrder) => o.status !== 'done' && o.status !== 'cancelled';

export const OrdersTab: React.FC<RestaurantTabProps> = ({ data, update, restaurantId, liveOrders }) => {
  const [filter, setFilter] = useState<OrderStatus | 'open' | 'all'>('open');
  const currency = data.settings.currency;
  // A local copy whose late cloud save went through anyway shows once, as the live order.
  const liveIds = new Set(liveOrders.items.map((o) => o.id));
  const localOnly = data.orders.filter((o) => !liveIds.has(o.id));
  const localIds = new Set(localOnly.map((o) => o.id));
  // The cashier's and waiters' own kitchen orders are followed on the kitchen screen and their bills.
  const all = [...liveOrders.items.filter((o) => o.source !== 'staff'), ...localOnly].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const list = all.filter((o) => (filter === 'all' ? true : filter === 'open' ? isOpen(o) : o.status === filter));

  const setStatus = (o: MenuOrder, status: OrderStatus) => {
    if (localIds.has(o.id)) {
      update((d) => ({ ...d, orders: d.orders.map((x) => (x.id === o.id ? { ...x, status } : x)) }));
      syncOrderLedger(restaurantId, o, status).catch(() => {});
    } else {
      setOrderStatus(restaurantId, o, status).catch((e) => console.warn('Could not update the order:', e));
    }
  };
  const setPayment = (o: MenuOrder, state: 'paid' | 'rejected') => {
    if (state === 'rejected' && !window.confirm('رفض الدفع رح يلغي الطلب. متأكد؟')) return;
    if (localIds.has(o.id)) {
      update((d) => ({ ...d, orders: d.orders.map((x) => (x.id === o.id && x.payment ? { ...x, payment: { ...x.payment, state }, ...(state === 'rejected' ? { status: 'cancelled' as const } : {}) } : x)) }));
    } else {
      setOrderPayment(restaurantId, o, state).catch((e) => console.warn('Could not update the payment:', e));
    }
  };
  const remove = (o: MenuOrder) => {
    if (!window.confirm('حذف هذا الطلب نهائيًا؟')) return;
    if (localIds.has(o.id)) update((d) => ({ ...d, orders: d.orders.filter((x) => x.id !== o.id) }));
    else deleteOrder(restaurantId, o.id).catch(() => {});
  };

  const filters: { id: typeof filter; label: string }[] = [
    { id: 'open', label: 'المفتوحة' },
    ...ORDER_STATUSES.map((s) => ({ id: s.id, label: s.label })),
    { id: 'all', label: 'الكل' },
  ];

  return (
    <div className="space-y-4">
      <CloudNotice error={liveOrders.error} />
      <div className="flex flex-wrap items-center gap-1.5">
        {filters.map((f) => {
          const n = f.id === 'all' ? all.length : f.id === 'open' ? all.filter(isOpen).length : all.filter((o) => o.status === f.id).length;
          return (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={`h-8 px-3 rounded-full text-xs font-bold border cursor-pointer ${filter === f.id ? 'bg-ink border-ink text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}>
              {f.label} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState text={all.length ? 'لا طلبات هنا.' : 'لم يصل أي طلب بعد. طلبات الموقع والطاولات تظهر هنا لحظة إرسالها.'} />
      ) : (
        list.map((o) => {
          const st = ORDER_STATUSES.find((s) => s.id === o.status)!;
          return (
            <Card key={o.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-black">طلب #{o.number}</span>
                <span className="h-6 px-2.5 rounded-full text-xs font-bold text-white inline-flex items-center" style={{ backgroundColor: st.color }}>{st.label}</span>
                <span className="h-6 px-2.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-600 inline-flex items-center gap-1">
                  {o.type === 'table' ? <Armchair size={12} /> : o.type === 'delivery' ? <Bike size={12} /> : <Store size={12} />}
                  {orderPlace(o)}
                </span>
                <span className="h-6 px-2.5 rounded-full text-xs font-bold bg-brand/10 text-brand inline-flex items-center">{o.source === 'qr' ? 'QR' : 'الموقع'}</span>
                {localIds.has(o.id) && <span className="h-6 px-2.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-500 inline-flex items-center">على هذا الجهاز</span>}
                <span className="mr-auto text-xs text-neutral-400 font-bold">{orderTime(o.createdAt)}</span>
              </div>
              <div className="grid md:grid-cols-[1fr_260px] gap-4">
                <div className="space-y-2">
                  {o.lines.map((l, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <span className="font-black">{l.qty} × {l.name}</span>
                        {describeLine(l) && <div className="text-xs text-neutral-500">{describeLine(l)}</div>}
                      </div>
                      <span className="font-bold shrink-0">{formatMoney(l.unitPrice * l.qty, currency)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-neutral-100 text-sm space-y-0.5">
                    {o.deliveryFee > 0 && <div className="flex justify-between text-neutral-500"><span>التوصيل</span><span>{formatMoney(o.deliveryFee, currency)}</span></div>}
                    <div className="flex justify-between font-black"><span>المجموع</span><span>{formatMoney(o.total, currency)}</span></div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs rounded-2xl bg-neutral-50 p-3">
                  <div className="font-black text-sm">{o.name || (o.type === 'table' ? `طاولة ${o.table}` : 'بدون اسم')}</div>
                  {o.phone && <a href={`tel:${o.phone}`} className="flex items-center gap-1.5 text-brand font-bold" dir="ltr"><Phone size={13} />{o.phone}</a>}
                  {o.phone && <a href={whatsappHref(waNumber(o.phone), `مرحبًا ${o.name}، بخصوص طلبك رقم ${o.number}`)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#2F9E44] font-bold"><MessageCircle size={13} />واتساب</a>}
                  {o.address && <div className="flex items-start gap-1.5 text-neutral-600"><MapPin size={13} className="mt-0.5 shrink-0" />{o.address}</div>}
                  {o.notes && <div className="text-neutral-600">ملاحظة: {o.notes}</div>}
                  {o.payment && (
                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-2 space-y-1">
                      <div className="font-black text-violet-800">
                        💰 دفع بمحفظة: {formatMoney(o.payment.amount, o.payment.currency || currency)}
                        {o.payment.state === 'paid' ? ' · تأكد' : o.payment.state === 'rejected' ? ' · مرفوض' : ' · بانتظار تأكيدك'}
                      </div>
                      <div dir="ltr" className="text-neutral-600">{o.payment.walletLabel} · {o.payment.txn}</div>
                      {o.payment.screenshot && <a href={o.payment.screenshot} target="_blank" rel="noreferrer" className="text-brand font-bold">صورة التحويل</a>}
                      {o.payment.state === 'pending' && (
                        <div className="flex gap-1.5 pt-1">
                          <button type="button" onClick={() => setPayment(o, 'paid')} className="h-7 px-3 rounded-lg bg-brand text-white font-bold cursor-pointer">تأكيد الدفع</button>
                          <button type="button" onClick={() => setPayment(o, 'rejected')} className="h-7 px-3 rounded-lg bg-red-50 text-red-600 font-bold cursor-pointer">رفض</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {ORDER_STATUSES.map((s) => (
                  <button key={s.id} type="button" onClick={() => setStatus(o, s.id)} disabled={o.status === s.id}
                    className="h-8 px-3 rounded-full text-xs font-bold border cursor-pointer disabled:cursor-default"
                    style={o.status === s.id ? { backgroundColor: s.color, borderColor: s.color, color: '#fff' } : { borderColor: '#e5e5e5', color: '#525252', background: '#fff' }}>
                    {s.label}
                  </button>
                ))}
                <button type="button" aria-label="حذف الطلب" onClick={() => remove(o)} className="mr-auto w-8 h-8 rounded-full text-neutral-400 hover:text-[#E03131] hover:bg-red-50 flex items-center justify-center cursor-pointer"><Trash2 size={15} /></button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
};
