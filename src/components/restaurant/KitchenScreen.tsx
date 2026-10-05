// شاشة المطبخ: the open orders, live, in three columns (جديد، قيد التحضير، جاهز) with big text for a
// kitchen tablet or TV. Each card shows the order's number, its table or delivery/pickup, how long
// ago it came in, the dishes with what was taken out or added and the notes, and one big button that
// moves it on. A chime plays for each new order once the sound is turned on (browsers only allow
// sound after a tap). Opened from the admin window, or on its own at ?kitchen=<uid>.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2, Volume2, VolumeX, Armchair, Bike, Store, ChefHat } from 'lucide-react';
import { MenuOrder, OrderStatus } from './restaurantTypes';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { setOrderStatus, useLiveOrders, LiveState, cloudErrorText } from './restaurantCloud';

const COLUMNS: { status: OrderStatus; title: string; color: string; next: OrderStatus; action: string }[] = [
  { status: 'new', title: 'جديد', color: '#E03131', next: 'preparing', action: 'ابدأ التحضير' },
  { status: 'preparing', title: 'قيد التحضير', color: '#E8590C', next: 'ready', action: 'جاهز' },
  { status: 'ready', title: 'جاهز', color: '#1971C2', next: 'done', action: 'تم التسليم' },
];

const minutesSince = (iso: string, now: number) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));

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

const OrderTicket: React.FC<{ o: MenuOrder; now: number; color: string; action: string; onNext: () => void; onBack?: () => void }> = ({ o, now, color, action, onNext, onBack }) => {
  const mins = minutesSince(o.createdAt, now);
  return (
    <div className="rounded-2xl bg-[#26272b] border-2 overflow-hidden flex flex-col" style={{ borderColor: color }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: `${color}26` }}>
        <span className="text-2xl font-black">#{o.number}</span>
        <span className="h-8 px-3 rounded-full bg-white/10 text-base font-black inline-flex items-center gap-1.5">
          {o.type === 'table' ? <Armchair size={16} /> : o.type === 'delivery' ? <Bike size={16} /> : <Store size={16} />}
          {o.type === 'table' ? `طاولة ${o.table}` : o.type === 'delivery' ? 'توصيل' : 'استلام'}
        </span>
        <span className={`mr-auto text-lg font-black ${mins >= 20 ? 'text-[#FF6B6B]' : 'text-white/70'}`}>{mins} د</span>
      </div>
      <div className="px-4 py-3 space-y-2.5 flex-1">
        {o.lines.map((l, i) => (
          <div key={i}>
            <div className="text-xl font-black leading-snug"><span style={{ color }}>{l.qty}×</span> {l.name}</div>
            {l.removed.length > 0 && <div className="text-base font-bold text-[#FF8787]">بدون: {l.removed.join('، ')}</div>}
            {l.extras.length > 0 && <div className="text-base font-bold text-[#69DB7C]">مع: {l.extras.map((e) => e.name).join('، ')}</div>}
            {l.notes && <div className="text-base font-bold text-[#FFD43B]">✎ {l.notes}</div>}
          </div>
        ))}
        {o.notes && <div className="text-base font-bold text-[#FFD43B] border-t border-white/10 pt-2">ملاحظة الطلب: {o.notes}</div>}
      </div>
      <div className="flex gap-2 p-3">
        {onBack && <button type="button" onClick={onBack} className="h-14 px-4 rounded-xl bg-white/10 text-base font-bold cursor-pointer active:scale-95">رجوع</button>}
        <button type="button" onClick={onNext} className="flex-1 h-14 rounded-xl text-xl font-black text-white cursor-pointer active:scale-[0.98]" style={{ backgroundColor: color }}>{action}</button>
      </div>
    </div>
  );
};

const Board: React.FC<{ uid: string; live: LiveState<MenuOrder>; onClose?: () => void }> = ({ uid, live, onClose }) => {
  const [now, setNow] = useState(Date.now());
  const [sound, setSound] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);

  // A chime for orders that were not there before (not for the ones already open on start).
  useEffect(() => {
    if (!live.ready) return;
    const ids = new Set(live.items.filter((o) => o.status === 'new').map((o) => o.id));
    if (seen.current && sound && audio.current && [...ids].some((id) => !seen.current!.has(id))) chime(audio.current);
    seen.current = new Set([...(seen.current || []), ...ids]);
  }, [live, sound]);

  const toggleSound = () => {
    if (!audio.current) audio.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    audio.current.resume();
    if (!sound) chime(audio.current);
    setSound(!sound);
  };
  const fullscreen = () => document.documentElement.requestFullscreen?.().catch(() => {});
  const move = (o: MenuOrder, status: OrderStatus) => setOrderStatus(uid, o, status).catch((e) => console.warn('Could not update the order:', e));

  return (
    <div dir="rtl" className="fixed inset-0 z-[3000000] bg-[#18191c] text-white flex flex-col font-sans">
      <header className="h-16 shrink-0 flex items-center gap-3 px-4 border-b border-white/10">
        <ChefHat size={26} className="text-[#FF922B]" />
        <div className="text-xl font-black">شاشة المطبخ</div>
        <div className="text-sm text-white/50 font-bold">{new Date(now).toLocaleTimeString('ar-SY-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}</div>
        <button type="button" onClick={toggleSound} className={`mr-auto h-10 px-4 rounded-xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer ${sound ? 'bg-[#2F9E44]' : 'bg-white/10'}`}>
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />} {sound ? 'الصوت يعمل' : 'شغّل صوت الطلبات'}
        </button>
        <button type="button" onClick={fullscreen} aria-label="ملء الشاشة" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center cursor-pointer"><Maximize2 size={18} /></button>
        {onClose && <button type="button" onClick={onClose} aria-label="إغلاق" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center cursor-pointer"><X size={20} /></button>}
      </header>
      {live.error ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-lg font-bold text-[#FFA94D]">{cloudErrorText(live.error)}</div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-3 p-3 overflow-y-auto md:overflow-hidden">
          {COLUMNS.map((c, i) => {
            const orders = live.items.filter((o) => o.status === c.status).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
            return (
              <section key={c.status} className="flex flex-col min-h-0 rounded-2xl bg-white/[0.03]">
                <h2 className="h-12 shrink-0 flex items-center gap-2 px-4 text-lg font-black" style={{ color: c.color }}>
                  {c.title}
                  <span className="min-w-[28px] h-7 px-2 rounded-full text-white text-sm flex items-center justify-center" style={{ backgroundColor: c.color }}>{orders.length}</span>
                </h2>
                <div className="flex-1 overflow-y-auto p-2 space-y-3">
                  {orders.length === 0 && <div className="py-10 text-center text-white/30 font-bold">لا طلبات</div>}
                  {orders.map((o) => (
                    <OrderTicket key={o.id} o={o} now={now} color={c.color} action={c.action} onNext={() => move(o, c.next)} onBack={i > 0 ? () => move(o, COLUMNS[i - 1].status) : undefined} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Inside the admin window: uses the orders it already listens to.
export const KitchenOverlay: React.FC<{ uid: string; live: LiveState<MenuOrder>; onClose: () => void }> = ({ uid, live, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  return createPortal(<Board uid={uid} live={live} onClose={onClose} />, document.body);
};

// On its own page (?kitchen=<uid>), e.g. on the kitchen's tablet.
// Waits for the saved sign-in first, so the owner's orders are not refused before it is restored.
export const KitchenPage: React.FC<{ uid: string }> = ({ uid }) => {
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => onAuthStateChanged(auth, () => setAuthReady(true)), []);
  const live = useLiveOrders(authReady ? uid : null);
  return <Board uid={uid} live={live} />;
};
