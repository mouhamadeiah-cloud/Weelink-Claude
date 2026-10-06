// Wee AI's icon: three dots, like the dots of the letter ث, in Weelink's purple-to-blue.
// It watches the user: the dot nearest the pointer leans out of the group towards it (the other two
// follow a little) and springs back when the pointer leaves, and the shine on every dot sits on the
// pointer's side. While Wee AI writes (`busy`) the group turns and the dots pulse in turn.
import React, { useEffect, useId, useRef } from 'react';

const C = { x: 24, y: 24.3 };
const R = 11;
const DOT = 6.5;
const BASE = [-90, 150, 30].map((a) => (a * Math.PI) / 180);
// How far from the icon (screen px) the pointer still catches its attention.
const REACH = 220;

interface Dot { ox: number; oy: number; vx: number; vy: number; fx: number; fy: number }

export const WeeDots: React.FC<{ size?: number; busy?: boolean; className?: string }> = ({ size = 24, busy = false, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const circles = useRef<(SVGCircleElement | null)[]>([]);
  const grads = useRef<(SVGRadialGradientElement | null)[]>([]);
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dots: Dot[] = BASE.map(() => ({ ox: 0, oy: 0, vx: 0, vy: 0, fx: 0.35, fy: 0.3 }));
    let pointer: { x: number; y: number } | null = null;
    let raf = 0;
    let last = performance.now();
    let rot = 0;
    let quietFrames = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scale = rect.width / 48 || 1;
      const isBusy = busyRef.current && !reduce;
      let moving = isBusy;
      if (isBusy) rot += (dt * Math.PI * 2) / 2.4;
      else if (rot !== 0) {
        // Turn back the short way to the resting position.
        rot = Math.atan2(Math.sin(rot), Math.cos(rot));
        rot = Math.abs(rot) < 0.002 ? 0 : rot - rot * Math.min(1, dt * 6);
        moving = true;
      }

      let px = 0, py = 0, near = 0, closest = -1, closestDist = Infinity;
      const pos = BASE.map((a) => [C.x + R * Math.cos(a + rot), C.y + R * Math.sin(a + rot)]);
      if (pointer && !reduce) {
        px = (pointer.x - rect.left) / scale;
        py = (pointer.y - rect.top) / scale;
        near = Math.max(0, 1 - (Math.hypot(px - C.x, py - C.y) * scale) / REACH);
        pos.forEach(([x, y], i) => {
          const d = Math.hypot(px - x, py - y);
          if (d < closestDist) { closestDist = d; closest = i; }
        });
      }

      dots.forEach((d, i) => {
        const [x, y] = pos[i];
        let tx = 0, ty = 0, stretch = 0;
        if (near > 0 && !isBusy) {
          const k = i === closest ? 1 : 0.28;
          const dx = px - x, dy = py - y, l = Math.hypot(dx, dy) || 1;
          const reach = Math.min(6, l * 0.18) * near * k;
          tx = (dx / l) * reach; ty = (dy / l) * reach;
          if (i === closest) stretch = reach / 6;
        }
        // A spring towards where it wants to be.
        d.vx += (tx - d.ox) * 180 * dt; d.vy += (ty - d.oy) * 180 * dt;
        d.vx *= Math.pow(0.004, dt); d.vy *= Math.pow(0.004, dt);
        d.ox += d.vx * dt; d.oy += d.vy * dt;
        if (Math.abs(d.vx) + Math.abs(d.vy) + Math.abs(tx - d.ox) + Math.abs(ty - d.oy) > 0.01) moving = true;

        let s = 1;
        if (isBusy) s = 1 + 0.3 * Math.pow(Math.sin((now / 900 - (i * 0.15) / 0.9) * Math.PI), 2);
        const ang = (Math.atan2(d.oy, d.ox) * 180) / Math.PI;
        const sx = s * (1 + stretch * 0.22), sy = s * (1 - stretch * 0.12);
        circles.current[i]?.setAttribute(
          'transform',
          `translate(${(x + d.ox).toFixed(2)} ${(y + d.oy).toFixed(2)}) rotate(${ang.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) rotate(${(-ang).toFixed(1)})`
        );

        // The shine sits on the pointer's side.
        let fx = 0.35, fy = 0.3;
        if (pointer && !reduce) {
          const dx = px - x, dy = py - y, l = Math.hypot(dx, dy) || 1, k = 0.3 * Math.min(1, near * 1.6 + 0.25);
          fx = 0.5 + (dx / l) * k; fy = 0.5 + (dy / l) * k;
        }
        d.fx += (fx - d.fx) * Math.min(1, dt * 8);
        d.fy += (fy - d.fy) * Math.min(1, dt * 8);
        if (Math.abs(fx - d.fx) + Math.abs(fy - d.fy) > 0.002) moving = true;
        grads.current[i]?.setAttribute('fx', d.fx.toFixed(3));
        grads.current[i]?.setAttribute('fy', d.fy.toFixed(3));
      });

      // Sleep once everything has settled; the next pointer move or `busy` wakes it.
      quietFrames = moving ? 0 : quietFrames + 1;
      raf = quietFrames > 20 ? 0 : requestAnimationFrame(draw);
    };
    const wake = () => {
      if (!raf) { last = performance.now(); quietFrames = 0; raf = requestAnimationFrame(draw); }
    };
    const onMove = (e: PointerEvent) => { pointer = { x: e.clientX, y: e.clientY }; wake(); };
    const onLeave = () => { pointer = null; wake(); };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    wake();
    const busyTimer = window.setInterval(() => { if (busyRef.current) wake(); }, 300);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.clearInterval(busyTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <svg ref={svgRef} viewBox="0 0 48 48" width={size} height={size} className={className} style={{ overflow: 'visible' }} aria-hidden="true">
      <defs>
        {BASE.map((_, i) => (
          <radialGradient key={i} id={`${uid}-g${i}`} ref={(el) => { grads.current[i] = el; }} cx="0.5" cy="0.5" r="0.75" fx="0.35" fy="0.3">
            <stop offset="0" stopColor="#d8ccff" />
            <stop offset="0.5" stopColor="#7c3aed" />
            <stop offset="1" stopColor="#2563eb" />
          </radialGradient>
        ))}
      </defs>
      {BASE.map((a, i) => (
        <circle
          key={i}
          ref={(el) => { circles.current[i] = el; }}
          r={DOT}
          fill={`url(#${uid}-g${i})`}
          transform={`translate(${(C.x + R * Math.cos(a)).toFixed(2)} ${(C.y + R * Math.sin(a)).toFixed(2)})`}
        />
      ))}
    </svg>
  );
};
