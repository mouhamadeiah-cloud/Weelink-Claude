// الصالات والطاولات: the restaurant's halls (الصالة الداخلية، التراس...) and the tables in each, with
// their names and seats. The cashier's table plan, the tables' QR codes and the kitchen tickets all
// use these names, so a name is unique across the halls.
import React, { useState } from 'react';
import { Plus, Trash2, Armchair, Users } from 'lucide-react';
import { FloorMapEditor } from './FloorMapEditor';
import { layoutHall } from '../floorMap';
import { Hall, allTables } from '../restaurantTypes';
import { newId } from '../../shop/shopTypes';
import { Card, Field, inputClass, inputFitClass, PrimaryButton, GhostButton, EmptyState } from '../../shop/adminUi';
import { RestaurantTabProps } from './shared';

const MAX_TABLES = 150;

// The next free table number across all halls.
const nextNumber = (halls: Hall[]) => {
  const nums = allTables(halls).map((t) => parseInt(t.name, 10)).filter((n) => isFinite(n));
  return (nums.length ? Math.max(...nums) : 0) + 1;
};

export const HallsTab: React.FC<RestaurantTabProps> = ({ data, update, onGoTo }) => {
  const [hallName, setHallName] = useState('');
  const [addCount, setAddCount] = useState<Record<string, number>>({});
  const halls = data.halls;
  const total = allTables(halls).length;
  const names = allTables(halls).map((t) => t.name.trim());
  const isDuplicate = (name: string) => names.filter((n) => n === name.trim()).length > 1;

  const setHalls = (fn: (h: Hall[]) => Hall[]) => update((d) => ({ ...d, halls: fn(d.halls) }));
  const patchHall = (id: string, p: Partial<Hall>) => setHalls((hs) => hs.map((h) => (h.id === id ? { ...h, ...p } : h)));

  const addHall = () => {
    const name = hallName.trim();
    if (!name) return;
    setHalls((hs) => [...hs, layoutHall({ id: newId('hall'), name, tables: [] })]);
    setHallName('');
  };
  const removeHall = (h: Hall) => {
    if (!window.confirm(h.tables.length ? `حذف «${h.name}» مع طاولاتها (${h.tables.length})؟` : `حذف «${h.name}»؟`)) return;
    setHalls((hs) => hs.filter((x) => x.id !== h.id));
  };
  const addTables = (hallId: string, count: number) =>
    setHalls((hs) => {
      const room = Math.max(0, MAX_TABLES - allTables(hs).length);
      const n = Math.min(Math.max(1, count), room);
      let next = nextNumber(hs);
      return hs.map((h) => (h.id === hallId ? layoutHall({ ...h, tables: [...h.tables, ...Array.from({ length: n }, () => ({ id: newId('tbl'), name: String(next++), seats: 4 }))] }) : h));
    });
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-600">
        <span className="inline-flex items-center gap-1.5"><Armchair size={15} /> {halls.length} صالة</span>
        <span className="inline-flex items-center gap-1.5"><Armchair size={15} /> {total} طاولة</span>
        <span className="inline-flex items-center gap-1.5"><Users size={15} /> {allTables(halls).reduce((n, t) => n + t.seats, 0)} مقعد</span>
        <button type="button" onClick={() => onGoTo('tables')} className="mr-auto text-brand cursor-pointer">رموز QR للطاولات</button>
      </div>

      <Card title="صالة جديدة">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[180px]">
            <Field label="اسم الصالة"><input className={inputClass} placeholder="مثلاً: التراس، الحديقة، الطابق الثاني" value={hallName} onChange={(e) => setHallName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addHall()} /></Field>
          </div>
          <PrimaryButton onClick={addHall} disabled={!hallName.trim()}><span className="inline-flex items-center gap-1"><Plus size={14} /> أضف الصالة</span></PrimaryButton>
        </div>
      </Card>

      {halls.length === 0 && <EmptyState text="لا توجد صالات بعد. أضف أول صالة ثم طاولاتها." />}

      {halls.map((h) => (
        <Card
          key={h.id}
          title={`${h.name || 'صالة'} · ${h.tables.length} طاولة`}
          actions={<button type="button" onClick={() => removeHall(h)} className="h-8 px-2 rounded-lg text-[#E03131] hover:bg-red-50 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"><Trash2 size={14} /> حذف الصالة</button>}
        >
          <Field label="اسم الصالة"><input className={inputClass} value={h.name} onChange={(e) => patchHall(h.id, { name: e.target.value })} /></Field>
          <FloorMapEditor
            hall={h}
            isDuplicate={isDuplicate}
            canAddTable={total < MAX_TABLES}
            nextName={() => String(nextNumber(halls))}
            onChange={(next) => setHalls((hs) => hs.map((x) => (x.id === h.id ? next : x)))}
            onAddTable={(hall, t) => setHalls((hs) => hs.map((x) => (x.id === hall.id ? { ...x, tables: [...x.tables, t] } : x)))}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-neutral-400">أضف عدة طاولات دفعة واحدة:</span>
            <input className={`${inputFitClass} w-20`} type="number" min={1} max={50} value={addCount[h.id] || ''} placeholder="10" onChange={(e) => setAddCount({ ...addCount, [h.id]: parseInt(e.target.value, 10) || 0 })} />
            <GhostButton onClick={() => addTables(h.id, addCount[h.id] || 10)} disabled={total >= MAX_TABLES}>أضف</GhostButton>
          </div>
        </Card>
      ))}
      <p className="text-xs text-neutral-400 leading-relaxed">أسماء الطاولات تظهر في شاشة الكاشير وعلى تذاكر المطبخ وفي رموز QR. يجب أن يكون اسم كل طاولة مختلفًا في كل الصالات.</p>
    </div>
  );
};
