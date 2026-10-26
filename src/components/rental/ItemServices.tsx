// The services of a rental item, set while the item is entered (Eyad, 26 Oct): tick the ready services of the page
// («الخدمات الإضافية» in the booking settings) it offers, or add a new one, which is saved there for every item.
import React, { useContext, useState } from 'react';
import { Plus } from 'lucide-react';
import { BookingPageContext } from '../../services/bookings';
import { newRentalSchedule, saveBookingSettings, useBookingSettings } from '../../services/bookingSettings';
import { newRentalId, unitIdOf, type ExtraPer, type RentalExtra } from '../../services/rentalBooking';
import { offeredTo, toggleUnit } from '../pageAdmin/RentalScheduleEditor';
import { inputFitClass } from '../shop/adminUi';

const chip = (on: boolean) => `h-9 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${on ? 'bg-brand border-brand text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`;

export const ItemServices: React.FC<{ itemId: string }> = ({ itemId }) => {
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

  const add = () => {
    if (!draft.name.trim()) return setError('اكتب اسم الخدمة.');
    save([...extras, { id: newRentalId('e'), name: draft.name.trim().slice(0, 60), price: Math.max(0, Number(draft.price) || 0), per: draft.per, units: [unitId], note: draft.note.trim().slice(0, 200) }]);
    setDraft({ name: '', price: '', per: 'unit', note: '' });
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      {extras.length === 0 && !adding && <p className="text-xs text-neutral-400">ما في خدمات جاهزة بعد. أضف أول خدمة وبتنحفظ بالإعدادات لكل العناصر.</p>}
      {extras.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {extras.map((x) => (
            <button key={x.id} type="button" className={chip(offeredTo(x, unitId))} onClick={() => save(extras.map((e) => (e.id === x.id ? { ...e, units: toggleUnit(e, unitId, all) } : e)))}>
              {x.name || 'بدون اسم'}{x.price > 0 ? ` · ${x.price}` : ''}
            </button>
          ))}
        </div>
      )}
      {adding ? (
        <div className="rounded-xl border border-neutral-200 p-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${inputFitClass} flex-1 min-w-[140px]`} placeholder="كرسي أطفال، توصيل للعنوان…" value={draft.name} maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <input type="number" min={0} className={`${inputFitClass} w-24`} placeholder="السعر" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
            <button type="button" className={chip(draft.per === 'unit')} onClick={() => setDraft({ ...draft, per: 'unit' })}>لكل يوم أو ساعة</button>
            <button type="button" className={chip(draft.per === 'once')} onClick={() => setDraft({ ...draft, per: 'once' })}>مرة وحدة</button>
          </div>
          <input className={`${inputFitClass} w-full`} placeholder="وصف الخدمة (اختياري)" value={draft.note} maxLength={200} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          <div className="flex gap-2">
            <button type="button" className={chip(true)} onClick={add}>حفظ الخدمة</button>
            <button type="button" className={chip(false)} onClick={() => setAdding(false)}>إلغاء</button>
          </div>
        </div>
      ) : (
        <button type="button" className={chip(false)} onClick={() => setAdding(true)}><span className="inline-flex items-center gap-1"><Plus size={13} /> خدمة جديدة</span></button>
      )}
      {error && <p className="text-xs font-bold text-[#E03131]">{error}</p>}
    </div>
  );
};
