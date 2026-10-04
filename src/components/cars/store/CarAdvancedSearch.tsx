// «بحث متقدم»: the visitor narrows the showroom by brand and model, year, price and km ranges,
// fuel, gearbox, body, colour, condition, drive, specs, number of owners, accidents and paint.
// Every choice offers only what the published cars actually have, and the button shows how many
// cars match before the visitor applies it.
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { Car } from '../carTypes';
import { CarFilters, EMPTY_CAR_FILTERS, carMatchesFilters } from './carFilterStore';

interface Props {
  cars: Car[];
  initial: CarFilters;
  accent: string;
  font: string;
  onApply: (f: CarFilters) => void;
  onClose: () => void;
}

const uniq = (values: (string | undefined)[]) => [...new Set(values.filter((v): v is string => !!v && !!v.trim()))].sort((a, b) => a.localeCompare(b, 'ar'));

const field = 'w-full h-11 px-3 rounded-xl border border-black/10 bg-white text-sm text-[#1d1d1f] outline-none focus:border-black/30';
const label = 'block text-[12px] font-bold text-neutral-500 mb-1.5';

const Chips: React.FC<{ title: string; values: string[]; value: string; accent: string; onPick: (v: string) => void }> = ({ title, values, value, accent, onPick }) =>
  values.length ? (
    <div>
      <span className={label}>{title}</span>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <button key={v} type="button" onClick={() => onPick(value === v ? '' : v)} aria-pressed={value === v}
            className="h-9 px-3.5 rounded-full border text-[13px] font-semibold cursor-pointer transition"
            style={value === v ? { backgroundColor: accent, borderColor: accent, color: '#fff' } : { borderColor: 'rgba(0,0,0,0.1)', color: '#1d1d1f', backgroundColor: '#fff' }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  ) : null;

const Range: React.FC<{ title: string; from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void; unit?: string }> = ({ title, from, to, onFrom, onTo, unit }) => (
  <div>
    <span className={label}>{title}{unit ? ` (${unit})` : ''}</span>
    <div className="flex items-center gap-2">
      <input className={field} dir="ltr" inputMode="numeric" placeholder="من" aria-label={`${title} من`} value={from} onChange={(e) => onFrom(e.target.value.replace(/[^\d]/g, ''))} />
      <span className="text-neutral-400 text-sm">-</span>
      <input className={field} dir="ltr" inputMode="numeric" placeholder="إلى" aria-label={`${title} إلى`} value={to} onChange={(e) => onTo(e.target.value.replace(/[^\d]/g, ''))} />
    </div>
  </div>
);

export const CarAdvancedSearch: React.FC<Props> = ({ cars, initial, accent, font, onApply, onClose }) => {
  const [f, setF] = useState<CarFilters>(initial);
  const set = (changes: Partial<CarFilters>) => setF((prev) => ({ ...prev, ...changes }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const brands = useMemo(() => uniq(cars.map((c) => c.brand)), [cars]);
  const models = useMemo(() => uniq(cars.filter((c) => !f.brand || c.brand === f.brand).map((c) => c.model)), [cars, f.brand]);
  const years = useMemo(() => {
    const ys = cars.map((c) => c.year).filter(Boolean);
    if (!ys.length) return [];
    const out: number[] = [];
    for (let y = Math.max(...ys); y >= Math.min(...ys); y--) out.push(y);
    return out;
  }, [cars]);
  const chipsOf = (key: 'fuel' | 'transmission' | 'bodyType' | 'color' | 'drive' | 'specs') => uniq(cars.map((c) => c[key]));
  const count = useMemo(() => cars.filter((c) => carMatchesFilters(c, f)).length, [cars, f]);
  const currency = cars.find((c) => c.price > 0)?.currency || '';


  return createPortal(
    <div className="fixed inset-0 z-[2000001] bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-6" onMouseDown={onClose}>
      <div dir="rtl" role="dialog" aria-label="بحث متقدم" className="w-full max-w-3xl max-h-[92vh] bg-[#f7f7f8] rounded-t-3xl sm:rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden text-right text-[#1d1d1f]" style={{ fontFamily: font }} onMouseDown={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-3 px-5 h-16 bg-white border-b border-black/[0.06] shrink-0">
          <SlidersHorizontal size={20} style={{ color: accent }} />
          <h2 className="flex-1 text-lg font-black">بحث متقدم</h2>
          <button type="button" onClick={() => setF(EMPTY_CAR_FILTERS)} className="h-9 px-3 rounded-full text-[13px] font-bold text-neutral-500 hover:bg-black/[0.04] flex items-center gap-1 cursor-pointer"><RotateCcw size={14} /> مسح الكل</button>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-full hover:bg-black/[0.05] flex items-center justify-center text-neutral-500 cursor-pointer"><X size={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label} htmlFor="adv-brand">الماركة</label>
              <select id="adv-brand" className={field} value={f.brand} onChange={(e) => set({ brand: e.target.value, model: '' })}>
                <option value="">كل الماركات</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="adv-model">الموديل</label>
              <select id="adv-model" className={field} value={f.model} onChange={(e) => set({ model: e.target.value })}>
                <option value="">كل الموديلات</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <span className={label}>سنة الصنع</span>
              <div className="flex items-center gap-2">
                <select className={field} aria-label="سنة الصنع من" value={f.yearFrom} onChange={(e) => set({ yearFrom: e.target.value })}>
                  <option value="">من</option>
                  {[...years].reverse().map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-neutral-400 text-sm">-</span>
                <select className={field} aria-label="سنة الصنع إلى" value={f.yearTo} onChange={(e) => set({ yearTo: e.target.value })}>
                  <option value="">إلى</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <Range title="السعر" unit={currency} from={f.priceFrom} to={f.priceTo} onFrom={(v) => set({ priceFrom: v })} onTo={(v) => set({ priceTo: v })} />
            <Range title="الممشى" unit="كم" from={f.kmFrom} to={f.kmTo} onFrom={(v) => set({ kmFrom: v })} onTo={(v) => set({ kmTo: v })} />
            <div>
              <label className={label} htmlFor="adv-owners">عدد الملاك</label>
              <select id="adv-owners" className={field} value={f.maxOwners} onChange={(e) => set({ maxOwners: e.target.value })}>
                <option value="">أي عدد</option>
                <option value="1">مالك واحد</option>
                <option value="2">حتى مالكين</option>
                <option value="3">حتى 3 ملاك</option>
              </select>
            </div>
          </div>

          <div>
            <span className={label}>الحالة</span>
            <div className="inline-flex p-1 rounded-full bg-white border border-black/10">
              {([['', 'الكل'], ['new', 'جديدة'], ['used', 'مستعملة']] as const).map(([id, text]) => (
                <button key={id} type="button" onClick={() => set({ condition: id })} aria-pressed={f.condition === id}
                  className="h-9 px-5 rounded-full text-[13px] font-bold cursor-pointer" style={f.condition === id ? { backgroundColor: accent, color: '#fff' } : { color: '#1d1d1f' }}>
                  {text}
                </button>
              ))}
            </div>
          </div>

          <Chips title="الوقود" values={chipsOf('fuel')} value={f.fuel} accent={accent} onPick={(fuel) => set({ fuel })} />
          <Chips title="ناقل الحركة" values={chipsOf('transmission')} value={f.transmission} accent={accent} onPick={(transmission) => set({ transmission })} />
          <Chips title="نوع الهيكل" values={chipsOf('bodyType')} value={f.body} accent={accent} onPick={(body) => set({ body })} />
          <Chips title="اللون" values={chipsOf('color')} value={f.color} accent={accent} onPick={(color) => set({ color })} />
          <Chips title="نظام الدفع" values={chipsOf('drive')} value={f.drive} accent={accent} onPick={(drive) => set({ drive })} />
          <Chips title="المواصفات" values={chipsOf('specs')} value={f.specs} accent={accent} onPick={(specs) => set({ specs })} />

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="checkbox" className="w-4 h-4" style={{ accentColor: accent }} checked={f.noAccidents} onChange={(e) => set({ noAccidents: e.target.checked })} /> بدون حوادث
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="checkbox" className="w-4 h-4" style={{ accentColor: accent }} checked={f.originalPaint} onChange={(e) => set({ originalPaint: e.target.checked })} /> دهان أصلي بالكامل
            </label>
          </div>
        </div>

        <footer className="p-4 bg-white border-t border-black/[0.06] shrink-0">
          <button type="button" onClick={() => onApply(f)} disabled={count === 0} className="w-full h-12 rounded-full text-white text-[15px] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-default" style={{ backgroundColor: accent }}>
            {count === 0 ? 'لا توجد سيارات بهذه المواصفات' : `عرض ${count} ${count === 1 ? 'سيارة' : count === 2 ? 'سيارتين' : count <= 10 ? 'سيارات' : 'سيارة'}`}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};
