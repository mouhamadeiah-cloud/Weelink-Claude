// إضافة سيارة: the car entry, one step after the other (the car, specifications, features and
// condition, photos, price and purchase, showroom), with the car's showroom card beside every step.
// The last step saves the car to the showroom or keeps it in the inventory only.
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Store, Archive, Plus, X } from 'lucide-react';
import {
  Car, CarAdminData, emptyCar, nextStockNumber, CAR_BRANDS, CAR_BODY_TYPES, CAR_FUELS, CAR_TRANSMISSIONS, CAR_DRIVES,
  CAR_SPECS, CAR_COLORS, CAR_INTERIOR_COLORS, CAR_FEATURE_GROUPS, CAR_PAINT, CAR_ACCIDENTS, CAR_BADGES, CAR_STATUSES, CAR_CURRENCIES,
} from '../carTypes';
import { newId } from '../../shop/shopTypes';
import { Card, Field, inputClass, textareaClass, PrimaryButton, GhostButton, Toggle, formatMoney } from '../../shop/adminUi';
import { CarCard } from '../store/CarCard';
import { CarImages } from './CarImages';
import { carTitle } from '../carModel';

export interface CarTabProps {
  data: CarAdminData;
  update: (fn: (d: CarAdminData) => CarAdminData) => void;
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onSaved: () => void;
}

const STEPS = ['السيارة', 'المواصفات', 'التجهيزات والحالة', 'الصور', 'السعر والشراء', 'العرض في المعرض'];
const LAST = STEPS.length;
const YEARS = Array.from({ length: 45 }, (_, i) => new Date().getFullYear() + 1 - i);

const num = (v: string) => {
  const n = parseFloat(v.replace(/,/g, ''));
  return isFinite(n) && n > 0 ? n : 0;
};

// A text field with suggestions that still accepts any text.
const Suggest: React.FC<{ id: string; value: string; options: string[]; placeholder?: string; onChange: (v: string) => void }> = ({ id, value, options, placeholder, onChange }) => (
  <>
    <input className={inputClass} list={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    <datalist id={id}>{options.map((o) => <option key={o} value={o} />)}</datalist>
  </>
);

// One-tap choices.
function Chips<T extends string | number>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          onClick={() => onChange(o.id)}
          className={`h-9 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${value === o.id ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const list = (items: string[]) => items.map((x) => ({ id: x, label: x }));

export const CarEditor: React.FC<CarTabProps> = ({ data, update, editingId, onEdit, onSaved }) => {
  const existing = editingId ? data.cars.find((c) => c.id === editingId) : undefined;
  const [car, setCar] = useState<Car>(() => existing || emptyCar(data.settings.currency));
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [customFeature, setCustomFeature] = useState('');

  // Opening another car (or a new one) from the inventory starts over.
  useEffect(() => {
    setCar(existing || emptyCar(data.settings.currency));
    setStep(1);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  const set = (changes: Partial<Car>) => setCar((c) => ({ ...c, ...changes }));
  const models = useMemo(() => CAR_BRANDS.find((b) => b.brand === car.brand.trim())?.models || [], [car.brand]);
  const allFeatures = CAR_FEATURE_GROUPS.flatMap((g) => g.items);
  const customFeatures = car.features.filter((f) => !allFeatures.includes(f));
  const toggleFeature = (f: string) => set({ features: car.features.includes(f) ? car.features.filter((x) => x !== f) : [...car.features, f] });
  const addCustomFeature = () => {
    const f = customFeature.trim();
    if (f && !car.features.includes(f)) set({ features: [...car.features, f] });
    setCustomFeature('');
  };

  const goTo = (n: number) => {
    if (n > 1 && (!car.brand.trim() || !car.model.trim())) {
      setError('اكتب الماركة والموديل أولًا.');
      setStep(1);
      return;
    }
    setError('');
    setStep(n);
  };

  const save = (published: boolean) => {
    if (!car.brand.trim() || !car.model.trim()) {
      setError('اكتب الماركة والموديل أولًا.');
      setStep(1);
      return;
    }
    const now = new Date().toISOString();
    update((d) => {
      const saved: Car = {
        ...car,
        brand: car.brand.trim(),
        model: car.model.trim(),
        id: car.id || newId('car'),
        stockNumber: car.stockNumber.trim() || nextStockNumber(d.cars),
        published,
        createdAt: car.createdAt || now,
        updatedAt: now,
      };
      return d.cars.some((c) => c.id === saved.id)
        ? { ...d, cars: d.cars.map((c) => (c.id === saved.id ? saved : c)) }
        : { ...d, cars: [saved, ...d.cars] };
    });
    onEdit(null);
    setCar(emptyCar(data.settings.currency));
    setStep(1);
    onSaved();
  };

  const margin = car.price > 0 && car.purchasePrice > 0 ? car.price - car.purchasePrice : 0;
  const preview: Car = { ...car, stockNumber: car.stockNumber || nextStockNumber(data.cars) };

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
      <div className="space-y-4 min-w-0">
        {existing && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-xs font-bold text-[#0071e3]">
            <span>تعديل: {carTitle(existing)} {existing.year || ''} · {existing.stockNumber}</span>
            <button type="button" onClick={() => onEdit(null)} className="flex items-center gap-1 cursor-pointer"><X size={13} /> سيارة جديدة</button>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => goTo(i + 1)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-bold transition cursor-pointer ${step === i + 1 ? 'bg-[#1d1d1f] text-white' : step > i + 1 ? 'bg-white text-[#1d1d1f] border border-neutral-200' : 'bg-white text-neutral-400 border border-neutral-200'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === i + 1 ? 'bg-white text-[#1d1d1f]' : 'bg-neutral-100'}`}>{i + 1}</span>
              {s}
            </button>
          ))}
        </div>
        {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold">{error}</div>}

        {step === 1 && (
          <Card title="السيارة">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="الماركة *"><Suggest id="car-brands" value={car.brand} options={CAR_BRANDS.map((b) => b.brand)} placeholder="مثال: كيا" onChange={(brand) => set({ brand })} /></Field>
              <Field label="الموديل *"><Suggest id="car-models" value={car.model} options={models} placeholder="مثال: سيراتو" onChange={(model) => set({ model })} /></Field>
              <Field label="الفئة" hint="مثل: GT Line، فل كامل، ستاندر"><input className={inputClass} value={car.trim} onChange={(e) => set({ trim: e.target.value })} /></Field>
              <Field label="سنة الصنع">
                <select className={inputClass} value={car.year} onChange={(e) => set({ year: parseInt(e.target.value, 10) })}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
              <Field label="نوع الهيكل"><Chips options={list(CAR_BODY_TYPES)} value={car.bodyType} onChange={(bodyType) => set({ bodyType })} /></Field>
              <Field label="الحالة"><Chips options={[{ id: 'used', label: 'مستعملة' }, { id: 'new', label: 'جديدة' }]} value={car.condition} onChange={(condition) => set({ condition })} /></Field>
              <Field label="رقم السيارة في المعرض" hint="يُملأ تلقائيًا إن تركته فارغًا"><input className={inputClass} value={car.stockNumber} placeholder={nextStockNumber(data.cars)} onChange={(e) => set({ stockNumber: e.target.value })} dir="ltr" /></Field>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card title="المواصفات">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="الممشى (كم)"><input className={inputClass} inputMode="numeric" value={car.mileage || ''} onChange={(e) => set({ mileage: num(e.target.value) })} dir="ltr" /></Field>
              <Field label="المواصفات"><Suggest id="car-specs" value={car.specs} options={CAR_SPECS} placeholder="خليجي، أمريكي..." onChange={(specs) => set({ specs })} /></Field>
              <Field label="الوقود"><Chips options={list(CAR_FUELS)} value={car.fuel} onChange={(fuel) => set({ fuel })} /></Field>
              <Field label="ناقل الحركة"><Chips options={list(CAR_TRANSMISSIONS)} value={car.transmission} onChange={(transmission) => set({ transmission })} /></Field>
              <Field label="نظام الدفع"><Chips options={list(CAR_DRIVES)} value={car.drive} onChange={(drive) => set({ drive })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="سعة المحرك (سي سي)"><input className={inputClass} inputMode="numeric" value={car.engineCc || ''} onChange={(e) => set({ engineCc: num(e.target.value) })} dir="ltr" /></Field>
                <Field label="القوة (حصان)"><input className={inputClass} inputMode="numeric" value={car.horsepower || ''} onChange={(e) => set({ horsepower: num(e.target.value) })} dir="ltr" /></Field>
              </div>
              <Field label="اللون الخارجي"><Suggest id="car-colors" value={car.color} options={CAR_COLORS} onChange={(color) => set({ color })} /></Field>
              <Field label="اللون الداخلي"><Suggest id="car-icolors" value={car.interiorColor} options={CAR_INTERIOR_COLORS} onChange={(interiorColor) => set({ interiorColor })} /></Field>
              <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                <Field label="الأبواب"><input className={inputClass} inputMode="numeric" value={car.doors || ''} onChange={(e) => set({ doors: num(e.target.value) })} dir="ltr" /></Field>
                <Field label="المقاعد"><input className={inputClass} inputMode="numeric" value={car.seats || ''} onChange={(e) => set({ seats: num(e.target.value) })} dir="ltr" /></Field>
                <Field label="عدد المالكين"><input className={inputClass} inputMode="numeric" value={car.owners || ''} onChange={(e) => set({ owners: num(e.target.value) })} dir="ltr" /></Field>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <>
            <Card title="التجهيزات" actions={<span className="text-[10px] text-neutral-400">{car.features.length} مختارة</span>}>
              {CAR_FEATURE_GROUPS.map((g) => (
                <div key={g.title} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-neutral-500">{g.title}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((f) => {
                      const on = car.features.includes(f);
                      return (
                        <button key={f} type="button" onClick={() => toggleFeature(f)} aria-pressed={on} className={`h-8 px-3 rounded-full border text-xs font-bold transition cursor-pointer ${on ? 'border-[#0071e3] bg-[#0071e3] text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'}`}>
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-neutral-500">تجهيزات أخرى</div>
                <div className="flex flex-wrap gap-1.5">
                  {customFeatures.map((f) => (
                    <span key={f} className="h-8 pr-3 pl-1.5 rounded-full bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1">
                      {f}
                      <button type="button" onClick={() => toggleFeature(f)} className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center cursor-pointer" aria-label={`حذف ${f}`}><X size={11} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={inputClass} value={customFeature} placeholder="اكتب ميزة واضغط إضافة" onChange={(e) => setCustomFeature(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomFeature(); } }} />
                  <GhostButton onClick={addCustomFeature} className="h-10 shrink-0 flex items-center gap-1"><Plus size={13} /> إضافة</GhostButton>
                </div>
              </div>
            </Card>
            {car.condition === 'used' && (
              <Card title="الحالة">
                <Field label="الدهان"><Chips options={CAR_PAINT} value={car.paint} onChange={(paint) => set({ paint })} /></Field>
                <Field label="الحوادث"><Chips options={CAR_ACCIDENTS} value={car.accidents} onChange={(accidents) => set({ accidents })} /></Field>
                <Field label="ملاحظات الحالة" hint="تظهر للزبون في صفحة السيارة: الصيانة، الإطارات، ما تم تبديله..."><textarea className={textareaClass} value={car.conditionNotes} onChange={(e) => set({ conditionNotes: e.target.value })} /></Field>
              </Card>
            )}
          </>
        )}

        {step === 4 && (
          <Card title="الصور">
            <CarImages images={car.images} onChange={(images) => set({ images })} />
          </Card>
        )}

        {step === 5 && (
          <>
            <Card title="السعر للزبون">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="السعر">
                  <div className="flex gap-2">
                    <input className={inputClass} inputMode="decimal" value={car.price || ''} onChange={(e) => set({ price: num(e.target.value) })} dir="ltr" />
                    <select className={`${inputClass} !w-24`} value={car.currency} onChange={(e) => set({ currency: e.target.value })}>
                      {CAR_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </Field>
                <Field label="السعر قبل التخفيض" hint="اختياري، يظهر مشطوبًا"><input className={inputClass} inputMode="decimal" value={car.oldPrice || ''} onChange={(e) => set({ oldPrice: num(e.target.value) })} dir="ltr" /></Field>
              </div>
              <div className="divide-y divide-neutral-100">
                <Toggle checked={car.showPrice} onChange={(showPrice) => set({ showPrice })} label="إظهار السعر في المعرض" />
                <Toggle checked={car.negotiable} onChange={(negotiable) => set({ negotiable })} label="قابل للتفاوض" />
              </div>
              {!car.showPrice && <p className="text-[11px] text-neutral-400">يرى الزبون «السعر عند التواصل» بدل السعر.</p>}
            </Card>
            <Card title="الشراء" actions={<span className="text-[10px] text-neutral-400">لا يظهر للزبون</span>}>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="سعر الشراء"><input className={inputClass} inputMode="decimal" value={car.purchasePrice || ''} onChange={(e) => set({ purchasePrice: num(e.target.value) })} dir="ltr" /></Field>
                <Field label="تاريخ الشراء"><input type="date" className={inputClass} value={car.purchaseDate} onChange={(e) => set({ purchaseDate: e.target.value })} /></Field>
                <Field label="اشتُريت من"><input className={inputClass} value={car.purchaseFrom} onChange={(e) => set({ purchaseFrom: e.target.value })} /></Field>
                <Field label="رقم الهيكل (الشاصي)"><input className={inputClass} value={car.vin} onChange={(e) => set({ vin: e.target.value.toUpperCase() })} dir="ltr" /></Field>
              </div>
              <Field label="ملاحظات داخلية"><textarea className={textareaClass} value={car.internalNotes} onChange={(e) => set({ internalNotes: e.target.value })} /></Field>
              {margin !== 0 && (
                <div className={`rounded-xl px-3 py-2 text-xs font-bold ${margin > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  الربح المتوقع: {formatMoney(margin, car.currency)}
                </div>
              )}
            </Card>
          </>
        )}

        {step === 6 && (
          <>
            <Card title="العرض في المعرض">
              <Field label="الشرح" hint="يظهر في صفحة السيارة تحت «عن السيارة»"><textarea className={`${textareaClass} min-h-[120px]`} value={car.description} onChange={(e) => set({ description: e.target.value })} /></Field>
              <Field label="شارة على الصورة">
                <div className="space-y-2">
                  <Chips options={[{ id: '', label: 'بدون' }, ...list(CAR_BADGES)]} value={CAR_BADGES.includes(car.badge) || !car.badge ? car.badge : '__custom'} onChange={(badge) => set({ badge })} />
                  <input className={inputClass} value={car.badge} placeholder="أو اكتب شارتك" onChange={(e) => set({ badge: e.target.value })} />
                </div>
              </Field>
              <Field label="حالة السيارة">
                <Chips options={CAR_STATUSES.map((s) => ({ id: s.id, label: s.label }))} value={car.status} onChange={(status) => set({ status })} />
              </Field>
              <div className="rounded-xl border border-neutral-200 px-3 py-1.5">
                <Toggle checked={car.featured} onChange={(featured) => set({ featured })} label="سيارة مميزة (تظهر في شرائح السيارات المميزة)" />
              </div>
            </Card>
            <div className="grid sm:grid-cols-2 gap-2">
              <PrimaryButton onClick={() => save(true)} className="h-12 flex items-center justify-center gap-1.5 text-sm">
                <Store size={16} /> حفظ ونشر في المعرض
              </PrimaryButton>
              <GhostButton onClick={() => save(false)} className="h-12 flex items-center justify-center gap-1.5 text-sm">
                <Archive size={16} /> حفظ في المخزون فقط
              </GhostButton>
            </div>
          </>
        )}

        <div className="flex gap-2">
          {step > 1 && <GhostButton onClick={() => goTo(step - 1)} className="h-11 flex items-center gap-1"><ArrowRight size={13} /> رجوع</GhostButton>}
          {step < LAST && (
            <PrimaryButton onClick={() => goTo(step + 1)} className="flex-1 h-11 flex items-center justify-center gap-1.5">
              التالي: {STEPS[step]} <ArrowLeft size={14} />
            </PrimaryButton>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-0 space-y-2">
        <div className="text-[11px] font-bold text-neutral-400">هكذا تظهر في المعرض</div>
        <CarCard car={preview} look={{ accent: '#C8102E', cardBg: '#FFFFFF', text: '#1d1d1f', radius: 22, font: "'IBM Plex Sans Arabic', sans-serif" }} onOpen={() => {}} />
      </aside>
    </div>
  );
};
