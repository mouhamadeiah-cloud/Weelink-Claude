// A scrolling area with its own big scroll bar, always visible when the content overflows: kitchen
// tablets and TVs hide the browser's thin bars, and a crowded column must show there is more below.
// The thumb can be dragged, a tap on the rail jumps there, and the arrows scroll by most of a screen.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const ScrollRail: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => {
  const box = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ top: 0, height: 1, client: 1 });

  const measure = useCallback(() => {
    const el = box.current;
    if (el) setM({ top: el.scrollTop, height: el.scrollHeight, client: el.clientHeight });
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    const mo = new MutationObserver(() => {
      Array.from(el.children).forEach((c) => ro.observe(c));
      measure();
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [measure]);

  const overflow = m.height > m.client + 2;
  const railH = Math.max(1, (rail.current?.clientHeight || m.client) - 0);
  const thumbH = Math.max(48, (m.client / m.height) * railH);
  const maxTop = Math.max(1, m.height - m.client);
  const thumbTop = (m.top / maxTop) * (railH - thumbH);
  const below = m.height - m.client - m.top > 4;
  const above = m.top > 4;

  const scrollToRail = (clientY: number, grabOffset: number) => {
    const r = rail.current?.getBoundingClientRect();
    const el = box.current;
    if (!r || !el) return;
    const ratio = (clientY - r.top - grabOffset) / Math.max(1, r.height - thumbH);
    el.scrollTop = Math.max(0, Math.min(1, ratio)) * maxTop;
  };

  const onRailDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const r = rail.current!.getBoundingClientRect();
    const onThumb = e.clientY >= r.top + thumbTop && e.clientY <= r.top + thumbTop + thumbH;
    const grab = onThumb ? e.clientY - r.top - thumbTop : thumbH / 2;
    scrollToRail(e.clientY, grab);
    const move = (ev: PointerEvent) => scrollToRail(ev.clientY, grab);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const page = (dir: 1 | -1) => box.current?.scrollBy({ top: dir * m.client * 0.8, behavior: 'smooth' });
  const arrow = 'w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/35 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-default';

  return (
    <div className={`relative flex min-h-0 ${className}`}>
      <div ref={box} onScroll={measure} className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      {overflow && (
        <div className="shrink-0 w-11 flex flex-col items-center gap-1.5 py-2 pl-1">
          <button type="button" aria-label="للأعلى" disabled={!above} onClick={() => page(-1)} className={arrow}><ChevronUp size={20} /></button>
          <div ref={rail} onPointerDown={onRailDown} className="relative flex-1 w-4 rounded-full bg-white/10 cursor-pointer touch-none">
            <div className="absolute inset-x-0 rounded-full bg-white/60" style={{ top: thumbTop, height: thumbH }} />
          </div>
          <button type="button" aria-label="للأسفل" disabled={!below} onClick={() => page(1)} className={`${arrow} ${below ? 'bg-[#E8590C] hover:bg-[#F76707] animate-pulse' : ''}`}><ChevronDown size={20} /></button>
        </div>
      )}
    </div>
  );
};
