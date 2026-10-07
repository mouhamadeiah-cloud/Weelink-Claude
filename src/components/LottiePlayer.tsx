// Draws one Lottie animation (one of ours, or a file the user linked). The player itself (~45 KB
// compressed) is fetched the first time a page needs it, so pages without animations don't pay for it.
import React, { useEffect, useRef, useState } from 'react';
import type { AnimationItem } from 'lottie-web';
import { buildLottie, lottieById } from '../utils/lottieAnimations';

type LottieModule = typeof import('lottie-web/build/player/lottie_light');
let playerModule: Promise<LottieModule> | null = null;
const loadPlayer = () => (playerModule ??= import('lottie-web/build/player/lottie_light'));

// A linked file is fetched once per address.
const files = new Map<string, Promise<object>>();
const loadFile = (url: string) => {
  let p = files.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
    p.catch(() => files.delete(url));
    files.set(url, p);
  }
  return p;
};

export type LottieTrigger = 'auto' | 'hover' | 'view';

interface Props {
  animationId?: string;
  url?: string;
  color?: string;
  color2?: string;
  loop?: boolean;
  speed?: number;
  trigger?: LottieTrigger;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const LottiePlayer: React.FC<Props> = ({ animationId, url, color, color2, loop = true, speed = 1, trigger = 'auto', className, style, label }) => {
  const box = useRef<HTMLDivElement>(null);
  const item = useRef<AnimationItem | null>(null);
  const [failed, setFailed] = useState(false);
  const def = url ? undefined : lottieById(animationId);

  // (Re)build the animation when what it shows changes.
  useEffect(() => {
    const el = box.current;
    if (!el || (!def && !url)) return;
    let cancelled = false;
    setFailed(false);
    Promise.all([loadPlayer(), url ? loadFile(url) : Promise.resolve(buildLottie(def!, color, color2))])
      .then(([mod, data]) => {
        if (cancelled || !box.current) return;
        const lottie = mod.default;
        item.current?.destroy();
        const still = reducedMotion();
        item.current = lottie.loadAnimation({
          container: box.current,
          renderer: 'svg',
          loop,
          autoplay: false,
          animationData: url ? JSON.parse(JSON.stringify(data)) : data,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
        });
        item.current.setSpeed(speed);
        if (still) item.current.goToAndStop(Math.floor(item.current.totalFrames * 0.6), true);
        else if (trigger === 'auto') item.current.play();
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      item.current?.destroy();
      item.current = null;
    };
  }, [animationId, url, color, color2, loop, trigger]);

  useEffect(() => {
    item.current?.setSpeed(speed);
  }, [speed]);

  // «عند الظهور»: plays each time the animation scrolls into view.
  useEffect(() => {
    const el = box.current;
    if (trigger !== 'view' || !el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!item.current || reducedMotion()) return;
        if (e.isIntersecting) item.current.goToAndPlay(0, true);
        else item.current.stop();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger, animationId, url]);

  const hover =
    trigger === 'hover'
      ? {
          onMouseEnter: () => !reducedMotion() && item.current?.play(),
          onMouseLeave: () => item.current?.stop(),
        }
      : {};

  return (
    <div ref={box} className={className} style={{ width: '100%', height: '100%', ...style }} role="img" aria-label={label || def?.name || 'رسم متحرك'} {...hover}>
      {failed && (
        <div className="w-full h-full flex items-center justify-center text-[11px] text-neutral-400 text-center p-2" dir="rtl">
          ما قدرنا نفتح ملف الرسم المتحرك
        </div>
      )}
    </div>
  );
};

export default LottiePlayer;
