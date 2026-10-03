// الطلبات: the store's orders and their status. A new order takes its items out of
// stock and records them as sales; cancelling an order puts them back.
import React, { useState } from 'react';
import { Plus, X, ClipboardList } from 'lucide-react';
import {
  ShopAdminData, ShopOrder, ShopOrderItem, OrderStatus, ORDER_STATUSES, PAYMENT_METHODS, PaymentMethodId, newId,
} from '../shopTypes';
import { Card, Field, inputClass, textareaClass, PrimaryButton, GhostButton, EmptyState, formatMoney, formatDate } from '../adminUi';
import { AdminTabProps } from './tabProps';

export const enabledPaymentMethods = (d: ShopAdminData): PaymentMethodId[] => {
  const p = d.settings.payments;
  const ids: PaymentMethodId[] = [];
  if (p.cash) ids.push('cash');
  if (p.shamCash) ids.push('sham-cash');
  if (p.syriatelCash) ids.push('syriatel-cash');
  if (p.gateway) ids.push('gateway');
  return ids.length ? ids : ['cash'];
};

// Applies the stock and sales-ledger effect of an order (sign 1 = take out, -1 = put back).
const applyStock = (d: ShopAdminData, order: ShopOrder, sign: 1 | -1): ShopAdminData => ({
  ...d,
  products: d.products.map((p) => {
    const qty = order.items.filter((i) => i.productId === p.id).reduce((s, i) => s + i.qty, 0);
    return qty ? { ...p, stock: Math.max(0, p.stock - sign * qty) } : p;
  }),
  movements:
    sign === 1
      ? [
          ...order.items.map((i) => ({
            id: newId('mov'), type: 'sale' as const, productId: i.productId, name: i.name, qty: i.qty,
            unitAmount: i.price, orderId: order.id, createdAt: order.createdAt,
          })),
          ...d.movements,
        ]
      : d.movements.filter((m) => m.orderId !== order.id),
});

const emptyDraft = {
  customerId: '',
  newCustomerName: '',
  newCustomerPhone: '',
  items: [] as ShopOrderItem[],
  pickProduct: '',
  pickQty: '1',
  paymentMethod: 'cash' as PaymentMethodId,
  deliveryMethod: 'delivery' as 'delivery' | 'pickup',
  note: '',
};

export const OrdersTab: React.FC<AdminTabProps> = ({ data, update }) => {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const currency = data.settings.currency;
  const payments = enabledPaymentMethods(data);

  const customerName = (id: string) => data.customers.find((c) => c.id === id)?.name || 'زبون محذوف';
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

  const addItem = () => {
    const product = data.products.find((p) => p.id === draft.pickProduct);
    const qty = Math.max(1, Math.floor(parseFloat(draft.pickQty) || 1));
    if (!product) return;
    const existing = draft.items.find((i) => i.productId === product.id);
    const items = existing
      ? draft.items.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + qty } : i))
      : [...draft.items, { productId: product.id, name: product.name, price: product.price, qty }];
    setDraft({ ...draft, items, pickProduct: '', pickQty: '1' });
  };

  const total = draft.items.reduce((s, i) => s + i.price * i.qty, 0)
    + (draft.deliveryMethod === 'delivery' ? data.settings.delivery.deliveryFee : 0);
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
        number: d.orders.reduce((m, o) => Math.max(m, o.number), 1000) + 1,
        customerId,
        items: draft.items,
        total,
        status: 'new',
        paymentMethod: draft.paymentMethod,
        deliveryMethod: draft.deliveryMethod,
        note: draft.note.trim(),
        createdAt: now,
      };
      const next = applyStock({ ...d, customers }, order, 1);
      return { ...next, orders: [order, ...next.orders] };
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
              <select className={inputClass} value={draft.pickProduct} onChange={(e) => setDraft({ ...draft, pickProduct: e.target.value })}>
                <option value="">— اختر منتجاً من المستودع —</option>
                {data.products.map((p) => <option key={p.id} value={p.id}>{p.name} · {formatMoney(p.price, currency)} · متوفر {p.stock}</option>)}
              </select>
              <input className={`${inputClass} w-20 shrink-0`} type="number" min="1" value={draft.pickQty} onChange={(e) => setDraft({ ...draft, pickQty: e.target.value })} />
              <GhostButton onClick={addItem} className="h-10 shrink-0" disabled={!draft.pickProduct}><Plus size={14} /></GhostButton>
            </div>
          </Field>
          {draft.items.length > 0 && (
            <div className="space-y-1.5">
              {draft.items.map((i) => (
                <div key={i.productId} className="flex items-center justify-between text-xs bg-[#fbfbfd] border border-neutral-100 rounded-lg p-2">
                  <span className="font-bold">{i.name} × {i.qty}</span>
                  <span className="flex items-center gap-2">
                    {formatMoney(i.price * i.qty, currency)}
                    <button type="button" onClick={() => setDraft({ ...draft, items: draft.items.filter((x) => x.productId !== i.productId) })} className="text-neutral-400 hover:text-red-500 cursor-pointer" aria-label="إزالة"><X size={13} /></button>
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
            <span className="text-xs font-bold text-neutral-500">المجموع{draft.deliveryMethod === 'delivery' && data.settings.delivery.deliveryFee ? ' مع التوصيل' : ''}</span>
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
              const st = ORDER_STATUSES.find((s) => s.id === o.status)!;
              return (
                <div key={o.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-neutral-100 bg-[#fbfbfd]">
                  <ClipboardList size={18} className="text-neutral-400 shrink-0" />
                  <div className="flex-1 min-w-[160px]">
                    <div className="text-sm font-bold text-[#1d1d1f]">#{o.number} · {customerName(o.customerId)}</div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {formatDate(o.createdAt)} · {o.items.map((i) => `${i.name} × ${i.qty}`).join('، ')}
                      {' · '}{PAYMENT_METHODS.find((m) => m.id === o.paymentMethod)?.label} · {o.deliveryMethod === 'delivery' ? 'توصيل' : 'استلام'}
                    </div>
                  </div>
                  <div className="text-sm font-black">{formatMoney(o.total, currency)}</div>
                  <select
                    value={o.status}
                    onChange={(e) => setStatus(o, e.target.value as OrderStatus)}
                    className="h-8 px-2 rounded-lg border text-[11px] font-bold cursor-pointer outline-none"
                    style={{ color: st.color, borderColor: `${st.color}55`, backgroundColor: `${st.color}10` }}
                  >
                    {ORDER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
