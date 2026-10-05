// شاشة الانتظار: hangs where guests wait. It shows today's order numbers in two columns, «قيد التحضير»
// and «جاهز للاستلام», following the kitchen: an order moves over as soon as the kitchen marks it ready,
// and leaves the screen when it is handed over (done) or cancelled. The owner picks in the settings
// whether it shows only the orders guests collect (takeaway and pickup) or every order.
import React, { useEffect, useRef, useState } from 'react';
import { BellRing, ChefHat, LogOut } from 'lucide-react';
import { MenuOrder, RestaurantSettings } from '../restaurantTypes';
import { LiveState } from '../restaurantCloud';
import { startOfToday } from '../staffTypes';

const STYLE = `@keyframes obPop { 0% { transform: scale(.6); opacity: 0 } 60% { transform: scale(1.08); opacity: 1 } 100% { transform: scale(1) } }
@keyframes obGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(64,192,87,.0) } 50% { box-shadow: 0 0 0 10px rgba(64,192,87,.35) } }`;

const subLabel = (o: MenuOrder) => (o.type === 'table' && o.table ? `طاولة ${o.table}` : o.type === 'delivery' ? 'توصيل' : (o.name || '').trim().split(/\s+/)[0] || '');

export const OrderBoard: React.FC<{ live: LiveState<MenuOrder>; settings: RestaurantSettings | null; onLogout: () => void }> = ({ live, settings, onLogout }) => {
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setClock(Date.now()), 5000);
    return () => window.clearInterval(t);
  }, []);

  // When each order was first seen ready here, so a newly ready number stands out for a while.
  const readySince = useRef(new Map<string, number>());

  const all = settings?.boardShows === 'all';
  const since = startOfToday();
  const orders = live.items
    .filter((o) => o.createdAt >= since && (all || o.type === 'pickup'))
    .filter((o) => o.status === 'new' || o.status === 'preparing' || o.status === 'ready')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const ready = orders.filter((o) => o.status === 'ready');
  const preparing = orders.filter((o) => o.status !== 'ready');
  const now = Date.now();
  for (const o of ready) if (!readySince.current.has(o.id)) readySince.current.set(o.id, now);
  const readySorted = [...ready].sort((a, b) => (readySince.current.get(b.id) || 0) - (readySince.current.get(a.id) || 0));
  const fresh = (o: MenuOrder) => now - (readySince.current.get(o.id) || 0) < 45000;

  const time = new Date(clock).toLocaleTimeString('ar-SY-u-nu-latn', { hour: '2-digit', minute: '2-digit' });

  return (
    <div dir="rtl" className="fixed inset-0 bg-[#111214] text-white flex flex-col font-sans">
      <style>{STYLE}</style>
      <header className="flex items-center gap-4 px-6 sm:px-10 py-4 border-b border-white/10">
        <div className="text-2xl sm:text-3xl font-black flex-1 truncate">{settings?.name || 'المطعم'}</div>
        <div className="text-xl font-bold text-white/50 tabular-nums" dir="ltr">{time}</div>
      </header>

      <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[2fr_3fr]">
        <section className="min-h-0 flex flex-col border-b md:border-b-0 md:border-l border-white/10">
          <div className="flex items-center gap-3 px-6 sm:px-10 py-4 text-2xl sm:text-3xl font-black text-[#FFA94D]"><ChefHat size={30} /> قيد التحضير</div>
          <div className="flex-1 min-h-0 overflow-hidden px-6 sm:px-10 pb-6 flex flex-wrap content-start gap-3">
            {preparing.map((o) => (
              <div key={o.id} className="min-w-[7rem] px-4 py-3 rounded-3xl bg-white/[0.06] text-center">
                <div className="text-4xl sm:text-5xl font-black tabular-nums">{o.number}</div>
                {subLabel(o) && <div className="text-sm font-bold text-white/50 truncate">{subLabel(o)}</div>}
              </div>
            ))}
            {preparing.length === 0 && <div className="text-lg font-bold text-white/30">لا توجد طلبات قيد التحضير</div>}
          </div>
        </section>

        <section className="min-h-0 flex flex-col bg-[#0f2415]">
          <div className="flex items-center gap-3 px-6 sm:px-10 py-4 text-2xl sm:text-3xl font-black text-[#69DB7C]"><BellRing size={30} /> جاهز للاستلام</div>
          <div className="flex-1 min-h-0 overflow-hidden px-6 sm:px-10 pt-3 pb-6 flex flex-wrap content-start gap-4">
            {readySorted.map((o) => (
              <div
                key={o.id}
                className={`min-w-[10rem] px-6 py-4 rounded-[2rem] text-center ${fresh(o) ? 'bg-[#2F9E44] text-white' : 'bg-[#2F9E44]/25 text-[#B2F2BB]'}`}
                style={fresh(o) ? { animation: 'obPop .6s ease-out both, obGlow 1.6s ease-in-out infinite' } : undefined}
              >
                <div className="text-6xl sm:text-7xl font-black tabular-nums">{o.number}</div>
                {subLabel(o) && <div className="text-base font-bold opacity-80 truncate">{subLabel(o)}</div>}
              </div>
            ))}
            {readySorted.length === 0 && <div className="text-lg font-bold text-white/30">ستظهر هنا الطلبات الجاهزة</div>}
          </div>
        </section>
      </main>

      <footer className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-white/30">
        <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#0071e3] to-[#40a9ff] text-white text-[11px] font-black flex items-center justify-center">W</span>
        يعمل بنظام weelink
      </footer>
      {live.error && <div className="absolute top-20 inset-x-0 mx-auto w-fit px-4 py-2 rounded-xl bg-[#E03131] text-sm font-bold">تعذر جلب الطلبات. تحقق من الإنترنت.</div>}
      <button type="button" onClick={onLogout} aria-label="خروج الجهاز" className="absolute bottom-2 left-3 w-10 h-10 rounded-xl bg-white/5 text-white/40 hover:text-white/80 flex items-center justify-center cursor-pointer"><LogOut size={16} /></button>
    </div>
  );
};
