// The restaurant's floor map on the booking element: the visitor taps a table to ask for it. Tables that
// are too small for the party, or already booked at the chosen time, are greyed out. Tap again to let the
// restaurant choose ("any table").
import React from 'react';
import { Users } from 'lucide-react';
import type { BookableTable } from '../services/tableBooking';

interface Props {
  tables: BookableTable[];
  party: number;
  pickedId: string;
  hallId?: string; // only this hall; '' shows every hall
  busyIds: Set<string>;
  accent: string;
  dark: boolean;
  onPick: (id: string) => void;
}

export const TableMapPicker: React.FC<Props> = ({ tables, party, pickedId, hallId, busyIds, accent, dark, onPick }) => {
  const halls = [...new Map(tables.filter((t) => !hallId || t.hallId === hallId).map((t) => [t.hallId, t])).values()];
  return (
    <div className="space-y-2">
      {halls.map((first) => {
        const mine = tables.filter((t) => t.hallId === first.hallId);
        return (
          <div key={first.hallId} className="space-y-1">
            {halls.length > 1 && <div className={`text-[10px] font-bold ${dark ? 'text-white' : 'text-neutral-700'}`}>{first.hallName}</div>}
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${first.hallCols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${first.hallRows}, minmax(34px, auto))` }}>
              {mine.map((t) => {
                const off = t.seats < party || busyIds.has(t.id);
                const on = pickedId === t.id;
                return (
                  <button key={t.id} type="button" disabled={off} aria-pressed={on} aria-label={`طاولة ${t.name}`} onClick={() => onPick(on ? '' : t.id)}
                    style={{ gridColumn: `${t.col + 1} / span ${t.w}`, gridRow: `${t.row + 1} / span ${t.h}`, borderColor: on ? accent : undefined, background: on ? `${accent}22` : undefined }}
                    className={`rounded-lg border-2 flex flex-col items-center justify-center leading-tight ${off ? 'opacity-35 cursor-not-allowed bg-neutral-200 border-neutral-300 text-neutral-500' : `cursor-pointer ${dark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-neutral-300 text-neutral-800'}`}`}>
                    <span className="text-[11px] font-black truncate max-w-full px-0.5">{t.name}</span>
                    <span className="text-[9px] font-bold inline-flex items-center gap-0.5"><Users size={9} />{t.seats}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
