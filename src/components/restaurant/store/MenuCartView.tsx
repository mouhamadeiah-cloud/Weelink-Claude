// The 'menuCart' canvas element: the guest's order. The dishes with their choices and quantities,
// then the order form: delivery or pickup, name, phone, address and a note, with the delivery fee
// and the minimum order from the admin window's settings. «أرسل الطلب» hands the order in to the
// admin window's «الطلبات» and opens WhatsApp with the whole order written out for the restaurant.
import React, { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle2, Bike, Store } from 'lucide-react';
import type { CanvasElement } from '../../../types';
import { useRestaurantData, useRestaurantOrder } from './RestaurantDataContext';
import { clearMenuCart, describeLine, menuCartSubtotal, setMenuLineQty, useMenuCart } from '../menuCartStore';
import { OrderType } from '../restaurantTypes';
import { formatMoney } from '../../shop/adminUi';
import { whatsappHref } from '../../cars/carModel';

interface MenuCartViewProps {
  elem: CanvasElement;
  isPreviewActive: boolean;
}

export const MenuCartView: React.FC<MenuCartViewProps> = ({ elem, isPreviewActive }) => {
  const data = useRestaurantData();
  const submit = useRestaurantOrder();
  const lines = useMenuCart();
  const settings = data?.settings;
  const accent = elem.styles.color || '#B5562B';
  const font = `${elem.styles.fontFamily ? `${elem.styles.fontFamily}, ` : ''}'IBM Plex Sans Arabic', sans-serif`;
  const currency = settings?.currency || 'ل.س';
  const types: OrderType[] = [...(settings?.delivery !== false ? ['delivery' as const] : []), ...(settings?.pickup !== false ? ['pickup' as const] : [])];
  const [type, setType] = useState<OrderType>(types[0] || 'pickup');
  const [f, setF] = useState({ name: '', phone: '', address: '', notes: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const activeType = types.includes(type) ? type : types[0] || 'pickup';
  const subtotal = menuCartSubtotal(lines);
  const fee = activeType === 'delivery' ? settings?.deliveryFee || 0 : 0;
  const total = subtotal + fee;
  const minOrder = settings?.minOrder || 0;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const send = () => {
    if (!isPreviewActive) return;
    if (!settings?.acceptOrders) return setError('المطعم لا يستقبل طلبات أونلاين الآن.');
    if (!lines.length) return setError('طلبك فارغ.');
    if (minOrder && subtotal < minOrder) return setError(`الحد الأدنى للطلب ${formatMoney(minOrder, currency)}.`);
    if (!f.name.trim() || f.phone.replace(/\D/g, '').length < 7) return setError('اكتب اسمك ورقم هاتف صحيح.');
    if (activeType === 'delivery' && !f.address.trim()) return setError('اكتب عنوان التوصيل.');
    setError('');
    const orderLines = lines.map(({ key: _k, image: _i, ...l }) => l);
    submit?.({ type: activeType, name: f.name.trim(), phone: f.phone.trim(), address: activeType === 'delivery' ? f.address.trim() : '', notes: f.notes.trim(), lines: orderLines, subtotal, deliveryFee: fee, total });
    if (settings.whatsapp) {
      const text = [
        `طلب جديد من الموقع${settings.name ? ` · ${settings.name}` : ''}`,
        activeType === 'delivery' ? 'توصيل' : 'استلام من المطعم',
        '',
        ...lines.map((l) => {
          const extra = describeLine(l);
          return `${l.qty} × ${l.name} = ${formatMoney(l.unitPrice * l.qty, currency)}${extra ? `\n   ${extra}` : ''}`;
        }),
        '',
        fee ? `التوصيل: ${formatMoney(fee, currency)}` : null,
        `المجموع: ${formatMoney(total, currency)}`,
        '',
        `الاسم: ${f.name.trim()}`,
        `الهاتف: ${f.phone.trim()}`,
        activeType === 'delivery' ? `العنوان: ${f.address.trim()}` : null,
        f.notes.trim() ? `ملاحظات: ${f.notes.trim()}` : null,
      ].filter((x) => x !== null).join('\n');
      window.open(whatsappHref(settings.whatsapp, text), '_blank', 'noopener,noreferrer');
    }
    clearMenuCart();
    setF({ name: '', phone: '', address: '', notes: '' });
    setSent(true);
  };

  const input = 'w-full h-11 px-4 rounded-2xl border border-black/10 bg-white text-sm outline-none focus:border-black/30';

  if (sent && !lines.length) {
    return (
      <div dir="rtl" className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-6" style={{ pointerEvents: isPreviewActive ? 'auto' : 'none', fontFamily: font }} onClick={stop}>
        <CheckCircle2 size={56} className="text-[#2F9E44]" />
        <div className="text-2xl font-black text-[#2B2118]">وصل طلبك، شكرًا لك!</div>
        <p className="text-sm text-black/55 max-w-sm leading-relaxed">سيتواصل معك المطعم لتأكيد الطلب{settings?.hours ? `. أوقات العمل: ${settings.hours}` : ''}.</p>
        <button type="button" onClick={() => setSent(false)} className="mt-2 h-11 px-6 rounded-full text-white font-bold cursor-pointer" style={{ backgroundColor: accent }}>طلب جديد</button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-full h-full overflow-auto" style={{ pointerEvents: isPreviewActive ? 'auto' : 'none', fontFamily: font, color: '#2B2118' }} onClick={stop}>
      <div className="grid md:grid-cols-[1fr_380px] gap-5 min-h-full">
        <section className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-3">
          <h3 className="text-xl font-black flex items-center gap-2"><ShoppingBag size={22} style={{ color: accent }} /> طلبك</h3>
          {lines.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-10 text-black/45">
              <ShoppingBag size={40} className="opacity-40" />
              <div className="font-bold">طلبك فارغ</div>
              <div className="text-sm">اختر أطباقك من المنيو وأضفها هنا.</div>
            </div>
          ) : (
            lines.map((l) => (
              <div key={l.key} className="flex items-center gap-3 py-2 border-b border-black/5 last:border-0">
                {l.image ? <img src={l.image} alt="" referrerPolicy="no-referrer" className="w-16 h-16 rounded-2xl object-cover shrink-0" /> : <div className="w-16 h-16 rounded-2xl bg-black/5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="font-black truncate">{l.name}</div>
                  {describeLine(l) && <div className="text-xs text-black/50 leading-relaxed">{describeLine(l)}</div>}
                  <div className="text-sm font-bold mt-0.5" style={{ color: accent }}>{formatMoney(l.unitPrice * l.qty, currency)}</div>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-black/10 p-1 shrink-0">
                  <button type="button" aria-label="زيادة" onClick={() => setMenuLineQty(l.key, l.qty + 1)} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center cursor-pointer"><Plus size={14} /></button>
                  <span className="w-6 text-center font-black text-sm">{l.qty}</span>
                  <button type="button" aria-label={l.qty > 1 ? 'إنقاص' : 'حذف'} onClick={() => setMenuLineQty(l.key, l.qty - 1)} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center cursor-pointer">{l.qty > 1 ? <Minus size={14} /> : <Trash2 size={14} />}</button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-3">
          <h3 className="text-lg font-black">إتمام الطلب</h3>
          {settings?.orderNote && <p className="text-xs leading-relaxed rounded-2xl p-3 bg-black/[0.04]">{settings.orderNote}</p>}
          {types.length > 1 && (
            <div className="grid grid-cols-2 gap-2">
              {types.map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`h-11 rounded-2xl border text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer ${activeType === t ? 'text-white border-transparent' : 'bg-white border-black/10'}`}
                  style={activeType === t ? { backgroundColor: accent } : undefined}>
                  {t === 'delivery' ? <Bike size={16} /> : <Store size={16} />}
                  {t === 'delivery' ? 'توصيل' : 'استلام'}
                </button>
              ))}
            </div>
          )}
          <input className={input} placeholder="الاسم" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={input} placeholder="رقم الهاتف" inputMode="tel" dir="rtl" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          {activeType === 'delivery' && <input className={input} placeholder="عنوان التوصيل" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />}
          <textarea className={`${input} h-20 py-3 resize-none`} placeholder="ملاحظات (اختياري)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <div className="space-y-1.5 text-sm pt-1">
            <div className="flex justify-between"><span className="text-black/55">المجموع الفرعي</span><span className="font-bold">{formatMoney(subtotal, currency)}</span></div>
            {activeType === 'delivery' && <div className="flex justify-between"><span className="text-black/55">التوصيل</span><span className="font-bold">{fee ? formatMoney(fee, currency) : 'مجاني'}</span></div>}
            <div className="flex justify-between text-base pt-1 border-t border-black/5"><span className="font-black">المجموع</span><span className="font-black" style={{ color: accent }}>{formatMoney(total, currency)}</span></div>
            {minOrder > 0 && subtotal < minOrder && lines.length > 0 && <div className="text-xs text-black/50">الحد الأدنى للطلب {formatMoney(minOrder, currency)}</div>}
          </div>
          {error && <div className="text-xs font-bold text-[#E03131]">{error}</div>}
          <button type="button" onClick={send} disabled={!lines.length} className="mt-auto h-12 rounded-full text-white font-black cursor-pointer disabled:opacity-40 disabled:cursor-default active:scale-[0.98] transition" style={{ backgroundColor: accent }}>
            {settings?.acceptOrders === false ? 'الطلب أونلاين متوقف الآن' : 'أرسل الطلب'}
          </button>
        </section>
      </div>
    </div>
  );
};
