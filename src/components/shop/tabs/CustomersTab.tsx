// إدارة الزبائن: a record for every customer with their purchases.
import React, { useState } from 'react';
import { UserPlus, Search, ChevronDown, Trash2 } from 'lucide-react';
import { ShopCustomer, ORDER_STATUSES, newId } from '../shopTypes';
import { Card, Field, inputClass, PrimaryButton, EmptyState, formatMoney, formatDate } from '../adminUi';
import { AdminTabProps } from './tabProps';

const emptyDraft = { name: '', phone: '', email: '', address: '' };

export const CustomersTab: React.FC<AdminTabProps> = ({ data, update }) => {
  const [draft, setDraft] = useState(emptyDraft);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const currency = data.settings.currency;

  const ordersOf = (id: string) => data.orders.filter((o) => o.customerId === id);
  const spentBy = (id: string) => ordersOf(id).filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);

  const add = () => {
    if (!draft.name.trim()) return;
    const customer: ShopCustomer = {
      id: newId('cus'),
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      address: draft.address.trim(),
      createdAt: new Date().toISOString(),
    };
    update((d) => ({ ...d, customers: [customer, ...d.customers] }));
    setDraft(emptyDraft);
  };

  const remove = (c: ShopCustomer) => {
    if (ordersOf(c.id).length) {
      window.alert('لا يمكن حذف زبون لديه طلبات مسجلة.');
      return;
    }
    if (!window.confirm(`حذف الزبون "${c.name}"؟`)) return;
    update((d) => ({ ...d, customers: d.customers.filter((x) => x.id !== c.id) }));
  };

  const q = query.trim().toLowerCase();
  const list = data.customers.filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q));

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
      <Card
        title={`الزبائن (${data.customers.length})`}
        actions={
          <div className="relative w-44 sm:w-56">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input className={`${inputClass} h-9 pr-8`} placeholder="بحث بالاسم أو الهاتف" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        }
      >
        {list.length === 0 ? (
          <EmptyState text={data.customers.length ? 'لا نتائج لهذا البحث.' : 'لا يوجد زبائن بعد.'} />
        ) : (
          <div className="space-y-2">
            {list.map((c) => {
              const orders = ordersOf(c.id);
              const open = openId === c.id;
              return (
                <div key={c.id} className="rounded-xl border border-neutral-100 bg-[#fbfbfd]">
                  <div className="flex items-center gap-3 p-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-[#0071e3] flex items-center justify-center text-sm font-black shrink-0">{c.name[0]}</div>
                    <button type="button" onClick={() => setOpenId(open ? null : c.id)} className="flex-1 min-w-0 text-right cursor-pointer">
                      <div className="text-sm font-bold text-[#1d1d1f] truncate">{c.name}</div>
                      <div className="text-[10px] text-neutral-400 truncate" dir="auto">{[c.phone, c.email].filter(Boolean).join(' · ') || '—'}</div>
                    </button>
                    <div className="text-left shrink-0">
                      <div className="text-xs font-black text-[#1d1d1f]">{formatMoney(spentBy(c.id), currency)}</div>
                      <div className="text-[10px] text-neutral-400">{orders.length} طلب</div>
                    </div>
                    <ChevronDown size={15} className={`text-neutral-400 transition ${open ? 'rotate-180' : ''}`} />
                  </div>
                  {open && (
                    <div className="border-t border-neutral-100 p-3 space-y-2">
                      {c.address && <p className="text-[11px] text-neutral-500">العنوان: {c.address}</p>}
                      {orders.length === 0 ? (
                        <p className="text-[11px] text-neutral-400">لا توجد مشتريات بعد.</p>
                      ) : (
                        orders.map((o) => {
                          const st = ORDER_STATUSES.find((s) => s.id === o.status);
                          return (
                            <div key={o.id} className="flex items-center justify-between text-[11px] bg-white rounded-lg p-2 border border-neutral-100">
                              <span className="font-bold">طلب #{o.number} · {formatDate(o.createdAt)}</span>
                              <span className="text-neutral-500 truncate mx-2">{o.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.qty}`).join('، ')}</span>
                              <span className="font-black shrink-0" style={{ color: st?.color }}>{formatMoney(o.total, currency)}</span>
                            </div>
                          );
                        })
                      )}
                      <button type="button" onClick={() => remove(c)} className="text-[11px] font-bold text-red-500 flex items-center gap-1 cursor-pointer">
                        <Trash2 size={12} /> حذف الزبون
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="إضافة زبون">
        <Field label="الاسم"><input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="الهاتف"><input className={inputClass} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} dir="ltr" inputMode="tel" /></Field>
        <Field label="البريد الإلكتروني"><input className={inputClass} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} dir="ltr" type="email" /></Field>
        <Field label="العنوان"><input className={inputClass} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></Field>
        <PrimaryButton onClick={add} disabled={!draft.name.trim()} className="w-full flex items-center justify-center gap-1.5">
          <UserPlus size={14} /> إضافة الزبون
        </PrimaryButton>
      </Card>
    </div>
  );
};
