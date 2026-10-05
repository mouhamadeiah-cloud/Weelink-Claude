// الطلبات: the orders the website handed in, newest first, filtered by status. Each order shows its
// dishes with the guest's choices, the guest's details and the totals, and moves through
// جديد ← قيد التحضير ← جاهز ← تم التسليم (or ملغى).
import React, { useState } from 'react';
import { Phone, MapPin, Bike, Store, Trash2, MessageCircle } from 'lucide-react';
import { ORDER_STATUSES, OrderStatus } from '../restaurantTypes';
import { describeLine } from '../menuCartStore';
import { Card, EmptyState, formatMoney } from '../../shop/adminUi';
import { whatsappHref } from '../../cars/carModel';
import { RestaurantTabProps } from './shared';

const time = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('ar-SY-u-nu-latn', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// A Syrian number written as 09… becomes 9639… for WhatsApp.
const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.startsWith('00') ? d.slice(2) : d.startsWith('0') ? `963${d.slice(1)}` : d;
};

export const OrdersTab: React.FC<RestaurantTabProps> = ({ data, update }) => {
  const [filter, setFilter] = useState<OrderStatus | 'open' | 'all'>('open');
  const currency = data.settings.currency;
  const list = data.orders.filter((o) => (filter === 'all' ? true : filter === 'open' ? o.status !== 'done' && o.status !== 'cancelled' : o.status === filter));
  const setStatus = (id: string, status: OrderStatus) => update((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
  const remove = (id: string) => {
    if (!window.confirm('حذف هذا الطلب نهائيًا؟')) return;
    update((d) => ({ ...d, orders: d.orders.filter((o) => o.id !== id) }));
  };

  const filters: { id: typeof filter; label: string }[] = [
    { id: 'open', label: 'المفتوحة' },
    ...ORDER_STATUSES.map((s) => ({ id: s.id, label: s.label })),
    { id: 'all', label: 'الكل' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const n = f.id === 'all' ? data.orders.length : f.id === 'open' ? data.orders.filter((o) => o.status !== 'done' && o.status !== 'cancelled').length : data.orders.filter((o) => o.status === f.id).length;
          return (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={`h-8 px-3 rounded-full text-xs font-bold border cursor-pointer ${filter === f.id ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}>
              {f.label} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState text={data.orders.length ? 'لا طلبات هنا.' : 'لم يصل أي طلب بعد. طلبات صفحة السلة تظهر هنا.'} />
      ) : (
        list.map((o) => {
          const st = ORDER_STATUSES.find((s) => s.id === o.status)!;
          return (
            <Card key={o.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-black">طلب #{o.number}</span>
                <span className="h-6 px-2.5 rounded-full text-[11px] font-bold text-white inline-flex items-center" style={{ backgroundColor: st.color }}>{st.label}</span>
                <span className="h-6 px-2.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-600 inline-flex items-center gap-1">{o.type === 'delivery' ? <Bike size={12} /> : <Store size={12} />}{o.type === 'delivery' ? 'توصيل' : 'استلام'}</span>
                <span className="h-6 px-2.5 rounded-full text-[11px] font-bold bg-[#0071e3]/10 text-[#0071e3] inline-flex items-center">الموقع</span>
                <span className="mr-auto text-[11px] text-neutral-400 font-bold">{time(o.createdAt)}</span>
              </div>
              <div className="grid md:grid-cols-[1fr_260px] gap-4">
                <div className="space-y-2">
                  {o.lines.map((l, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <span className="font-black">{l.qty} × {l.name}</span>
                        {describeLine(l) && <div className="text-[11px] text-neutral-500">{describeLine(l)}</div>}
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
                  <div className="font-black text-sm">{o.name}</div>
                  <a href={`tel:${o.phone}`} className="flex items-center gap-1.5 text-[#0071e3] font-bold" dir="ltr"><Phone size={13} />{o.phone}</a>
                  {o.phone && <a href={whatsappHref(waNumber(o.phone), `مرحبًا ${o.name}، بخصوص طلبك رقم ${o.number}`)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#2F9E44] font-bold"><MessageCircle size={13} />واتساب</a>}
                  {o.address && <div className="flex items-start gap-1.5 text-neutral-600"><MapPin size={13} className="mt-0.5 shrink-0" />{o.address}</div>}
                  {o.notes && <div className="text-neutral-600">ملاحظة: {o.notes}</div>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {ORDER_STATUSES.map((s) => (
                  <button key={s.id} type="button" onClick={() => setStatus(o.id, s.id)} disabled={o.status === s.id}
                    className="h-8 px-3 rounded-full text-[11px] font-bold border cursor-pointer disabled:cursor-default"
                    style={o.status === s.id ? { backgroundColor: s.color, borderColor: s.color, color: '#fff' } : { borderColor: '#e5e5e5', color: '#525252', background: '#fff' }}>
                    {s.label}
                  </button>
                ))}
                <button type="button" aria-label="حذف الطلب" onClick={() => remove(o.id)} className="mr-auto w-8 h-8 rounded-full text-neutral-400 hover:text-[#E03131] hover:bg-red-50 flex items-center justify-center cursor-pointer"><Trash2 size={15} /></button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
};
