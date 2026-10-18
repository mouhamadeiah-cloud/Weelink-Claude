// The explainer animation of a group of settings. It sits at the top of the panel and plays while the
// user scrolls on to the settings below it; it can shrink to a small screen there, be dragged out to
// float anywhere, or be enlarged over everything. Moving between the panel and the screen redraws the
// animation where it was, so it carries on from the same second.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, Minus, PanelTopOpen, Pause, Play, RotateCcw } from 'lucide-react';
import type { IntroVideo } from './introVideos';

export type IntroVideoMode = 'docked' | 'mini' | 'floating' | 'big';

interface IntroVideoPlayerProps {
  video: IntroVideo;
  mode: IntroVideoMode;
  onModeChange: (mode: IntroVideoMode) => void;
  // The second it is at, kept by the panel so a redrawn player carries on from there.
  timeRef: React.MutableRefObject<number>;
}

const BAR = 44;
const FLOAT_WIDTH = 420;
// Above the editor's bars, panels and menus.
const Z = 2147483000;

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// The animation page, started at the second it was left at. Its address is fixed when it is drawn,
// so the time ticking on doesn't reload it.
const Frame: React.FC<{ src: string; start: number; paused?: boolean; title: string; frameRef?: React.Ref<HTMLIFrameElement>; className?: string }> = ({
  src, start, paused, title, frameRef, className,
}) => {
  const [url] = useState(() => `${src}?t=${start.toFixed(2)}${paused ? '&paused' : ''}`);
  return <iframe ref={frameRef} src={url} title={title} tabIndex={paused ? -1 : undefined} className={`border-0 bg-[#eef2f8] ${className || ''}`} />;
};

export const IntroVideoPlayer: React.FC<IntroVideoPlayerProps> = ({ video, mode, onModeChange, timeRef }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(timeRef.current);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState({ x: 24, y: 120 });
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const prevMode = useRef<IntroVideoMode>('docked');
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow || e.data?.source !== 'weelink-intro') return;
      timeRef.current = e.data.time >= e.data.duration ? 0 : e.data.time;
      setTime(e.data.time);
      setDuration(e.data.duration);
      setPlaying(e.data.playing);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const send = useCallback((type: 'play' | 'pause' | 'seek', t?: number) => {
    frameRef.current?.contentWindow?.postMessage({ source: 'weelink-intro-player', type, time: t }, '*');
  }, []);

  const setMode = useCallback((next: IntroVideoMode) => {
    if (next === 'big' && mode !== 'big') prevMode.current = mode;
    onModeChange(next);
  }, [mode, onModeChange]);

  useEffect(() => {
    if (mode !== 'big') return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMode(prevMode.current);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, setMode]);

  // Dragging the top bar: out of the panel it becomes a floating window that follows the pointer.
  const floatW = Math.min(FLOAT_WIDTH, vp.w - 24);
  const floatH = (floatW * 9) / 16 + BAR;
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (!d.moved && Math.hypot(dx, dy) < 6) return;
      d.moved = true;
      setPos({ x: clamp(d.ox + dx, 8 - floatW + 80, vp.w - 80), y: clamp(d.oy + dy, 8, vp.h - BAR - 8) });
      if (mode === 'docked') onModeChange('floating');
    };
    const onUp = () => { drag.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [mode, onModeChange, floatW, vp]);

  const startDrag = (e: React.PointerEvent) => {
    if (mode === 'big' || (e.target as HTMLElement).closest('button, input')) return;
    e.preventDefault();
    const r = boxRef.current?.getBoundingClientRect();
    // Grabbed in the panel: the floating window keeps the pointer at the same spot of its bar.
    const ox = mode === 'docked' && r ? e.clientX - Math.min(e.clientX - r.left, floatW - 40) : pos.x;
    const oy = mode === 'docked' && r ? r.top : pos.y;
    drag.current = { sx: e.clientX, sy: e.clientY, ox, oy, moved: false };
  };

  const ended = duration > 0 && time >= duration - 0.05;
  const iconBtn = 'w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer';
  const playButton = (
    <button type="button" className={iconBtn} aria-label={ended ? 'من الأول' : playing ? 'إيقاف مؤقت' : 'تشغيل'} onClick={() => (ended ? (send('seek', 0), send('play')) : send(playing ? 'pause' : 'play'))}>
      {ended ? <RotateCcw size={15} /> : playing ? <Pause size={15} /> : <Play size={15} />}
    </button>
  );
  const scrubber = (
    <input
      type="range"
      min={0}
      max={duration || 1}
      step={0.05}
      value={time}
      onChange={(e) => send('seek', Number(e.target.value))}
      aria-label="مكان التشغيل"
      className="flex-1 min-w-0 mx-1 accent-[var(--color-brand)] cursor-pointer"
    />
  );

  // A small screen at the top of the panel, showing where the animation stopped.
  if (mode === 'mini') {
    return (
      <button
        type="button"
        onClick={() => { setMode('docked'); }}
        className="w-full flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-2 text-right cursor-pointer hover:border-brand/40 hover:shadow-[0_6px_18px_rgba(16,24,40,0.07)] transition-[box-shadow,border-color] animate-[fade_0.25s_ease-out]"
      >
        <span className="relative w-[112px] h-[63px] shrink-0 overflow-hidden rounded-lg ring-1 ring-neutral-200 bg-[#eef2f8]">
          <Frame src={video.src} start={timeRef.current} paused title={video.title} className="absolute left-0 top-0 w-[448px] h-[252px] origin-top-left scale-[0.25] pointer-events-none" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-8 h-8 rounded-full bg-white/90 text-brand shadow flex items-center justify-center"><Play size={14} fill="currentColor" /></span>
          </span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold text-neutral-900">{video.title}</span>
          <span className="block text-xs text-neutral-500">اضغط لتكمّل المشاهدة</span>
        </span>
      </button>
    );
  }

  const bar = (
    <div
      className={`flex items-center gap-0.5 px-1.5 border-b border-neutral-100 select-none touch-none ${mode === 'big' ? '' : 'cursor-grab active:cursor-grabbing'}`}
      style={{ height: BAR }}
      onPointerDown={startDrag}
      title={mode === 'big' ? undefined : 'اسحب لتحركها لأي مكان'}
    >
      {playButton}
      <span className="text-[12px] font-bold text-neutral-800 truncate max-w-[40%]">{video.title}</span>
      {scrubber}
      <span className="text-[11px] tabular-nums text-neutral-500 shrink-0" dir="ltr">{fmt(time)}</span>
      <button type="button" className={iconBtn} aria-label={mode === 'big' ? 'تصغير' : 'تكبير'} onClick={() => setMode(mode === 'big' ? prevMode.current : 'big')}>
        {mode === 'big' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </button>
      {mode === 'floating' && (
        <button type="button" className={iconBtn} aria-label="رجّعها للوحة" title="رجّعها للوحة" onClick={() => setMode('docked')}>
          <PanelTopOpen size={15} />
        </button>
      )}
      {mode !== 'big' && (
        <button type="button" className={iconBtn} aria-label="تصغير لشاشة صغيرة" title="تصغير" onClick={() => { send('pause'); setMode('mini'); }}>
          <Minus size={16} />
        </button>
      )}
    </div>
  );
  const shell = 'rounded-2xl bg-white overflow-hidden flex flex-col';

  if (mode === 'docked') {
    return (
      <div ref={boxRef} dir="rtl" className={`${shell} border border-neutral-200 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_8px_24px_rgba(16,24,40,0.08)] animate-[fade_0.25s_ease-out]`}>
        {bar}
        <Frame key="docked" frameRef={frameRef} src={video.src} start={timeRef.current} title={video.title} className="w-full aspect-video" />
      </div>
    );
  }

  // Floating or enlarged: drawn on the page itself, above the editor.
  const bigW = Math.min(vp.w - 32, 1180, ((vp.h - 32 - BAR) * 16) / 9);
  const style: React.CSSProperties =
    mode === 'big'
      ? { left: (vp.w - bigW) / 2, top: Math.max(16, (vp.h - bigW * 9 / 16 - BAR) / 2), width: bigW, height: (bigW * 9) / 16 + BAR }
      : { left: pos.x, top: pos.y, width: floatW, height: floatH };
  return createPortal(
    <>
      {mode === 'big' && <div className="fixed inset-0 bg-neutral-950/45 backdrop-blur-[2px] animate-[fade_0.25s_ease-out]" style={{ zIndex: Z }} onClick={() => setMode(prevMode.current)} />}
      <div
        ref={boxRef}
        dir="rtl"
        role="dialog"
        aria-label={video.title}
        className={`fixed ${shell} shadow-[0_24px_60px_-12px_rgba(16,24,40,0.45),0_0_0_1px_rgba(16,24,40,0.08)] ${drag.current?.moved ? '' : 'transition-[left,top,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'}`}
        style={{ ...style, zIndex: Z + 1 }}
      >
        {bar}
        <Frame key="floating" frameRef={frameRef} src={video.src} start={timeRef.current} title={video.title} className="w-full flex-1" />
      </div>
    </>,
    document.body,
  );
};
