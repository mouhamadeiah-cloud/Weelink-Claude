// الزبائن: the showroom's buyers, sellers and interested people. Each card shows the cars a customer
// bought and what is still owed on them; buyers added in «تم البيع» appear here on their own.
import React, { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Phone, MessageCircle, X } from 'lucide-react';
import { CarCustomer, CUSTOMER_ROLES, CustomerRole } from '../carTypes';
import { carTitle } from '../carModel';
import { CustomerDraft, emptyCustomer, saleRemaining, saveCustomer } from '../carMoney';
import { Card, EmptyState, inputClass, PrimaryButton, GhostButton, formatMoney } from '../../shop/adminUi';
import { matchesSearch } from '../../shop/store/shopSearchStore';
import { CarTabProps } from './CarEditor';
import { CustomerFields, customerWhatsapp } from './moneyUi';

export const CarCustomersTab: React.FC<CarTabProps> = ({ data, update }) => {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<CustomerRole | 'all' | 'owing'>('all');
  const [editing, setEditing] = useState<{ id?: string; draft: CustomerDraft } | null>(null);
  const [error, setError] = useState('');

  const boughtBy = (id: string) => data.cars.filter((c) => c.sale?.customerId === id);
  const owedBy = (id: string) => {
    const totals: Record<string, number> = {};
    boughtBy(id).forEach((c) => { const r = saleRemaining(c); if (r > 0) totals[c.currency] = (totals[c.currency] || 0) + r; });
    return totals;
  };

  const shown = useMemo(
    () =>
      data.customers.filter(
        (c) =>
          (role === 'all' || (role === 'owing' ? Object.keys(owedBy(c.id)).length > 0 : c.roles.includes(role))) &&
          matchesSearch([c.name, c.phone, c.city, c.idNumber, c.notes], query)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.customers, data.cars, role, query]
  );

  const save = () => {
    if (!editing) return;
    if (!editing.draft.name.trim()) return setError('اكتب اسم الزبون.');
    setError('');
    update((d) => saveCustomer(d, { ...editing.draft, name: editing.draft.name.trim() }, editing.id).data);
    setEditing(null);
  };

  const remove = (c: CarCustomer) => {
    if (boughtBy(c.id).length) return window.alert('لا يمكن حذف زبون اشترى سيارة. ألغِ البيع أولًا أو أبقِه في القائمة.');
    if (!window.confirm(`حذف ${c.name} من الزبائن؟`)) return;
    update((d) => ({ ...d, customers: d.customers.filter((x) => x.id !== c.id) }));
  };

  const filters: { id: CustomerRole | 'all' | 'owing'; label: string }[] = [{ id: 'all', label: 'الكل' }, ...CUSTOMER_ROLES, { id: 'owing', label: 'عليهم مبالغ' }];

  return (
    <div className="space-y-4">
      {editing && (
        <Card
          title={editing.id ? 'تعديل زبون' : 'زبون جديد'}
          actions={<button type="button" onClick={() => setEditing(null)} aria-label="إغلاق" className="w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer"><X size={16} /></button>}
        >
          <CustomerFields value={editing.draft} onChange={(draft) => setEditing({ ...editing, draft })} />
          {error && <div className="text-[11px] text-red-600 font-bold">{error}</div>}
          <div className="flex gap-2">
            <PrimaryButton onClick={save}>حفظ الزبون</PrimaryButton>
            <GhostButton onClick={() => setEditing(null)} className="h-10">إلغاء</GhostButton>
          </div>
        </Card>
      )}

      <Card
        title={`الزبائن (${data.customers.length})`}
        actions={<PrimaryButton onClick={() => { setError(''); setEditing({ draft: emptyCustomer() }); }} className="h-9 flex items-center gap-1"><Plus size={14} /> زبون جديد</PrimaryButton>}
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-neutral-400" />
            <input className={`${inputClass} pr-9`} placeholder="ابحث بالاسم، الهاتف، المحافظة، الرقم الوطني..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1">
            {filters.map((f) => (
              <button key={f.id} type="button" onClick={() => setRole(f.id)}
                className={`h-10 px-3 rounded-xl text-xs font-bold border cursor-pointer ${role === f.id ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <EmptyState text={data.customers.length ? 'لا يوجد زبائن مطابقون' : 'لا يوجد زبائن بعد. يُضاف المشتري تلقائيًا عند «تم البيع»، أو أضف زبونًا من «زبون جديد».'} />
        ) : (
          <div className="grid md:grid-cols-2 gap-2">
            {shown.map((c) => {
              const cars = boughtBy(c.id);
              const owed = owedBy(c.id);
              const wa = customerWhatsapp(c);
              return (
                <div key={c.id} className="rounded-2xl border border-neutral-200 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-9 h-9 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-sm font-black shrink-0">{c.name.trim().charAt(0) || '؟'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-[#1d1d1f] truncate">{c.name}</div>
                      <div className="text-[11px] text-neutral-500 truncate">{[c.phone && <span key="p" dir="ltr">{c.phone}</span>, c.city].filter(Boolean).reduce<React.ReactNode[]>((a, x, i) => (i ? [...a, ' · ', x] : [x]), [])}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="واتساب" className="w-8 h-8 rounded-lg border border-neutral-200 text-[#25d366] hover:bg-green-50 flex items-center justify-center"><MessageCircle size={14} /></a>}
                      {c.phone && <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} aria-label="اتصال" className="w-8 h-8 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 flex items-center justify-center"><Phone size={14} /></a>}
                      <button type="button" onClick={() => { setError(''); setEditing({ id: c.id, draft: { name: c.name, phone: c.phone, city: c.city, address: c.address, idNumber: c.idNumber, roles: c.roles, notes: c.notes } }); }} aria-label="تعديل" className="w-8 h-8 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 flex items-center justify-center cursor-pointer"><Pencil size={14} /></button>
                      <button type="button" onClick={() => remove(c)} aria-label="حذف" className="w-8 h-8 rounded-lg border border-neutral-200 text-neutral-400 hover:text-red-500 flex items-center justify-center cursor-pointer"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {c.roles.length > 0 && (
                    <div className="flex gap-1">
                      {c.roles.map((r) => <span key={r} className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-600">{CUSTOMER_ROLES.find((x) => x.id === r)?.label}</span>)}
                    </div>
                  )}
                  {cars.length > 0 && (
                    <div className="text-[11px] text-neutral-600 space-y-0.5">
                      {cars.map((car) => (
                        <div key={car.id} className="flex justify-between gap-2">
                          <span className="truncate">اشترى {carTitle(car)} {car.year || ''}</span>
                          <span className="font-bold shrink-0">{formatMoney(car.sale!.price, car.currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {Object.keys(owed).length > 0 && (
                    <div className="rounded-lg bg-amber-50 text-[#b06f00] px-2 py-1 text-[11px] font-bold">
                      متبقٍ عليه: {Object.entries(owed).map(([cur, n]) => formatMoney(n, cur)).join(' + ')}
                    </div>
                  )}
                  {c.notes && <p className="text-[11px] text-neutral-500 leading-relaxed">{c.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
