// The services of a rental item, set while the item is entered (Eyad, 26 Oct): each ready service of the page («الخدمات
// الإضافية» in the booking settings) with its price beside it, ticked when this item offers it. The price can be changed for this
// item only. A new service is saved in the settings for every item.
import React, { useContext, useState } from 'react';
import { Plus } from 'lucide-react';
import { BookingPageContext } from '../../services/bookings';
import { newRentalSchedule, saveBookingSettings, useBookingSettings } from '../../services/bookingSettings';
import { extraPriceFor, newRentalId, unitIdOf, type ExtraPer, type RentalExtra } from '../../services/rentalBooking';
import { offeredTo, toggleUnit } from '../pageAdmin/RentalScheduleEditor';
import { inputFitClass } from '../shop/adminUi';

const chip = (on: boolean) => `h-9 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${on ? 'bg-brand border-brand text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`;

// The price of one service for this item: kept as typed, saved when the field is left.
const PriceField: React.FC<{ value: number; onSave: (n: number) => void }> = ({ value, onSave }) => {
  const [text, setText] = useState<string | null>(null);
  return (
    <input
      type="number" min={0} className={`${inputFitClass} w-24`} placeholder="0"
      value={text ?? (value || '')}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => { if (text !== null) onSave(Math.max(0, Number(text) || 0)); setText(null); }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
};

export const ItemServices: React.FC<{ itemId: string; currency?: string }> = ({ itemId, currency = '' }) => {
  const page = useContext(BookingPageContext);
  const settings = useBookingSettings(page?.owner, page?.project);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ name: string; price: string; per: ExtraPer; note: string }>({ name: '', price: '', per: 'unit', note: '' });
  const [error, setError] = useState('');
  if (!page || settings === undefined) return null;

  const list = settings?.schedules || [];
  const current = list.find((s) => s.type === 'stay' && s.rental);
  const base = current || newRentalSchedule();
  const unitId = (base.rooms as Array<{ id: string; item?: string }>).find((r) => r.item === itemId)?.id || unitIdOf(itemId);
  const all = Array.from(new Set([...base.rooms.map((r) => r.id), unitId]));
  const extras = base.extras;

  const save = (next: RentalExtra[]) => {
    setError('');
    const schedule = { ...base, extras: next };
    saveBookingSettings(page.owner, page.project, {
      schedules: current ? list.map((s) => (s.id === current.id ? schedule : s)) : [...list, schedule],
      ...(settings?.payments ? { payments: settings.payments } : {}),
    }).catch(() => setError('تعذر حفظ الخدمة. حاول مرة ثانية.'));
  };
  const change = (id: string, patch: (x: RentalExtra) => RentalExtra) => save(extras.map((e) => (e.id === id ? patch(e) : e)));

  const add = () => {
    if (!draft.name.trim()) return setError('اكتب اسم الخدمة.');
    save([...extras, { id: newRentalId('e'), name: draft.name.trim().slice(0, 60), price: Math.max(0, Number(draft.price) || 0), per: draft.per, units: [unitId], note: draft.note.trim().slice(0, 200) }]);
    setDraft({ name: '', price: '', per: 'unit', note: '' });
    setAdding(false);
  };

  return (
    <div className="space-y-1">
      {extras.length === 0 && !adding && <p className="text-xs text-neutral-400">ما في خدمات جاهزة بعد. أضف أول خدمة وبتنحفظ بالإعدادات لكل العناصر.</p>}
      {extras.map((x) => {
        const on = offeredTo(x, unitId);
        return (
          <div key={x.id} className="flex flex-wrap items-center gap-2 py-1.5 border-b border-neutral-100">
            <button type="button" className={`${chip(on)} min-w-32`} onClick={() => change(x.id, (e) => ({ ...e, units: toggleUnit(e, unitId, all) }))}>{x.name || 'بدون اسم'}</button>
            <PriceField
              value={extraPriceFor(x, unitId)}
              onSave={(n) => change(x.id, (e) => ({ ...e, prices: { ...(e.prices || {}), [unitId]: n } }))}
            />
            <span className="text-xs font-bold text-neutral-500">{currency} {x.per === 'unit' ? 'لكل يوم أو ساعة' : 'مرة وحدة'}</span>
            {x.prices && typeof x.prices[unitId] === 'number' && x.prices[unitId] !== x.price && <span className="text-xs text-neutral-400">سعر هذا العنصر فقط (الأصلي {x.price})</span>}
          </div>
        );
      })}
      {adding ? (
        <div className="flex flex-wrap items-center gap-2 py-2">
          <input className={`${inputFitClass} min-w-[140px]`} placeholder="كرسي أطفال، توصيل للعنوان، سائق…" value={draft.name} maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input type="number" min={0} className={`${inputFitClass} w-24`} placeholder="السعر" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          <button type="button" className={chip(draft.per === 'unit')} onClick={() => setDraft({ ...draft, per: 'unit' })}>لكل يوم أو ساعة</button>
          <button type="button" className={chip(draft.per === 'once')} onClick={() => setDraft({ ...draft, per: 'once' })}>مرة وحدة</button>
          <button type="button" className={chip(true)} onClick={add}>حفظ</button>
          <button type="button" className={chip(false)} onClick={() => setAdding(false)}>إلغاء</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {!extras.some((x) => x.name.includes('سائق')) && <button type="button" className={chip(false)} onClick={() => { setDraft({ name: 'سائق', price: '', per: 'unit', note: '' }); setAdding(true); }}>+ سائق</button>}
          <button type="button" className={chip(false)} onClick={() => setAdding(true)}><span className="inline-flex items-center gap-1"><Plus size={13} /> خدمة جديدة</span></button>
        </div>
      )}
      {error && <p className="text-xs font-bold text-[#E03131]">{error}</p>}
    </div>
  );
};
