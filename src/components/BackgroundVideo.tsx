import React, { useEffect, useRef, useState } from 'react';

// True on connections too slow (or set to save data) for a background video; the poster stays instead.
const prefersStill = (): boolean => {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
  const conn = (navigator as any).connection;
  if (!conn) return false;
  return Boolean(conn.saveData) || ['slow-2g', '2g', '3g'].includes(conn.effectiveType);
};

interface BackgroundVideoProps {
  src: string;
  poster?: string;
  fit?: 'cover' | 'contain' | 'auto';
  borderRadius?: number;
}

// A slide's looping, muted background video. It only downloads and plays while the slide is on
// screen, so a page with several video slides does not load them all at once.
export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ src, poster, fit = 'cover', borderRadius }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [still] = useState(prefersStill);
  const [visible, setVisible] = useState(false);
  // Set once the slide first comes into view; the video is not fetched before that.
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || still) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [still]);

  useEffect(() => {
    const el = ref.current;
    if (!el || still) return;
    if (visible) {
      setStarted(true);
      el.play().catch(() => {});
    }
    else el.pause();
  }, [visible, still, src]);

  if (still) return null;

  return (
    <video
      ref={ref}
      src={started ? src : undefined}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay
      preload="none"
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ objectFit: fit === 'contain' ? 'contain' : 'cover', borderRadius: borderRadius ? `${borderRadius}px` : undefined }}
    />
  );
};
