// المخزون: every car of the showroom with its state. From here the owner changes a car's status,
// shows it in or hides it from the showroom, marks it as featured, opens it to edit, or deletes it.
import React, { useMemo, useState } from 'react';
import { Pencil, Trash2, Eye, EyeOff, Star, Search, ImageOff, Plus, BadgeCheck, Wallet } from 'lucide-react';
import { Car, CarStatus, CAR_STATUSES } from '../carTypes';
import { carTitle, carSubtitle, formatKm, statusMeta } from '../carModel';
import { carCost, carProfit, expectedProfit, saleRemaining, undoSale } from '../carMoney';
import { CarMoneyDialog } from './CarMoneyDialog';
import { Card, EmptyState, inputClass, PrimaryButton, formatMoney } from '../../shop/adminUi';
import { matchesSearch } from '../../shop/store/shopSearchStore';
import { CarTabProps } from './CarEditor';

const Stat: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="bg-white border border-neutral-200 rounded-2xl p-3">
    <div className="text-[10px] font-bold text-neutral-400">{label}</div>
    <div className="text-lg font-black" style={{ color }}>{value}</div>
  </div>
);

export const InventoryTab: React.FC<CarTabProps> = ({ data, update, onEdit }) => {
  const [filter, setFilter] = useState<CarStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [moneyFor, setMoneyFor] = useState<string | null>(null);
  const currency = data.settings.currency;

  const setCar = (id: string, changes: Partial<Car>) =>
    update((d) => ({ ...d, cars: d.cars.map((c) => (c.id === id ? { ...c, ...changes, updatedAt: new Date().toISOString() } : c)) }));
  // «مباعة» goes through the sale window (price, buyer, payment); leaving «مباعة» undoes the sale.
  const setStatus = (car: Car, status: CarStatus) => {
    if (status === car.status) return;
    if (status === 'sold' && !car.sale) return setMoneyFor(car.id);
    if (car.sale && status !== 'sold') {
      if (!window.confirm('إلغاء بيع هذه السيارة؟ تُحذف دفعات بيعها من الحسابات.')) return;
      return update((d) => {
        const next = undoSale(d, car.id);
        return { ...next, cars: next.cars.map((c) => (c.id === car.id ? { ...c, status } : c)) };
      });
    }
    setCar(car.id, { status });
  };
  const remove = (car: Car) => {
    if (!window.confirm(`حذف ${carTitle(car)} ${car.year || ''} نهائيًا من المعرض والمخزون؟ تبقى قيوده في الحسابات ويمكن حذفها من هناك.`)) return;
    update((d) => ({ ...d, cars: d.cars.filter((c) => c.id !== car.id) }));
  };

  const shown = useMemo(
    () => data.cars.filter((c) => (filter === 'all' || c.status === filter) && matchesSearch([c.brand, c.model, c.trim, String(c.year), c.stockNumber, c.vin, c.color], query)),
    [data.cars, filter, query]
  );
  const inStock = data.cars.filter((c) => c.status !== 'sold');
  const stockValue = inStock.reduce((s, c) => s + carCost(c), 0);
  const expected = inStock.reduce((s, c) => s + expectedProfit(c), 0);
  const count = (s: CarStatus) => data.cars.filter((c) => c.status === s).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="في المعرض الآن" value={String(inStock.length)} />
        <Stat label="محجوزة" value={String(count('reserved'))} color="#f29900" />
        <Stat label="قيمة المخزون (الكلفة)" value={formatMoney(stockValue, currency)} />
        <Stat label="الربح المتوقع" value={formatMoney(expected, currency)} color="#34a853" />
      </div>

      <Card
        title={`السيارات (${data.cars.length})`}
        actions={<PrimaryButton onClick={() => onEdit('')} className="h-9 flex items-center gap-1"><Plus size={14} /> إضافة سيارة</PrimaryButton>}
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-neutral-400" />
            <input className={`${inputClass} pr-9`} placeholder="ابحث بالماركة، الموديل، الرقم، الشاصي..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1">
            {[{ id: 'all' as const, label: 'الكل' }, ...CAR_STATUSES].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilter(s.id)}
                className={`h-10 px-3 rounded-xl text-xs font-bold border cursor-pointer ${filter === s.id ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'bg-white text-neutral-600 border-neutral-200'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <EmptyState text={data.cars.length ? 'لا توجد سيارات مطابقة' : 'لا توجد سيارات بعد. أضف أول سيارة من «إضافة سيارة».'} />
        ) : (
          <div className="divide-y divide-neutral-100">
            {shown.map((c) => {
              const st = statusMeta(c.status);
              const margin = c.sale ? carProfit(c) : expectedProfit(c);
              const owed = saleRemaining(c);
              return (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-24 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-300">
                      {c.images[0] ? <img src={c.images[0]} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <ImageOff size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-[#1d1d1f] truncate">{carTitle(c)} · {carSubtitle(c)}</div>
                      <div className="text-[11px] text-neutral-500 truncate">
                        {[c.stockNumber, c.condition === 'new' ? 'جديدة' : formatKm(c.mileage), c.color].filter(Boolean).join(' · ')}
                      </div>
                      <div className="text-xs font-bold mt-0.5">
                        {c.sale ? <>بيعت بـ {formatMoney(c.sale.price, c.currency)}</> : c.price > 0 ? formatMoney(c.price, c.currency) : <span className="text-neutral-400">بدون سعر</span>}
                        {margin !== 0 && <span className={`mr-2 text-[11px] ${margin > 0 ? 'text-green-600' : 'text-red-500'}`}>{c.sale ? 'ربح' : 'ربح متوقع'} {formatMoney(margin, c.currency)}</span>}
                        {owed > 0 && <span className="mr-2 text-[11px] text-[#f29900]">متبقٍ على المشتري {formatMoney(owed, c.currency)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!c.sale && (
                      <button type="button" onClick={() => setMoneyFor(c.id)} className="h-9 px-3 rounded-xl bg-[#34a853] hover:bg-[#2d9047] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"><BadgeCheck size={14} /> تم البيع</button>
                    )}
                    <button type="button" onClick={() => setMoneyFor(c.id)} title="الملف المالي: المصاريف والبيع والدفعات" aria-label="الملف المالي" className="w-9 h-9 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 flex items-center justify-center cursor-pointer"><Wallet size={15} /></button>
                    <select
                      value={c.status}
                      onChange={(e) => setStatus(c, e.target.value as CarStatus)}
                      className="h-9 px-2 rounded-xl border text-xs font-bold cursor-pointer outline-none"
                      style={{ color: st.color, borderColor: `${st.color}55`, backgroundColor: `${st.color}12` }}
                      aria-label="حالة السيارة"
                    >
                      {CAR_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <button type="button" onClick={() => setCar(c.id, { published: !c.published })} title={c.published ? 'ظاهرة في المعرض: اضغط للإخفاء' : 'مخفية: اضغط للعرض في المعرض'} aria-label={c.published ? 'إخفاء من المعرض' : 'عرض في المعرض'} className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer ${c.published ? 'border-green-200 bg-green-50 text-green-600' : 'border-neutral-200 text-neutral-400'}`}>
                      {c.published ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button type="button" onClick={() => setCar(c.id, { featured: !c.featured })} title="سيارة مميزة" aria-label="سيارة مميزة" aria-pressed={c.featured} className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer ${c.featured ? 'border-amber-200 bg-amber-50 text-amber-500' : 'border-neutral-200 text-neutral-400'}`}>
                      <Star size={15} fill={c.featured ? 'currentColor' : 'none'} />
                    </button>
                    <button type="button" onClick={() => onEdit(c.id)} aria-label="تعديل" className="w-9 h-9 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 flex items-center justify-center cursor-pointer"><Pencil size={15} /></button>
                    <button type="button" onClick={() => remove(c)} aria-label="حذف" className="w-9 h-9 rounded-xl border border-neutral-200 text-neutral-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center cursor-pointer"><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      {moneyFor && <CarMoneyDialog data={data} update={update} carId={moneyFor} onClose={() => setMoneyFor(null)} />}
    </div>
  );
};
