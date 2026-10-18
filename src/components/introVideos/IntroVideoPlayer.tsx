// A floating window over the editor that plays an explainer animation. It unfolds out of the small
// «شرح» button in its card, can be enlarged to the middle of the screen, and on closing folds back
// into that button (or is swiped down to close it).
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, Pause, Play, RotateCcw, X } from 'lucide-react';
import type { IntroVideo } from './introVideos';

interface IntroVideoPlayerProps {
  video: IntroVideo;
  // Where the window folds out of and back into.
  dockSelector: string;
  onClosed: () => void;
}

const BAR = 48;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const useViewport = () => {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const IntroVideoPlayer: React.FC<IntroVideoPlayerProps> = ({ video, dockSelector, onClosed }) => {
  const vp = useViewport();
  const winRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [big, setBig] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [drag, setDrag] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const closing = useRef(false);
  const dragStart = useRef<number | null>(null);

  // Small: in the corner of the canvas, away from the panel. Big: the middle of the screen.
  const phone = vp.w < 640;
  const width = phone || big ? Math.min(vp.w - 32, 1180, ((vp.h - 96) * 16) / 9) : Math.min(480, vp.w - 32);
  const height = (width * 9) / 16 + BAR;
  const left = phone || big ? (vp.w - width) / 2 : 24;
  const top = phone || big ? Math.max(16, (vp.h - height) / 2) : vp.h - height - 24;

  const send = useCallback((type: 'play' | 'pause' | 'seek', t?: number) => {
    frameRef.current?.contentWindow?.postMessage({ source: 'weelink-intro-player', type, time: t }, '*');
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow || e.data?.source !== 'weelink-intro') return;
      setTime(e.data.time);
      setDuration(e.data.duration);
      setPlaying(e.data.playing);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // The transform that shrinks the window onto its button, folded flat.
  const foldedTransform = () => {
    const dock = document.querySelector<HTMLElement>(dockSelector);
    const r = dock?.getBoundingClientRect();
    const tx = r && r.width ? r.left + r.width / 2 - (left + width / 2) : -width / 3;
    const ty = r && r.width ? r.top + r.height / 2 - (top + height / 2) : vp.h - top;
    const s = r && r.width ? Math.max(0.04, r.width / width) : 0.2;
    return `translate(${tx}px, ${ty}px) scale(${s}) rotateX(75deg)`;
  };

  useLayoutEffect(() => {
    winRef.current?.animate(
      [{ transform: foldedTransform(), opacity: 0.2 }, { transform: 'none', opacity: 1 }],
      { duration: 480, easing: EASE },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    send('pause');
    const el = winRef.current;
    if (!el) return onClosed();
    const anim = el.animate(
      [{ transform: `translateY(${drag}px)`, opacity: 1 }, { transform: foldedTransform(), opacity: 0 }],
      { duration: 420, easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)', fill: 'forwards' },
    );
    anim.onfinish = onClosed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, onClosed, send, left, top, width, height]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (big) setBig(false);
      else close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [big, close]);

  // Swiping the top bar down closes it.
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragStart.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    setDrag(Math.max(0, e.clientY - dragStart.current));
  };
  const onPointerUp = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (drag > 90) close();
    else setDrag(0);
  };

  const ended = duration > 0 && time >= duration - 0.05;
  const iconBtn = 'w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer';

  return createPortal(
    <>
      {(big || phone) && (
        <div className={`fixed inset-0 z-[180] bg-neutral-950/40 backdrop-blur-[2px] animate-[fade_0.25s_ease-out] transition-opacity duration-300 ${leaving ? 'opacity-0' : ''}`} onClick={() => (phone ? close() : setBig(false))} />
      )}
      <div
        className="fixed z-[181]"
        style={{ left, top, width, height, perspective: 1200, transition: `left .4s ${EASE}, top .4s ${EASE}, width .4s ${EASE}, height .4s ${EASE}` }}
      >
        <div
          ref={winRef}
          role="dialog"
          aria-label={video.title}
          dir="rtl"
          className="w-full h-full rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(16,24,40,0.45),0_0_0_1px_rgba(16,24,40,0.06)] overflow-hidden flex flex-col"
          style={{ transform: drag ? `translateY(${drag}px)` : undefined, opacity: drag ? Math.max(0.4, 1 - drag / 300) : undefined, transformOrigin: '50% 0' }}
        >
          <div
            className="flex items-center gap-1 px-2 border-b border-neutral-100 select-none touch-none cursor-grab active:cursor-grabbing"
            style={{ height: BAR }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <button type="button" className={iconBtn} aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل'} onClick={() => (ended ? (send('seek', 0), send('play')) : send(playing ? 'pause' : 'play'))}>
              {ended ? <RotateCcw size={16} /> : playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <span className="text-[13px] font-bold text-neutral-800 truncate">{video.title}</span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.05}
              value={time}
              onChange={(e) => send('seek', Number(e.target.value))}
              aria-label="مكان التشغيل"
              className="flex-1 min-w-0 mx-2 accent-[var(--color-brand)] cursor-pointer"
            />
            <span className="text-[11px] tabular-nums text-neutral-500 shrink-0" dir="ltr">{fmt(time)} / {fmt(duration)}</span>
            {!phone && (
              <button type="button" className={iconBtn} aria-label={big ? 'تصغير' : 'تكبير'} onClick={() => setBig((b) => !b)}>
                {big ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
            <button type="button" className={iconBtn} aria-label="إغلاق" onClick={close}>
              <X size={17} />
            </button>
          </div>
          <iframe
            ref={frameRef}
            src={video.src}
            title={video.title}
            className="flex-1 w-full border-0 bg-[#eef2f8]"
          />
        </div>
      </div>
    </>,
    document.body,
  );
};
