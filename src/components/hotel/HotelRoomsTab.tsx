// «الطوابق والغرف»: the hotel's floors (or sections), the guests each room type takes, and the rooms
// themselves. A room type is a product of the shop part (its card and price per night); the rooms are
// what is booked, and each one counts toward the package's limit. Open rooms go to the booking
// (hotelUnits.ts).
import React, { useState } from 'react';
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react';
import { Card, Field, GhostButton, PrimaryButton, EmptyState, inputClass, inputFitClass } from '../shop/adminUi';
import { MAX_FLOORS, MAX_ROOMS, newHotelId, roomsOfType, typeCapacity, type HotelAdminData, type HotelRoom } from './hotelTypes';

interface Props {
  data: HotelAdminData;
  update: (fn: (d: HotelAdminData) => HotelAdminData) => void;
}

const selectClass = `${inputFitClass} cursor-pointer`;

export const HotelRoomsTab: React.FC<Props> = ({ data, update }) => {
  const types = data.shop.products;
  const [floorName, setFloorName] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [add, setAdd] = useState({ type: '', floor: '', start: '101', count: 1 });
  const [note, setNote] = useState('');
  const typeId = add.type || types[0]?.id || '';

  const addFloor = () => {
    const name = floorName.trim();
    if (!name || data.floors.length >= MAX_FLOORS) return;
    update((d) => ({ ...d, floors: [...d.floors, { id: newHotelId(), name }] }));
    setFloorName('');
  };
  const renameFloor = () => {
    if (!renaming || !renaming.name.trim()) return;
    update((d) => ({ ...d, floors: d.floors.map((f) => (f.id === renaming.id ? { ...f, name: renaming.name.trim() } : f)) }));
    setRenaming(null);
  };
  const removeFloor = (id: string) => {
    if (!window.confirm('حذف هذا الطابق؟ غرفه تبقى بدون طابق.')) return;
    update((d) => ({ ...d, floors: d.floors.filter((f) => f.id !== id), rooms: d.rooms.map((r) => (r.floor === id ? { ...r, floor: '' } : r)) }));
  };

  const addRooms = () => {
    setNote('');
    if (!typeId) return setNote('أضف نوع غرفة أولاً من «إضافة نوع غرفة».');
    const count = Math.min(100, Math.max(1, Math.round(add.count) || 1));
    if (data.rooms.length + count > MAX_ROOMS) return setNote(`أكثر عدد غرف ${MAX_ROOMS}.`);
    const start = add.start.trim();
    const m = /^(.*?)(\d+)$/.exec(start);
    const prefix = m ? m[1] : start;
    const n0 = m ? Number(m[2]) : 0;
    const width = m ? m[2].length : 0;
    const made: HotelRoom[] = Array.from({ length: count }, (_, i) => ({
      id: newHotelId() + i.toString(36),
      number: m ? `${prefix}${String(n0 + i).padStart(width, '0')}` : count === 1 ? start : `${start} ${i + 1}`,
      floor: add.floor,
      type: typeId,
      closed: false,
    }));
    const taken = new Set(data.rooms.map((r) => r.number));
    if (!start || made.some((r) => taken.has(r.number))) return setNote('في غرفة بنفس الرقم، غيّر الرقم الأول.');
    update((d) => ({ ...d, rooms: [...d.rooms, ...made] }));
    if (m) setAdd((a) => ({ ...a, start: `${prefix}${String(n0 + count).padStart(width, '0')}` }));
  };

  const patch = (id: string, p: Partial<HotelRoom>) => update((d) => ({ ...d, rooms: d.rooms.map((r) => (r.id === id ? { ...r, ...p } : r)) }));

  const groups = [...data.floors.map((f) => ({ id: f.id, name: f.name })), { id: '', name: data.floors.length ? 'بدون طابق' : 'الغرف' }]
    .map((g) => ({ ...g, rooms: data.rooms.filter((r) => r.floor === g.id) }))
    .filter((g) => g.rooms.length > 0);

  return (
    <div className="max-w-3xl space-y-4">
      <Card title="الطوابق والأقسام">
        <p className="text-xs text-neutral-400 leading-relaxed">اختياري: قسّم الغرف إلى طوابق أو أقسام (الطابق الأول، الجناح الشرقي...).</p>
        <div className="flex gap-2">
          <input className={inputClass} placeholder="اسم الطابق أو القسم" value={floorName} maxLength={40} onChange={(e) => setFloorName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addFloor(); }} />
          <GhostButton onClick={addFloor}><span className="inline-flex items-center gap-1"><Plus size={13} /> أضف</span></GhostButton>
        </div>
        {data.floors.map((f) => (
          <div key={f.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-100 bg-[#fbfbfd]">
            {renaming?.id === f.id ? (
              <>
                <input className={`${inputClass} h-9`} value={renaming.name} maxLength={40} autoFocus onChange={(e) => setRenaming({ id: f.id, name: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') renameFloor(); if (e.key === 'Escape') setRenaming(null); }} />
                <button type="button" onClick={renameFloor} className="w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 flex items-center justify-center cursor-pointer" aria-label="حفظ"><Check size={15} /></button>
                <button type="button" onClick={() => setRenaming(null)} className="w-8 h-8 rounded-lg text-neutral-400 hover:bg-neutral-100 flex items-center justify-center cursor-pointer" aria-label="إلغاء"><X size={15} /></button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink truncate">{f.name}</div>
                  <div className="text-xs text-neutral-400">{data.rooms.filter((r) => r.floor === f.id).length} غرفة</div>
                </div>
                <button type="button" onClick={() => setRenaming({ id: f.id, name: f.name })} className="w-8 h-8 rounded-lg text-neutral-500 hover:bg-neutral-100 flex items-center justify-center cursor-pointer" aria-label="إعادة تسمية"><Pencil size={14} /></button>
                <button type="button" onClick={() => removeFloor(f.id)} className="w-8 h-8 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer" aria-label="حذف"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        ))}
      </Card>

      <Card title="أنواع الغرف">
        {types.length === 0 ? (
          <EmptyState text="لا توجد أنواع غرف بعد. أضف نوعاً من «إضافة نوع غرفة»: اسمه وسعر الليلة وصوره." />
        ) : (
          types.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 bg-[#fbfbfd]">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-ink truncate">{t.name}</div>
                <div className="text-xs text-neutral-400">{roomsOfType(data, t.id)} غرفة{t.price > 0 ? ` · ${t.price} ${t.currency} / ليلة` : ''}</div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500">
                تتسع
                <input type="number" min={1} max={20} className={`${inputFitClass} w-14`} value={typeCapacity(data, t.id)} onChange={(e) => update((d) => ({ ...d, capacity: { ...d.capacity, [t.id]: Math.min(20, Math.max(1, Number(e.target.value) || 1)) } }))} />
                شخص
              </span>
            </div>
          ))
        )}
      </Card>

      <Card title="أضف غرفاً">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Field label="النوع">
            <select className={selectClass} value={typeId} onChange={(e) => setAdd({ ...add, type: e.target.value })}>
              {types.length === 0 && <option value="">—</option>}
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="الطابق أو القسم">
            <select className={selectClass} value={add.floor} onChange={(e) => setAdd({ ...add, floor: e.target.value })}>
              <option value="">بدون</option>
              {data.floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </Field>
          <Field label="رقم أول غرفة">
            <input className={inputClass} value={add.start} maxLength={20} onChange={(e) => setAdd({ ...add, start: e.target.value })} />
          </Field>
          <Field label="كم غرفة">
            <input type="number" min={1} max={100} className={inputClass} value={add.count} onChange={(e) => setAdd({ ...add, count: Number(e.target.value) || 1 })} />
          </Field>
        </div>
        <PrimaryButton onClick={addRooms}><span className="inline-flex items-center gap-1"><Plus size={14} /> أضف الغرف</span></PrimaryButton>
        {note && <div className="text-xs font-bold text-[#E03131]">{note}</div>}
      </Card>

      <Card title={`الغرف (${data.rooms.length})`}>
        {groups.length === 0 ? (
          <EmptyState text="لا توجد غرف بعد." />
        ) : (
          groups.map((g) => (
            <div key={g.id || 'none'} className="space-y-1.5">
              <div className="text-xs font-black text-neutral-500">{g.name} · {g.rooms.length}</div>
              {g.rooms.map((r) => (
                <div key={r.id} className={`grid grid-cols-[4.5rem_1fr_1fr_auto_auto] items-center gap-2 p-2 rounded-xl border border-neutral-100 bg-[#fbfbfd] ${r.closed ? 'opacity-60' : ''}`}>
                  <input className={`${inputFitClass} w-full`} value={r.number} maxLength={20} aria-label="رقم الغرفة" onChange={(e) => patch(r.id, { number: e.target.value })} />
                  <select className={`${selectClass} w-full`} value={r.type} aria-label="النوع" onChange={(e) => patch(r.id, { type: e.target.value })}>
                    {!types.some((t) => t.id === r.type) && <option value={r.type}>نوع محذوف</option>}
                    {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select className={`${selectClass} w-full`} value={r.floor} aria-label="الطابق" onChange={(e) => patch(r.id, { floor: e.target.value })}>
                    <option value="">بدون طابق</option>
                    {data.floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <label className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500 cursor-pointer">
                    <input type="checkbox" checked={r.closed} onChange={(e) => patch(r.id, { closed: e.target.checked })} /> خارج الخدمة
                  </label>
                  <button type="button" aria-label="حذف" className="text-[#E03131] cursor-pointer" onClick={() => update((d) => ({ ...d, rooms: d.rooms.filter((x) => x.id !== r.id) }))}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          ))
        )}
      </Card>
    </div>
  );
};
