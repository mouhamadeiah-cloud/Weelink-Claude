// شاشة المطبخ: the open orders, live, in three columns (جديد، قيد التحضير، جاهز) with big text for a
// kitchen tablet or TV. A screen shows every kitchen section or one (المشاوي، البار...): a section's
// screen lists only the dishes it prepares and «قسمي جاهز» marks just those. A tap on a dish ticks it
// off; when every dish of an order is ticked off the order is ready. Each ticket shows the order's
// number of the day, its table and hall or delivery/pickup, the time it came in and how long it has
// waited (green, then orange; past the «late» minutes of the settings the ticket flashes red),
// what was taken out or added and the notes. «ملخص الأصناف» counts what is still to prepare, and
// «السجل» lists the delivered and cancelled orders to bring one back. A chime plays for each new order
// once the sound is turned on (browsers only allow sound after a tap). Opened on its own at
// ?kitchen=<uid>(&station=<id>), or on a kitchen or «كاشير ومطبخ» device by its code.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Maximize2, Volume2, VolumeX, Armchair, Bike, Store, ChefHat, Check, RotateCcw, ListChecks, History, LogOut, Calculator } from 'lucide-react';
import { MenuOrder, OrderStatus, RestaurantAdminData, ORDER_STATUSES, hallOfTable, stationOfDish } from './restaurantTypes';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { ScrollRail } from './ScrollRail';
import { setOrderStatus, setOrderDoneLines, useLiveOrders, loadPublishedRestaurant, LiveState, cloudErrorText } from './restaurantCloud';

type Column = 'new' | 'preparing' | 'ready';

const COLUMNS: { id: Column; title: string; color: string }[] = [
  { id: 'new', title: 'جديد', color: '#E03131' },
  { id: 'preparing', title: 'قيد التحضير', color: '#E8590C' },
  { id: 'ready', title: 'جاهز', color: '#1971C2' },
];

// The menu bits the screen needs: which section prepares each dish, and the halls of the tables.
export type KitchenMenu = Pick<RestaurantAdminData, 'stations' | 'halls' | 'dishes' | 'categories'> & { settings?: Pick<RestaurantAdminData['settings'], 'kitchenLateMinutes'> };

const minutesSince = (iso: string, now: number) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));

const waitColor = (mins: number, late: number) => (mins >= late ? '#FF6B6B' : mins >= late * 0.6 ? '#FFA94D' : '#69DB7C');

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('ar-SY-u-nu-latn', { hour: '2-digit', minute: '2-digit' });

// Wider scroll bars on the dark screen (the order columns have their own ScrollRail), and the red
// flash of a late ticket.
const KITCHEN_STYLE = `
.kitchen-scroll::-webkit-scrollbar { width: 16px; height: 16px; }
.kitchen-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.06); border-radius: 9999px; }
.kitchen-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.45); border-radius: 9999px; border: 3px solid #1f2023; min-height: 48px; }
.kitchen-scroll::-webkit-scrollbar-thumb:hover, .kitchen-scroll::-webkit-scrollbar-thumb:active { background: rgba(255,255,255,.7); }
@keyframes kLate { 0%, 100% { background-color: #26272b; border-color: #FA5252; } 50% { background-color: #8a1c1c; border-color: #FF8787; } }
.kitchen-late { animation: kLate 1s ease-in-out infinite; }
`;

// A short two-note chime, made in the browser (no sound file to load).
const chime = (ctx: AudioContext) => {
  [880, 1320].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = f;
    o.connect(g);
    g.connect(ctx.destination);
    const t = ctx.currentTime + i * 0.18;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.start(t);
    o.stop(t + 0.4);
  });
};

const Place: React.FC<{ o: MenuOrder; menu: KitchenMenu | null }> = ({ o, menu }) => {
  const hall = o.type === 'table' && menu ? hallOfTable(menu.halls, o.table) : '';
  return (
    <span className="h-8 px-3 rounded-full bg-white/10 text-base font-black inline-flex items-center gap-1.5 min-w-0">
      {o.type === 'table' ? <Armchair size={16} /> : o.type === 'delivery' ? <Bike size={16} /> : <Store size={16} />}
      <span className="truncate">{o.type === 'table' ? `طاولة ${o.table}` : o.type === 'delivery' ? 'توصيل' : o.source === 'staff' ? 'سفري' : 'استلام'}</span>
      {hall && <span className="text-xs font-bold text-white/60 truncate">{hall}</span>}
      {o.source === 'staff' && o.name && <span className="text-xs font-bold text-white/60 truncate">· {o.name}</span>}
    </span>
  );
};

interface TicketProps {
  o: MenuOrder;
  late: number; // minutes after which a ticket not ready yet flashes red
  lines: number[]; // the indexes of the lines this screen shows
  now: number;
  color: string;
  menu: KitchenMenu | null;
  stationColor: (dishId: string) => string;
  onToggleLine: (i: number) => void;
  action?: { label: string; onClick: () => void; disabled?: boolean };
  onBack?: () => void;
}

const OrderTicket: React.FC<TicketProps> = ({ o, late, lines, now, color, menu, stationColor, onToggleLine, action, onBack }) => {
  const mins = minutesSince(o.createdAt, now);
  const done = new Set(o.doneLines || []);
  const isLate = o.status !== 'ready' && o.status !== 'onway' && mins >= late;
  return (
    <div className={`rounded-2xl bg-[#26272b] border-2 overflow-hidden flex flex-col ${isLate ? 'kitchen-late' : ''}`} style={isLate ? undefined : { borderColor: color }}>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3" style={{ backgroundColor: isLate ? 'rgba(250,82,82,.25)' : `${color}26` }}>
        <span className="text-3xl font-black tabular-nums">#{o.number}</span>
        <Place o={o} menu={menu} />
        {o.status === 'onway' && <span className="h-8 px-3 rounded-full bg-[#7048E8] text-base font-black inline-flex items-center">على الطريق</span>}
        <span className="mr-auto flex items-center gap-2 shrink-0">
          <span className="text-base font-bold text-white/60 tabular-nums" dir="ltr">{timeOf(o.createdAt)}</span>
          <span className="h-8 px-2.5 rounded-full text-lg font-black inline-flex items-center" style={{ color: isLate ? '#fff' : waitColor(mins, late), background: isLate ? '#E03131' : 'rgba(255,255,255,.08)' }}>{isLate ? `متأخر ${mins} د` : `${mins} د`}</span>
        </span>
      </div>
      <div className="px-2 py-2 space-y-1 flex-1">
        {lines.map((i) => {
          const l = o.lines[i];
          const ticked = done.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggleLine(i)}
              className={`w-full text-right px-2 py-1.5 rounded-xl flex items-start gap-2 cursor-pointer transition ${ticked ? 'opacity-45' : 'hover:bg-white/5'}`}
            >
              <span className={`mt-1 w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center ${ticked ? 'bg-[#2F9E44] border-[#2F9E44]' : 'border-white/30'}`}>{ticked && <Check size={16} strokeWidth={3} />}</span>
              <span className="flex-1 min-w-0">
                <span className={`block text-xl font-black leading-snug ${ticked ? 'line-through' : ''}`}>
                  <span style={{ color }}>{l.qty}×</span> {l.name}
                  {menu && menu.stations.length > 1 && <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ background: stationColor(l.dishId) }} />}
                </span>
                {l.removed.length > 0 && <span className="block text-base font-bold text-[#FF8787]">بدون: {l.removed.join('، ')}</span>}
                {l.extras.length > 0 && <span className="block text-base font-bold text-[#69DB7C]">مع: {l.extras.map((e) => e.name).join('، ')}</span>}
                {l.notes && <span className="block text-base font-bold text-[#FFD43B]">✎ {l.notes}</span>}
              </span>
            </button>
          );
        })}
        {o.notes && <div className="mx-2 text-base font-bold text-[#FFD43B] border-t border-white/10 pt-2">ملاحظة الطلب: {o.notes}</div>}
      </div>
      {action && (
        <div className="flex gap-2 p-3">
          {onBack && <button type="button" onClick={onBack} aria-label="رجوع" className="h-14 px-4 rounded-xl bg-white/10 text-base font-bold cursor-pointer active:scale-95">رجوع</button>}
          <button type="button" disabled={action.disabled} onClick={action.onClick} className="flex-1 h-14 rounded-xl text-xl font-black text-white cursor-pointer active:scale-[0.98] disabled:cursor-default disabled:bg-white/10 disabled:text-white/60 disabled:text-base" style={action.disabled ? undefined : { backgroundColor: color }}>
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};

interface BoardProps {
  uid: string;
  live: LiveState<MenuOrder>;
  menu: KitchenMenu | null;
  title?: string;
  lockedStation?: string; // a section's own device: shows that section only
  initialStation?: string;
  onClose?: () => void;
  onLogout?: () => void;
  onSwitch?: () => void; // «كاشير ومطبخ» devices: back to the cashier
}

export const KitchenBoard: React.FC<BoardProps> = ({ uid, live, menu, title, lockedStation, initialStation, onClose, onLogout, onSwitch }) => {
  const [now, setNow] = useState(Date.now());
  const [sound, setSound] = useState(false);
  const [station, setStation] = useState(lockedStation || initialStation || '');
  const [view, setView] = useState<'open' | 'history'>('open');
  const [summary, setSummary] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(t);
  }, []);

  const late = menu?.settings?.kitchenLateMinutes || 5;
  const stations = menu?.stations || [];
  const activeStation = stations.some((s) => s.id === station) ? station : '';
  const stationById = (id: string) => stations.find((s) => s.id === id);
  const stationOfLine = (dishId: string) => (menu ? stationOfDish(dishId, menu) : '');
  const stationColor = (dishId: string) => stationById(stationOfLine(dishId))?.color || '#868E96';

  // The lines of an order this screen prepares.
  const linesFor = (o: MenuOrder, st = activeStation) => o.lines.map((_, i) => i).filter((i) => !st || stationOfLine(o.lines[i].dishId) === st);
  const allDone = (o: MenuOrder, lines: number[]) => lines.every((i) => (o.doneLines || []).includes(i));

  const open = useMemo(
    () => live.items.filter((o) => o.status === 'new' || o.status === 'preparing' || o.status === 'ready' || o.status === 'onway').sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [live.items]
  );

  // Which column an order sits in on this screen: a section's screen moves an order to «جاهز» once
  // its own dishes are done, even while other sections still work on theirs.
  const columnOf = (o: MenuOrder, st = activeStation): Column => {
    if (o.status === 'new') return 'new';
    if (o.status === 'onway') return 'ready';
    if (!st) return o.status === 'ready' ? 'ready' : 'preparing';
    return o.status === 'ready' || allDone(o, linesFor(o, st)) ? 'ready' : 'preparing';
  };

  // A chime for orders that were not there before (not for the ones already open on start).
  useEffect(() => {
    if (!live.ready) return;
    const ids = new Set(live.items.filter((o) => o.status === 'new' && linesFor(o).length > 0).map((o) => o.id));
    if (seen.current && sound && audio.current && [...ids].some((id) => !seen.current!.has(id))) chime(audio.current);
    seen.current = new Set([...(seen.current || []), ...ids]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, sound, activeStation]);

  const toggleSound = () => {
    if (!audio.current) audio.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    audio.current.resume();
    if (!sound) chime(audio.current);
    setSound(!sound);
  };
  const fullscreen = () => document.documentElement.requestFullscreen?.().catch(() => {});
  const fail = (e: unknown) => console.warn('Could not update the order:', e);
  const setStatus = (o: MenuOrder, status: OrderStatus) => setOrderStatus(uid, o, status).catch(fail);
  const setDone = (o: MenuOrder, doneLines: number[]) => setOrderDoneLines(uid, o.id, [...new Set(doneLines)].sort((a, b) => a - b)).catch(fail);

  // Ticking a dish off; the last one makes the whole order ready.
  const toggleLine = (o: MenuOrder, i: number) => {
    const done = new Set(o.doneLines || []);
    if (done.has(i)) done.delete(i);
    else done.add(i);
    const list = [...done];
    setDone(o, list);
    const every = o.lines.every((_, k) => done.has(k));
    if (every && o.status !== 'ready') setStatus(o, 'ready');
    else if (!every && o.status === 'ready') setStatus(o, 'preparing');
    else if (o.status === 'new' && list.length > 0) setStatus(o, 'preparing');
  };

  // «قسمي جاهز»: this section's dishes are done; the order is ready when nothing is left.
  const finishMine = (o: MenuOrder) => {
    const done = [...(o.doneLines || []), ...linesFor(o)];
    setDone(o, done);
    if (o.lines.every((_, k) => done.includes(k))) setStatus(o, 'ready');
  };
  const finishAll = (o: MenuOrder) => {
    setDone(o, o.lines.map((_, i) => i));
    setStatus(o, 'ready');
  };
  const reopen = (o: MenuOrder) => {
    const mine = new Set(linesFor(o));
    setDone(o, (o.doneLines || []).filter((i) => !mine.has(i)));
    setStatus(o, 'preparing');
  };

  const waitingFor = (o: MenuOrder) => {
    const left = new Set(o.lines.map((_, i) => i).filter((i) => !(o.doneLines || []).includes(i)).map((i) => stationOfLine(o.lines[i].dishId)));
    return [...left].map((id) => stationById(id)?.name).filter(Boolean).join('، ');
  };

  const actionFor = (o: MenuOrder, col: Column): TicketProps['action'] => {
    if (col === 'new') return { label: 'ابدأ التحضير', onClick: () => setStatus(o, 'preparing') };
    if (col === 'preparing') return activeStation ? { label: 'قسمي جاهز', onClick: () => finishMine(o) } : { label: 'جاهز', onClick: () => finishAll(o) };
    // A delivery order goes «على الطريق» first and stays here until it is delivered.
    if (o.status === 'ready' && o.type === 'delivery') return { label: 'على الطريق', onClick: () => setStatus(o, 'onway') };
    if (o.status === 'ready' || o.status === 'onway') return { label: 'تم التسليم', onClick: () => setStatus(o, 'done') };
    return { label: `بانتظار: ${waitingFor(o) || 'الأقسام الأخرى'}`, onClick: () => {}, disabled: true };
  };
  const backFor = (o: MenuOrder, col: Column) =>
    o.status === 'onway' ? () => setStatus(o, 'ready') : col === 'preparing' ? () => setStatus(o, 'new') : col === 'ready' ? () => reopen(o) : undefined;

  // What is still to prepare on this screen, summed by dish.
  const toPrepare = useMemo(() => {
    const sums = new Map<string, number>();
    open
      .filter((o) => o.status !== 'ready' && o.status !== 'onway')
      .forEach((o) => linesFor(o).forEach((i) => {
        if ((o.doneLines || []).includes(i)) return;
        const l = o.lines[i];
        sums.set(l.name, (sums.get(l.name) || 0) + l.qty);
      }));
    return [...sums.entries()].sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeStation, menu]);

  const history = useMemo(
    () => live.items.filter((o) => (o.status === 'done' || o.status === 'cancelled') && linesFor(o).length > 0).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 60),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live.items, activeStation, menu]
  );

  // Orders a section still has to prepare.
  const countFor = (st: string) => open.filter((o) => linesFor(o, st).length > 0 && columnOf(o, st) !== 'ready').length;
  const locked = !!lockedStation && !!stationById(lockedStation);
  const chip = (on: boolean) => `h-10 px-4 rounded-xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer shrink-0 ${on ? 'bg-white text-[#18191c]' : 'bg-white/10 text-white'}`;

  return (
    <div dir="rtl" className="fixed inset-0 z-[3000000] bg-[#18191c] text-white flex flex-col font-sans">
      <style>{KITCHEN_STYLE}</style>
      <header className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/10">
        <ChefHat size={26} className="text-[#FF922B]" />
        <div className="text-xl font-black">{title || 'شاشة المطبخ'}</div>
        {locked && <span className="h-8 px-3 rounded-full text-sm font-black inline-flex items-center" style={{ background: stationById(lockedStation!)!.color }}>{stationById(lockedStation!)!.name}</span>}
        <div className="text-sm text-white/50 font-bold">{new Date(now).toLocaleTimeString('ar-SY-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}</div>
        <div className="mr-auto flex flex-wrap items-center gap-2">
          {onSwitch && <button type="button" onClick={onSwitch} className="h-10 px-4 rounded-xl bg-[#2F9E44] text-sm font-black inline-flex items-center gap-2 cursor-pointer"><Calculator size={18} /> الكاشير</button>}
          <button type="button" onClick={() => setSummary(!summary)} className={chip(summary)}><ListChecks size={18} /> ملخص الأصناف</button>
          <button type="button" onClick={() => setView(view === 'open' ? 'history' : 'open')} className={chip(view === 'history')}><History size={18} /> السجل</button>
          <button type="button" onClick={toggleSound} className={`h-10 px-4 rounded-xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer ${sound ? 'bg-[#2F9E44]' : 'bg-white/10'}`}>
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />} {sound ? 'الصوت يعمل' : 'شغّل الصوت'}
          </button>
          <button type="button" onClick={fullscreen} aria-label="ملء الشاشة" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center cursor-pointer"><Maximize2 size={18} /></button>
          {onLogout && <button type="button" onClick={onLogout} aria-label="خروج الجهاز" title="خروج الجهاز" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center cursor-pointer"><LogOut size={18} /></button>}
          {onClose && <button type="button" onClick={onClose} aria-label="إغلاق" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center cursor-pointer"><X size={20} /></button>}
        </div>
      </header>

      {!locked && stations.length > 1 && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-white/10 overflow-x-auto">
          <button type="button" onClick={() => setStation('')} className={chip(!activeStation)}>كل الأقسام <span className="min-w-[24px] h-6 px-1.5 rounded-full bg-black/20 text-xs flex items-center justify-center">{countFor('')}</span></button>
          {stations.map((s) => (
            <button key={s.id} type="button" onClick={() => setStation(s.id)} className={chip(activeStation === s.id)}>
              <span className="w-3 h-3 rounded-full" style={{ background: s.color }} /> {s.name}
              <span className="min-w-[24px] h-6 px-1.5 rounded-full bg-black/20 text-xs flex items-center justify-center">{countFor(s.id)}</span>
            </button>
          ))}
        </div>
      )}

      {summary && view === 'open' && (
        <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/[0.03]">
          <span className="text-sm font-black text-white/60">للتحضير الآن:</span>
          {toPrepare.length === 0 && <span className="text-sm font-bold text-white/40">لا شيء</span>}
          {toPrepare.map(([name, qty]) => (
            <span key={name} className="h-9 px-3 rounded-xl bg-white/10 text-base font-black inline-flex items-center gap-1.5"><span className="text-[#FF922B]">{qty}×</span> {name}</span>
          ))}
        </div>
      )}

      {live.error ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-lg font-bold text-[#FFA94D]">{cloudErrorText(live.error)}</div>
      ) : view === 'history' ? (
        <div className="kitchen-scroll flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
          {history.length === 0 && <div className="py-16 text-center text-white/30 font-bold">لا طلبات منتهية بعد</div>}
          {history.map((o) => {
            const st = ORDER_STATUSES.find((s) => s.id === o.status)!;
            return (
              <div key={o.id} className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white/[0.04]">
                <span className="text-xl font-black">#{o.number}</span>
                <Place o={o} menu={menu} />
                <span className="text-sm font-bold text-white/50" dir="ltr">{timeOf(o.createdAt)}</span>
                <span className="flex-1 min-w-[160px] text-base font-bold text-white/80 truncate">{linesFor(o).map((i) => `${o.lines[i].qty}× ${o.lines[i].name}`).join('، ')}</span>
                <span className="h-7 px-3 rounded-full text-xs font-black inline-flex items-center" style={{ background: st.color }}>{st.label}</span>
                <button type="button" onClick={() => reopen(o)} className="h-10 px-3 rounded-xl bg-white/10 text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"><RotateCcw size={16} /> أعد للتحضير</button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="kitchen-scroll flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-3 p-3 overflow-y-auto md:overflow-hidden">
          {COLUMNS.map((c) => {
            const orders = open.filter((o) => linesFor(o).length > 0 && columnOf(o) === c.id);
            return (
              <section key={c.id} className="flex flex-col min-h-0 rounded-2xl bg-white/[0.03]">
                <h2 className="h-12 shrink-0 flex items-center gap-2 px-4 text-lg font-black" style={{ color: c.color }}>
                  {c.title}
                  <span className="min-w-[28px] h-7 px-2 rounded-full text-white text-sm flex items-center justify-center" style={{ backgroundColor: c.color }}>{orders.length}</span>
                </h2>
                <ScrollRail className="flex-1">
                  <div className="p-2 space-y-3">
                    {orders.length === 0 && <div className="py-10 text-center text-white/30 font-bold">لا طلبات</div>}
                    {orders.map((o) => (
                      <OrderTicket
                        key={o.id}
                        o={o}
                        late={late}
                        lines={linesFor(o)}
                        now={now}
                        color={c.color}
                        menu={menu}
                        stationColor={stationColor}
                        onToggleLine={(i) => toggleLine(o, i)}
                        action={actionFor(o, c.id)}
                        onBack={backFor(o, c.id)}
                      />
                    ))}
                  </div>
                </ScrollRail>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

// The published menu (dishes, sections, halls, settings) for a screen that runs on its own.
// refreshMs: load it again every so often, so a screen that stays on all day sees new settings.
export const usePublishedMenu = (uid: string, refreshMs = 0) => {
  const [menu, setMenu] = useState<RestaurantAdminData | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => loadPublishedRestaurant(uid).then((r) => alive && r && setMenu(r.admin)).catch((e) => console.warn('Could not load the menu:', e));
    load();
    const t = refreshMs ? window.setInterval(load, refreshMs) : 0;
    return () => {
      alive = false;
      if (t) window.clearInterval(t);
    };
  }, [uid, refreshMs]);
  return menu;
};

// On its own page (?kitchen=<uid>, optionally &station=<id>), e.g. on the kitchen's tablet.
// Waits for the saved sign-in first, so the owner's orders are not refused before it is restored.
export const KitchenPage: React.FC<{ uid: string }> = ({ uid }) => {
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => onAuthStateChanged(auth, () => setAuthReady(true)), []);
  const live = useLiveOrders(authReady ? uid : null);
  const menu = usePublishedMenu(uid);
  const station = new URLSearchParams(window.location.search).get('station') || '';
  return <KitchenBoard uid={uid} live={live} menu={menu} initialStation={station} />;
};
