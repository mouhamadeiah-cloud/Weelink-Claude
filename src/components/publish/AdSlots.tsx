// The ad places of a free page (Eyad, 17 Oct). On a wide screen they sit in the empty sides of the window
// like eBay and Amazon, and stay in place while the page scrolls: one tall ad on the right, three on the
// left. On a phone the big one is a banner on top and the three small ones take turns in a strip at the
// bottom. For now every place shows «ضع إعلانك هنا»; it opens an email to Weelink until the contact page is made.
import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';

/** Width of a side column with its gap; the page is scaled to fit between the two. */
export const AD_SIDE = 176;
/** From this window width the ads go in the sides, below it they go on the page's top and bottom. */
export const AD_SIDE_MIN = 1100;

const CONTACT = 'mailto:weelinkclaud@gmail.com?subject=' + encodeURIComponent('إعلان على صفحات Weelink');

const Place: React.FC<{ className?: string; compact?: boolean; label?: string }> = ({ className = '', compact, label }) => (
  <a
    href={CONTACT}
    target="_blank"
    rel="noopener noreferrer"
    className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-black/20 bg-white/70 text-center text-[#6e6e73] no-underline font-sans ${className}`}
    aria-label="ضع إعلانك هنا"
  >
    <Megaphone size={compact ? 16 : 22} className="text-[#0071e3]" />
    <span className={`font-bold text-[#1d1d1f] ${compact ? 'text-xs' : 'text-sm'}`}>ضع إعلانك هنا</span>
    {label && <span className="text-[10px]">{label}</span>}
  </a>
);

/** The page between its two ad columns (wide screens). */
export const SideAds: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-full flex bg-[#eef0f3]">
    {/* The page is right-to-left, so the first column is the one on the right: the tall ad. */}
    <div className="shrink-0 flex flex-col items-center gap-3 pt-6 px-2" style={{ width: AD_SIDE }}>
      <Place className="w-[160px] h-[600px]" label="160 × 600" />
    </div>
    <div className="flex-1 min-w-0 h-full">{children}</div>
    <div className="shrink-0 flex flex-col items-center gap-3 pt-6 px-2" style={{ width: AD_SIDE }}>
      {[0, 1, 2].map((i) => <Place key={i} className="w-[160px] h-[190px]" label="160 × 190" />)}
    </div>
  </div>
);

/** The page with a banner on top and a strip of three ads taking turns at the bottom (phones). */
export const BannerAds: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [turn, setTurn] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTurn((n) => (n + 1) % 3), 4000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="h-full flex flex-col bg-[#eef0f3]">
      <div className="shrink-0 p-1.5"><Place className="w-full h-[72px]" compact label="320 × 100" /></div>
      <div className="flex-1 min-h-0">{children}</div>
      <div className="shrink-0 p-1.5">
        <Place key={turn} className="w-full h-[46px]" compact />
        <div className="flex justify-center gap-1 pt-1" aria-hidden>
          {[0, 1, 2].map((i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === turn ? 'bg-[#0071e3]' : 'bg-black/15'}`} />)}
        </div>
      </div>
    </div>
  );
};
