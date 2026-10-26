// How each car and item of a rental is rented (by the day or the hour, periods, driver, special prices),
// kept in the page's rental schedule («إعدادات الحجز») and edited here, beside the warehouse: the
// same unit editor as there. `only` shows one item, `focusItem` opens one.
import React, { useContext, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { BookingPageContext } from '../../services/bookings';
import { saveBookingSettings, useBookingSettings } from '../../services/bookingSettings';
import { newRentalId, normalizeExtras, normalizeUnit, type RentalExtra } from '../../services/rentalBooking';
import { ExtrasEditor, UnitEditor, toggleUnit, type Unit } from '../pageAdmin/RentalScheduleEditor';
import { GhostButton, PrimaryButton, inputClass } from '../shop/adminUi';

// Ready services to start from: for a machine or a car, a hall, a chalet.
const PRESETS = ['توصيل للمنزل', 'مع عامل', 'مع سائق', 'تنظيف', 'عشاء', 'مشروبات', 'DJ', 'تركيب وفك'];

export const RentalPricing: React.FC<{ only?: string; focusItem?: string }> = ({ only, focusItem }) => {
  const page = useContext(BookingPageContext);
  const settings = useBookingSettings(page?.owner, page?.project);
  const [draft, setDraft] = useState<{ rooms: Unit[]; extras: RentalExtra[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [query, setQuery] = useState('');
  if (!page) return null;
  if (settings === undefined) return <div className="text-xs text-neutral-400">…</div>;
  const schedule = settings?.schedules.find((s) => s.type === 'stay' && s.rental);
  const units = draft?.rooms || ((schedule?.rooms || []).map((r) => ({ ...r, ...normalizeUnit(r) })) as Unit[]);
  const extras = draft?.extras || normalizeExtras(schedule?.extras);
  const shown = units.filter((u) => (only ? u.item === only : !query.trim() || u.name.toLowerCase().includes(query.trim().toLowerCase())));
  const edit = (patch: Partial<{ rooms: Unit[]; extras: RentalExtra[] }>) => {
    setNote(null);
    setDraft({ rooms: units, extras, ...patch });
  };
  const setUnit = (id: string, patch: Partial<Unit>) => edit({ rooms: units.map((u) => (u.id === id ? { ...u, ...patch } : u)) });
  const toggleExtra = (extraId: string, unitId: string) =>
    edit({ extras: extras.map((x) => (x.id === extraId ? { ...x, units: toggleUnit(x, unitId, units.map((u) => u.id)) } : x)) });
  const save = async () => {
    if (!draft || !settings || !schedule) return;
    setBusy(true);
    try {
      await saveBookingSettings(page.owner, page.project, { ...settings, schedules: settings.schedules.map((s) => (s.id === schedule.id ? { ...s, rooms: draft.rooms, extras: draft.extras } : s)) });
      setDraft(null);
      setNote({ ok: true, text: 'تم حفظ أسعار التأجير.' });
    } catch {
      setNote({ ok: false, text: 'تعذر الحفظ. حاول مرة ثانية.' });
    }
    setBusy(false);
  };

  if (shown.length === 0) {
    return (
      <div className="text-xs font-bold text-[#A34A00]">
        {only ? 'جاري تجهيز العنصر للتأجير… إذا ما ظهر خلال ثواني تأكد أنه «ظاهر في الصفحة».' : units.length ? 'لا نتائج لهذا البحث.' : 'لسا ما في سيارات أو عناصر ظاهرة. أضف من «إضافة للمعرض» وبتظهر هون لحالها.'}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {!only && (
        <>
          <p className="text-xs text-neutral-500 leading-relaxed">اضغط على عنصر لتحدد كيف بيتأجّر: باليوم أو بالساعة، الفترات، السائق، والأيام والساعات المميزة بسعر آخر.</p>
          {units.length > 6 && (
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input className={`${inputClass} h-9 pr-8`} placeholder="بحث بالاسم" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          )}
        </>
      )}
      {!only && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 space-y-2">
          <div className="text-sm font-black text-ink">مكتبة الخدمات الإضافية</div>
          <p className="text-xs text-neutral-500 leading-relaxed">تكتب الخدمة مرة وحدة هون، وبعدها تعلّم عليها من بطاقة كل عنصر تحت. الزبون بيختارها قبل الطلب، وبتنضاف للمجموع والعربون وللعقد، والوصف بيظهر له خلف علامة «؟».</p>
          <ExtrasEditor extras={extras} units={units} onChange={(next) => edit({ extras: next })} />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-400">خدمات جاهزة:</span>
            {PRESETS.filter((n) => !extras.some((x) => x.name === n)).map((n) => (
              <GhostButton key={n} onClick={() => edit({ extras: [...extras, { id: newRentalId('e'), name: n, price: 0, per: 'once', units: [], note: '' }] })}>+ {n}</GhostButton>
            ))}
          </div>
        </div>
      )}
      {shown.map((u) => (
        <UnitEditor key={u.id} unit={u} fromWarehouse={!!u.item} defaultOpen={!!focusItem && u.item === focusItem} set={(patch) => setUnit(u.id, patch)} extras={extras} onToggleExtra={(extraId) => toggleExtra(extraId, u.id)} />
      ))}
      {note && <div className={`text-xs font-bold ${note.ok ? 'text-[#2B8A3E]' : 'text-[#E03131]'}`}>{note.ok && <Check size={13} className="inline ml-1" />}{note.text}</div>}
      <div className="flex flex-wrap gap-2">
        <PrimaryButton onClick={save} disabled={busy || !draft}>{busy ? 'جاري الحفظ…' : 'احفظ أسعار التأجير'}</PrimaryButton>
        {draft && <GhostButton onClick={() => { setDraft(null); setNote(null); }}>تراجع</GhostButton>}
      </div>
    </div>
  );
};
