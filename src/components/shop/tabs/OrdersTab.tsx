// الطلبات: the store's orders and their status. A new order takes its items out of
// stock and records them as sales; cancelling an order puts them back.
import React, { useState } from 'react';
import { Plus, X, ClipboardList, Check, Ban, MessageCircle, Mail, MapPin, Phone } from 'lucide-react';
import {
  ShopOrder, ShopOrderItem, OrderStatus, ORDER_STATUSES, PAYMENT_METHODS, PaymentMethodId, newId,
} from '../shopTypes';
import { Card, Field, inputClass, inputFitClass, textareaClass, PrimaryButton, GhostButton, EmptyState, formatMoney, formatDate } from '../adminUi';
import { AdminTabProps } from './tabProps';
import { deliveryQuote, totalStock, tracksStock, unitPriceFor, variantLabel } from '../productModel';
import { addOrder, applyOrderStock, enabledPaymentMethods, nextOrderNumber, orderConfirmationText, orderItemName, whatsappLink } from '../orderModel';

const itemName = orderItemName;
const applyStock = applyOrderStock;

const emptyDraft = {
  customerId: '',
  newCustomerName: '',
  newCustomerPhone: '',
  items: [] as ShopOrderItem[],
  pickProduct: '',
  pickVariant: '',
  pickQty: '1',
  paymentMethod: 'cash' as PaymentMethodId,
  deliveryMethod: 'delivery' as 'delivery' | 'pickup',
  note: '',
};

export const OrdersTab: React.FC<AdminTabProps> = ({ data, update }) => {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const currency = data.settings.currency;
  const payments = enabledPaymentMethods(data);

  const customerName = (o: ShopOrder) => data.customers.find((c) => c.id === o.customerId)?.name || o.contact?.name || 'زبون محذوف';
  const customerPhone = (o: ShopOrder) => o.contact?.whatsapp || data.customers.find((c) => c.id === o.customerId)?.phone || '';
  const list = data.orders.filter((o) => filter === 'all' || o.status === filter);

  const setStatus = (order: ShopOrder, status: OrderStatus) => {
    if (status === order.status) return;
    update((d) => {
      let next = d;
      if (status === 'cancelled') next = applyStock(next, order, -1);
      if (order.status === 'cancelled') next = applyStock(next, { ...order, createdAt: new Date().toISOString() }, 1);
      return { ...next, orders: next.orders.map((o) => (o.id === order.id ? { ...o, status } : o)) };
    });
  };

  // A wallet payment the merchant checked: the order goes on as a new order.
  const confirmPayment = (order: ShopOrder) => setStatus(order, 'new');

  const rejectPayment = (order: ShopOrder, reason: string) => {
    update((d) => {
      const next = applyStock(d, order, -1);
      return {
        ...next,
        orders: next.orders.map((o) =>
          o.id === order.id ? { ...o, status: 'cancelled', payment: o.payment ? { ...o.payment, rejectReason: reason.trim() } : o.payment } : o
        ),
      };
    });
    setRejecting(null);
  };

  const addItem = () => {
    const product = data.products.find((p) => p.id === draft.pickProduct);
    const qty = Math.max(1, Math.floor(parseFloat(draft.pickQty) || 1));
    if (!product) return;
    const variant = product.variants.length ? product.variants.find((v) => variantLabel(v.values) === draft.pickVariant) : undefined;
    if (product.variants.length && !variant) return;
    const label = variant ? variantLabel(variant.values) : undefined;
    const same = (i: ShopOrderItem) => i.productId === product.id && i.variant === label;
    const existing = draft.items.find(same);
    const newQty = (existing?.qty || 0) + qty;
    const price = unitPriceFor(product, newQty, variant);
    const items = existing
      ? draft.items.map((i) => (same(i) ? { ...i, qty: newQty, price } : i))
      : [...draft.items, { productId: product.id, name: product.name, variant: label, price, qty }];
    setDraft({ ...draft, items, pickProduct: '', pickVariant: '', pickQty: '1' });
  };

  const pickedProduct = data.products.find((p) => p.id === draft.pickProduct);

  const quote = deliveryQuote(draft.items, data.products, data.settings);
  const deliveryFee = draft.deliveryMethod === 'delivery' ? quote.fee : 0;
  const total = quote.subtotal + deliveryFee;
  const hasCustomer = draft.customerId || draft.newCustomerName.trim();

  const createOrder = () => {
    if (!hasCustomer || draft.items.length === 0) return;
    const now = new Date().toISOString();
    update((d) => {
      let customers = d.customers;
      let customerId = draft.customerId;
      if (!customerId) {
        customerId = newId('cus');
        customers = [{ id: customerId, name: draft.newCustomerName.trim(), phone: draft.newCustomerPhone.trim(), email: '', address: '', createdAt: now }, ...customers];
      }
      const order: ShopOrder = {
        id: newId('ord'),
        number: nextOrderNumber(d),
        customerId,
        items: draft.items,
        total,
        deliveryFee,
        status: 'new',
        paymentMethod: draft.paymentMethod,
        deliveryMethod: draft.deliveryMethod,
        note: draft.note.trim(),
        source: 'admin',
        createdAt: now,
      };
      return addOrder({ ...d, customers }, order);
    });
    setDraft(emptyDraft);
    setCreating(false);
  };

  if (creating) {
    return (
      <div className="max-w-2xl">
        <Card title="طلب جديد">
          <Field label="الزبون">
            <select className={inputClass} value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}>
              <option value="">— زبون جديد —</option>
              {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name} {c.phone && `· ${c.phone}`}</option>)}
            </select>
          </Field>
          {!draft.customerId && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="اسم الزبون"><input className={inputClass} value={draft.newCustomerName} onChange={(e) => setDraft({ ...draft, newCustomerName: e.target.value })} /></Field>
              <Field label="هاتف الزبون"><input className={inputClass} value={draft.newCustomerPhone} onChange={(e) => setDraft({ ...draft, newCustomerPhone: e.target.value })} dir="ltr" inputMode="tel" /></Field>
            </div>
          )}

          <Field label="المنتجات">
            <div className="flex gap-2">
              <select className={inputClass} value={draft.pickProduct} onChange={(e) => setDraft({ ...draft, pickProduct: e.target.value, pickVariant: '' })}>
                <option value="">— اختر منتجاً من المستودع —</option>
                {data.products.map((p) => <option key={p.id} value={p.id}>{p.name} · {formatMoney(p.price, currency)} · {tracksStock(p) ? `متوفر ${totalStock(p)}` : 'بدون مخزون'}</option>)}
              </select>
              {pickedProduct && pickedProduct.variants.length > 0 && (
                <select className={`${inputFitClass} w-40 shrink-0`} value={draft.pickVariant} onChange={(e) => setDraft({ ...draft, pickVariant: e.target.value })} aria-label="التركيبة">
                  <option value="">— التركيبة —</option>
                  {pickedProduct.variants.map((v) => (
                    <option key={variantLabel(v.values)} value={variantLabel(v.values)} disabled={tracksStock(pickedProduct) && v.stock <= 0}>
                      {variantLabel(v.values)} ({!tracksStock(pickedProduct) ? 'بدون مخزون' : v.stock > 0 ? `متوفر ${v.stock}` : 'غير متوفر'})
                    </option>
                  ))}
                </select>
              )}
              <input className={`${inputFitClass} w-20 shrink-0`} type="number" min="1" value={draft.pickQty} onChange={(e) => setDraft({ ...draft, pickQty: e.target.value })} />
              <GhostButton onClick={addItem} className="h-10 shrink-0" disabled={!draft.pickProduct || (!!pickedProduct?.variants.length && !draft.pickVariant)}><Plus size={14} /></GhostButton>
            </div>
          </Field>
          {draft.items.length > 0 && (
            <div className="space-y-1.5">
              {draft.items.map((i) => (
                <div key={i.productId + (i.variant || '')} className="flex items-center justify-between text-xs bg-[#fbfbfd] border border-neutral-100 rounded-lg p-2">
                  <span className="font-bold">{itemName(i)} × {i.qty}</span>
                  <span className="flex items-center gap-2">
                    {formatMoney(i.price * i.qty, currency)}
                    <button type="button" onClick={() => setDraft({ ...draft, items: draft.items.filter((x) => x !== i) })} className="text-neutral-400 hover:text-red-500 cursor-pointer" aria-label="إزالة"><X size={13} /></button>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="طريقة الدفع">
              <select className={inputClass} value={draft.paymentMethod} onChange={(e) => setDraft({ ...draft, paymentMethod: e.target.value as PaymentMethodId })}>
                {PAYMENT_METHODS.filter((m) => payments.includes(m.id)).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="الاستلام">
              <select className={inputClass} value={draft.deliveryMethod} onChange={(e) => setDraft({ ...draft, deliveryMethod: e.target.value as 'delivery' | 'pickup' })}>
                <option value="delivery">توصيل</option>
                <option value="pickup">استلام من المتجر</option>
              </select>
            </Field>
          </div>
          <Field label="ملاحظة"><textarea className={textareaClass} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></Field>

          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100">
            <span className="text-xs font-bold text-neutral-500">
              المجموع{deliveryFee > 0 ? ` مع التوصيل (${formatMoney(deliveryFee, currency)})` : draft.deliveryMethod === 'delivery' && quote.free ? ' (توصيل مجاني)' : ''}
            </span>
            <span className="text-base font-black">{formatMoney(total, currency)}</span>
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={createOrder} disabled={!hasCustomer || draft.items.length === 0} className="flex-1">تسجيل الطلب</PrimaryButton>
            <GhostButton onClick={() => { setCreating(false); setDraft(emptyDraft); }} className="h-10">إلغاء</GhostButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[{ id: 'all' as const, label: 'الكل', color: '#1d1d1f' }, ...ORDER_STATUSES].map((s) => {
          const count = s.id === 'all' ? data.orders.length : data.orders.filter((o) => o.status === s.id).length;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setFilter(s.id)}
              className={`h-8 px-3 rounded-full text-[11px] font-bold border transition cursor-pointer ${filter === s.id ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}
            >
              {s.label} ({count})
            </button>
          );
        })}
        <PrimaryButton onClick={() => setCreating(true)} className="h-8 mr-auto flex items-center gap-1"><Plus size={14} /> طلب جديد</PrimaryButton>
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState text={data.orders.length ? 'لا طلبات بهذه الحالة.' : 'لا توجد طلبات بعد.'} />
        ) : (
          <div className="space-y-2">
            {list.map((o) => {
              const st = ORDER_STATUSES.find((x) => x.id === o.status) || ORDER_STATUSES[1];
              const open = openId === o.id;
              const phone = customerPhone(o);
              const notify = data.settings.notifications.whatsappNotify && phone;
              return (
                <div key={o.id} className="rounded-xl border border-neutral-100 bg-[#fbfbfd]">
                  <div className="flex flex-wrap items-center gap-3 p-3">
                    <button type="button" onClick={() => setOpenId(open ? null : o.id)} className="flex items-center gap-3 flex-1 min-w-[160px] text-right cursor-pointer" aria-expanded={open}>
                      <ClipboardList size={18} className="text-neutral-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#1d1d1f]">#{o.number} · {customerName(o)}</div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          {formatDate(o.createdAt)} · {o.items.map((i) => `${itemName(i)} × ${i.qty}`).join('، ')}
                          {' · '}{PAYMENT_METHODS.find((m) => m.id === o.paymentMethod)?.label} · {o.deliveryMethod === 'delivery' ? 'توصيل' : 'استلام'}
                        </div>
                      </div>
                    </button>
                    <div className="text-sm font-black">{formatMoney(o.total, currency)}</div>
                    <select
                      value={o.status}
                      onChange={(e) => setStatus(o, e.target.value as OrderStatus)}
                      className="h-8 px-2 rounded-lg border text-[11px] font-bold cursor-pointer outline-none"
                      style={{ color: st.color, borderColor: `${st.color}55`, backgroundColor: `${st.color}10` }}
                      aria-label="حالة الطلب"
                    >
                      {ORDER_STATUSES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                    </select>
                  </div>

                  {o.status === 'awaiting-payment' && (
                    <div className="px-3 pb-3 flex flex-wrap items-center gap-2">
                      {rejecting?.id === o.id ? (
                        <>
                          <input
                            className={`${inputFitClass} flex-1 min-w-[180px] h-9`}
                            placeholder="سبب الرفض (يظهر في الطلب)"
                            value={rejecting.reason}
                            onChange={(e) => setRejecting({ id: o.id, reason: e.target.value })}
                            autoFocus
                          />
                          <button type="button" onClick={() => rejectPayment(o, rejecting.reason)} disabled={!rejecting.reason.trim()} className="h-9 px-3 rounded-xl bg-[#ff3b30] disabled:opacity-40 text-white text-xs font-bold cursor-pointer">تأكيد الرفض</button>
                          <GhostButton onClick={() => setRejecting(null)}>إلغاء</GhostButton>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => confirmPayment(o)} className="h-9 px-3 rounded-xl bg-[#34c759] hover:bg-[#2fb350] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Check size={14} /> تأكيد الدفع</button>
                          <GhostButton onClick={() => setRejecting({ id: o.id, reason: '' })} className="flex items-center gap-1.5 text-[#ff3b30]"><Ban size={13} /> رفض</GhostButton>
                          {!open && o.payment && <GhostButton onClick={() => setOpenId(o.id)}>عرض إثبات الدفع</GhostButton>}
                        </>
                      )}
                    </div>
                  )}

                  {open && (
                    <div className="border-t border-neutral-100 p-3 grid sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1.5">
                        {o.contact && (
                          <>
                            {o.contact.address && <div className="flex items-center gap-1.5 text-neutral-600"><MapPin size={13} /> {o.contact.address}</div>}
                            {o.contact.whatsapp && <div className="flex items-center gap-1.5 text-neutral-600" dir="ltr"><Phone size={13} /> {o.contact.whatsapp}</div>}
                            {o.contact.email && <div className="flex items-center gap-1.5 text-neutral-600" dir="ltr"><Mail size={13} /> {o.contact.email}</div>}
                          </>
                        )}
                        {o.items.map((i) => (
                          <div key={i.productId + (i.variant || '')} className="flex justify-between gap-2">
                            <span>{itemName(i)} × {i.qty}</span><span className="font-bold">{formatMoney(i.price * i.qty, currency)}</span>
                          </div>
                        ))}
                        {!!o.deliveryFee && <div className="flex justify-between gap-2 text-neutral-500"><span>التوصيل</span><span>{formatMoney(o.deliveryFee, currency)}</span></div>}
                        {!!o.payment?.fee && <div className="flex justify-between gap-2 text-neutral-500"><span>رسوم المحفظة</span><span>{formatMoney(o.payment.fee, currency)}</span></div>}
                        {o.note && <div className="text-neutral-500">ملاحظة: {o.note}</div>}
                        {notify && (
                          <a href={whatsappLink(phone, orderConfirmationText(data, o))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-8 px-3 mt-1 rounded-xl bg-[#25d366] text-white font-bold">
                            <MessageCircle size={13} /> إشعار الزبون عبر واتساب
                          </a>
                        )}
                      </div>
                      {o.payment && (
                        <div className="space-y-1.5">
                          <div className="font-bold text-neutral-600">إثبات الدفع</div>
                          <div>رقم العملية: <span className="font-bold" dir="ltr">{o.payment.transactionId || '—'}</span></div>
                          {o.payment.screenshot && (
                            <a href={o.payment.screenshot} target="_blank" rel="noopener noreferrer">
                              <img src={o.payment.screenshot} alt="لقطة شاشة الدفع" className="max-h-48 rounded-lg border border-neutral-200 object-contain bg-white" referrerPolicy="no-referrer" />
                            </a>
                          )}
                          {o.payment.rejectReason && <div className="text-[#ff3b30] font-bold">سبب الرفض: {o.payment.rejectReason}</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
