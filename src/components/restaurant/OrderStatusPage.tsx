// /?r=<uid>&order=<id>&k=<key>: the page the customer's confirmation email links to. It shows where
// the order is (received, preparing, ready, on the way, delivered) and refreshes by itself.
import React, { useEffect, useState } from 'react';
import { Check, Loader2, MessageCircle, Phone, XCircle } from 'lucide-react';
import { OrderStatusView, loadOrderStatus } from './orderStatus';
import { formatMoney } from '../shop/adminUi';
import { whatsappHref } from '../cars/carModel';

const REFRESH_MS = 15000;
const ACCENT = '#B5562B';

const stepsFor = (type: string) => [
  { id: 'new', label: 'وصل الطلب' },
  { id: 'preparing', label: 'قيد التحضير' },
  { id: 'ready', label: type === 'delivery' ? 'جاهز للتوصيل' : type === 'table' ? 'جاهز' : 'جاهز للاستلام' },
  ...(type === 'delivery' ? [{ id: 'onway', label: 'على الطريق' }] : []),
  { id: 'done', label: 'تم التسليم' },
];

export const OrderStatusPage: React.FC<{ uid: string; orderId: string; k: string }> = ({ uid, orderId, k }) => {
  const [order, setOrder] = useState<OrderStatusView | 'not_found' | 'error' | null>(null);

  useEffect(() => {
    let alive = true;
    let timer = 0;
    const load = async () => {
      try {
        const o = await loadOrderStatus(uid, orderId, k);
        if (!alive) return;
        setOrder(o);
        if (o !== 'not_found' && o.status !== 'done' && o.status !== 'cancelled') timer = window.setTimeout(load, REFRESH_MS);
      } catch {
        if (!alive) return;
        setOrder((cur) => (cur && typeof cur !== 'string' ? cur : 'error'));
        timer = window.setTimeout(load, REFRESH_MS);
      }
    };
    load();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [uid, orderId, k]);

  useEffect(() => {
    if (order && typeof order !== 'string') document.title = `طلب ${order.number}${order.restaurant.name ? ` · ${order.restaurant.name}` : ''}`;
  }, [order]);

  const shell = (children: React.ReactNode) => (
    <div dir="rtl" className="min-h-[100dvh] bg-[#FBF6EF] flex justify-center p-5 font-sans text-[#2B2118]">
      <div className="w-full max-w-md space-y-5 pt-6">{children}</div>
    </div>
  );

  if (order === null) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-[#FBF6EF]"><Loader2 size={36} className="animate-spin" style={{ color: ACCENT }} /></div>;
  }
  if (typeof order === 'string') {
    return shell(
      <div className="text-center space-y-2 pt-16">
        <div className="text-xl font-black">{order === 'not_found' ? 'لم نجد هذا الطلب' : 'تعذر فتح حالة الطلب'}</div>
        <p className="text-sm text-black/50">{order === 'not_found' ? 'تأكد من الرابط في رسالة التأكيد.' : 'تحقق من اتصالك بالإنترنت، ستُحدّث الصفحة وحدها.'}</p>
      </div>
    );
  }

  const steps = stepsFor(order.type);
  const at = steps.findIndex((s) => s.id === order.status);
  const cancelled = order.status === 'cancelled';
  const currency = order.restaurant.currency;
  const site = `${window.location.origin}/?r=${encodeURIComponent(uid)}`;

  return shell(
    <>
      <div className="text-center space-y-1">
        {order.restaurant.name && <a href={site} className="text-sm font-bold text-black/50">{order.restaurant.name}</a>}
        <div className="text-3xl font-black">طلب رقم <span style={{ color: ACCENT }}>{order.number}</span></div>
        <div className="text-xs text-black/45">{new Date(order.createdAt).toLocaleString('ar-SY-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' })}</div>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm">
        {cancelled ? (
          <div className="flex items-center gap-3 text-[#C92A2A] font-black"><XCircle size={26} /> أُلغي هذا الطلب. تواصل مع المطعم لمعرفة السبب.</div>
        ) : (
          <ol className="space-y-0">
            {steps.map((s, i) => {
              const done = i < at || order.status === 'done';
              const now = i === at && order.status !== 'done';
              return (
                <li key={s.id} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0 ${now ? 'animate-pulse' : ''}`}
                      style={{ backgroundColor: done || now ? ACCENT : '#E9E1D6' }}
                    >
                      {done ? <Check size={16} /> : i + 1}
                    </span>
                    {i < steps.length - 1 && <span className="w-0.5 flex-1 min-h-[18px]" style={{ backgroundColor: done ? ACCENT : '#E9E1D6' }} />}
                  </div>
                  <div className={`pt-1 pb-4 text-base ${now ? 'font-black' : done ? 'font-bold' : 'font-bold text-black/35'}`}>
                    {s.label}
                    {now && <div className="text-xs font-bold text-black/45 mt-0.5">الآن</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm space-y-2 text-sm">
        {order.lines.map((l, i) => (
          <div key={i} className="flex justify-between gap-3">
            <span>{l.qty} × {l.name}</span>
            <span className="shrink-0 font-bold">{formatMoney((l.unitPrice || 0) * (l.qty || 0), currency)}</span>
          </div>
        ))}
        {order.deliveryFee > 0 && (
          <div className="flex justify-between gap-3 text-black/55"><span>التوصيل</span><span>{formatMoney(order.deliveryFee, currency)}</span></div>
        )}
        <div className="flex justify-between gap-3 pt-2 border-t border-black/5 font-black text-base"><span>المجموع</span><span>{formatMoney(order.total, currency)}</span></div>
      </div>

      {(order.restaurant.whatsapp || order.restaurant.phone) && (
        <div className="flex gap-2">
          {order.restaurant.whatsapp && (
            <a href={whatsappHref(order.restaurant.whatsapp, `بخصوص طلبي رقم ${order.number}`)} target="_blank" rel="noreferrer" className="flex-1 h-11 rounded-full bg-[#25D366] text-white font-bold inline-flex items-center justify-center gap-2">
              <MessageCircle size={18} /> واتساب
            </a>
          )}
          {order.restaurant.phone && (
            <a href={`tel:${order.restaurant.phone}`} className="flex-1 h-11 rounded-full bg-white border border-black/10 font-bold inline-flex items-center justify-center gap-2">
              <Phone size={18} /> اتصال
            </a>
          )}
        </div>
      )}
      {order.status !== 'done' && !cancelled && <p className="text-center text-xs text-black/40">تتحدّث هذه الصفحة وحدها.</p>}
    </>
  );
};
