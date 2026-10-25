// Floor-map editor of one hall: a grid of big squares. Click an empty square to put a table there, click a
// table to pick it (rename, seats, widen/heighten to merge squares, move, delete). Rows and columns can be added.
import React, { useState } from 'react';
import { Plus, Minus, Trash2, Move, Users } from 'lucide-react';
import { Hall, RestTable } from '../restaurantTypes';
import { Rect, canPlace, layoutHall, rectOf, tableAt, MAX_COLS, MAX_ROWS, MIN_COLS, MIN_ROWS, DEFAULT_COLS } from '../floorMap';
import { GhostButton } from '../../shop/adminUi';

const SEATS = [2, 3, 4, 6, 8];

interface Props {
  hall: Hall;
  isDuplicate: (name: string) => boolean;
  canAddTable: boolean;
  nextName: () => string;
  onChange: (hall: Hall) => void;
  onAddTable: (hall: Hall, table: RestTable) => void;
}

export const FloorMapEditor: React.FC<Props> = ({ hall, isDuplicate, canAddTable, nextName, onChange, onAddTable }) => {
  const [selId, setSelId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const cols = hall.cols ?? DEFAULT_COLS;
  const rows = hall.rows ?? MIN_ROWS;
  const sel = hall.tables.find((t) => t.id === selId) || null;

  const patchTable = (id: string, p: Partial<RestTable>) => onChange({ ...hall, tables: hall.tables.map((t) => (t.id === id ? { ...t, ...p } : t)) });
  const resize = (dw: number, dh: number) => {
    if (!sel) return;
    const r = rectOf(sel);
    const next: Rect = { ...r, w: r.w + dw, h: r.h + dh };
    if (next.w >= 1 && next.h >= 1 && canPlace(hall, next, sel.id)) patchTable(sel.id, { w: next.w, h: next.h });
  };
  const clickCell = (col: number, row: number) => {
    const at = tableAt(hall, col, row);
    if (moving && sel) {
      const r = rectOf(sel);
      // moving drops the table's top-left corner on the clicked square (or nearest spot that fits)
      const next: Rect = { ...r, col, row };
      if (canPlace(hall, next, sel.id)) patchTable(sel.id, { col, row });
      setMoving(false);
      return;
    }
    if (at) { setSelId(at.id); return; }
    if (!canAddTable) return;
    const t: RestTable = { id: `tbl-${Math.random().toString(36).slice(2, 8)}`, name: nextName(), seats: 4, col, row, w: 1, h: 1 };
    onAddTable(hall, t);
    setSelId(t.id);
  };
  const removeSel = () => {
    if (!sel) return;
    onChange({ ...hall, tables: hall.tables.filter((t) => t.id !== sel.id) });
    setSelId(null);
    setMoving(false);
  };
  const setSize = (c: number, r: number) => onChange(layoutHall({ ...hall, cols: c, rows: r }));
  const lastRowFree = !hall.tables.some((t) => (t.row ?? 0) + (t.h ?? 1) >= rows);
  const lastColFree = !hall.tables.some((t) => (t.col ?? 0) + (t.w ?? 1) >= cols);

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (tableAt(hall, c, r)) continue;
    cells.push(
      <button key={`${c}-${r}`} type="button" aria-label="مربع فارغ" onClick={() => clickCell(c, r)} style={{ gridColumn: c + 1, gridRow: r + 1 }}
        className={`min-h-[64px] rounded-xl border border-dashed flex items-center justify-center cursor-pointer ${moving ? 'border-brand bg-brand/5 text-brand' : 'border-neutral-200 bg-neutral-50 text-neutral-300 hover:border-brand hover:text-brand'}`}>
        <Plus size={16} />
      </button>,
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-neutral-500">
        <span>أعمدة {cols}</span>
        <button type="button" aria-label="أنقص عمودًا" disabled={cols <= MIN_COLS || !lastColFree} onClick={() => setSize(cols - 1, rows)} className="w-7 h-7 rounded-lg border border-neutral-200 bg-white flex items-center justify-center cursor-pointer disabled:opacity-40"><Minus size={14} /></button>
        <button type="button" aria-label="أضف عمودًا" disabled={cols >= MAX_COLS} onClick={() => setSize(cols + 1, rows)} className="w-7 h-7 rounded-lg border border-neutral-200 bg-white flex items-center justify-center cursor-pointer disabled:opacity-40"><Plus size={14} /></button>
        <span className="mr-3">صفوف {rows}</span>
        <button type="button" aria-label="أنقص صفًا" disabled={rows <= MIN_ROWS || !lastRowFree} onClick={() => setSize(cols, rows - 1)} className="w-7 h-7 rounded-lg border border-neutral-200 bg-white flex items-center justify-center cursor-pointer disabled:opacity-40"><Minus size={14} /></button>
        <button type="button" aria-label="أضف صفًا" disabled={rows >= MAX_ROWS} onClick={() => setSize(cols, rows + 1)} className="w-7 h-7 rounded-lg border border-neutral-200 bg-white flex items-center justify-center cursor-pointer disabled:opacity-40"><Plus size={14} /></button>
        <span className="text-neutral-400 font-medium">انقر مربعًا فارغًا لتضع طاولة، أو طاولة لتعديلها.</span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(64px, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(64px, auto))`, minWidth: cols * 70 }}>
          {cells}
          {hall.tables.map((t) => {
            const r = rectOf(t);
            const bad = isDuplicate(t.name) || !t.name.trim();
            return (
              <button key={t.id} type="button" onClick={() => (moving && sel && sel.id !== t.id ? setMoving(false) : setSelId(t.id))}
                style={{ gridColumn: `${r.col + 1} / span ${r.w}`, gridRow: `${r.row + 1} / span ${r.h}` }}
                className={`rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${t.id === selId ? 'border-brand bg-brand/10' : bad ? 'border-[#E03131] bg-white' : 'border-neutral-300 bg-white hover:border-brand'}`}>
                <span className="text-base font-black text-neutral-800 truncate max-w-full px-1">{t.name || '؟'}</span>
                <span className="text-[11px] font-bold text-neutral-500 inline-flex items-center gap-1"><Users size={11} /> {t.seats}</span>
              </button>
            );
          })}
        </div>
      </div>

      {sel && (
        <div className="p-3 rounded-2xl border border-brand/40 bg-brand/5 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input className="w-28 h-9 px-2 rounded-lg border border-neutral-200 bg-white text-sm font-black" value={sel.name} maxLength={20} aria-label="اسم الطاولة" onChange={(e) => patchTable(sel.id, { name: e.target.value })} />
            <span className="text-xs font-bold text-neutral-500">مقاعد</span>
            {SEATS.map((n) => (
              <button key={n} type="button" onClick={() => patchTable(sel.id, { seats: n })} className={`w-9 h-9 rounded-lg text-sm font-black cursor-pointer border ${sel.seats === n ? 'bg-brand text-white border-brand' : 'bg-white border-neutral-200 text-neutral-700'}`}>{n}</button>
            ))}
            <input className="w-16 h-9 px-2 rounded-lg border border-neutral-200 bg-white text-sm font-bold" type="number" min={0} max={40} value={sel.seats || ''} placeholder="0" aria-label="عدد المقاعد" onChange={(e) => patchTable(sel.id, { seats: Math.max(0, Math.min(40, parseInt(e.target.value, 10) || 0)) })} />
          </div>
          {isDuplicate(sel.name) && <div className="text-xs font-bold text-[#E03131]">هذا الاسم مكرر في طاولة أخرى</div>}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-neutral-500">
            <span>العرض {sel.w ?? 1}</span>
            <button type="button" aria-label="أنقص العرض" onClick={() => resize(-1, 0)} className="w-8 h-8 rounded-lg border border-neutral-200 bg-white flex items-center justify-center cursor-pointer"><Minus size={14} /></button>
            <button type="button" aria-label="زد العرض" onClick={() => resize(1, 0)} className="w-8 h-8 rounded-lg border border-neutral-200 bg-white flex items-center justify-center cursor-pointer"><Plus size={14} /></button>
            <span className="mr-2">الارتفاع {sel.h ?? 1}</span>
            <button type="button" aria-label="أنقص الارتفاع" onClick={() => resize(0, -1)} className="w-8 h-8 rounded-lg border border-neutral-200 bg-white flex items-center justify-center cursor-pointer"><Minus size={14} /></button>
            <button type="button" aria-label="زد الارتفاع" onClick={() => resize(0, 1)} className="w-8 h-8 rounded-lg border border-neutral-200 bg-white flex items-center justify-center cursor-pointer"><Plus size={14} /></button>
            <span className="text-neutral-400 font-medium">(دمج مربعات)</span>
            <GhostButton onClick={() => setMoving((m) => !m)}><span className="inline-flex items-center gap-1"><Move size={14} /> {moving ? 'اضغط المكان الجديد…' : 'انقل'}</span></GhostButton>
            <button type="button" onClick={removeSel} className="mr-auto h-8 px-2 rounded-lg text-[#E03131] hover:bg-red-50 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"><Trash2 size={14} /> حذف الطاولة</button>
          </div>
        </div>
      )}
    </div>
  );
};
