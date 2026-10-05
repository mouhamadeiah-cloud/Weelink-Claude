// The Weelink advert on the customer's screen: the whole screen while the cashier is idle, one half
// while a bill is shown. It is silent. A video or picture can replace the animated logo by setting
// WEELINK_AD_MEDIA (a .mp4/.webm plays muted in a loop, anything else is shown as a picture).
import React, { useEffect, useState } from 'react';

export const WEELINK_AD_MEDIA = '';

const LINES = ['موقعك العربي جاهز بدقائق', 'منيو وطلبات أونلاين وطلب من الطاولة', 'كاشير ونادل وشاشة مطبخ في نظام واحد', 'متجر، مطعم، معرض سيارات… اصنعه بنفسك'];

const STYLE = `
@keyframes wlFloat { 0%,100% { transform: translateY(0) rotate(-4deg) } 50% { transform: translateY(-14px) rotate(4deg) } }
@keyframes wlGlow { 0%,100% { opacity: .35; transform: scale(1) } 50% { opacity: .7; transform: scale(1.15) } }
@keyframes wlDrift { 0% { transform: translate(0,0) } 50% { transform: translate(40px,-30px) } 100% { transform: translate(0,0) } }
@keyframes wlLine { 0% { opacity: 0; transform: translateY(16px) } 12%,88% { opacity: 1; transform: translateY(0) } 100% { opacity: 0; transform: translateY(-16px) } }
`;

export const WeelinkAd: React.FC<{ compact?: boolean; restaurant?: string }> = ({ compact, restaurant }) => {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setLine((n) => (n + 1) % LINES.length), 4000);
    return () => window.clearInterval(t);
  }, []);

  if (WEELINK_AD_MEDIA) {
    const video = /\.(mp4|webm)(\?|$)/i.test(WEELINK_AD_MEDIA);
    return (
      <div className="relative w-full h-full bg-black overflow-hidden">
        {video ? <video src={WEELINK_AD_MEDIA} autoPlay muted loop playsInline className="w-full h-full object-cover" /> : <img src={WEELINK_AD_MEDIA} alt="" className="w-full h-full object-cover" />}
      </div>
    );
  }

  const logo = compact ? 'w-24 h-24 text-5xl rounded-[28px]' : 'w-36 h-36 text-7xl rounded-[40px]';
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0b1220] text-white flex flex-col items-center justify-center gap-6 p-8 text-center">
      <style>{STYLE}</style>
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#0071e3] blur-3xl" style={{ animation: 'wlGlow 6s ease-in-out infinite, wlDrift 14s ease-in-out infinite' }} />
      <div className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-[#40a9ff] blur-3xl" style={{ animation: 'wlGlow 7s ease-in-out infinite 1s, wlDrift 18s ease-in-out infinite reverse' }} />
      <div className={`relative shrink-0 ${logo} bg-gradient-to-tr from-[#0071e3] to-[#40a9ff] flex items-center justify-center font-black shadow-2xl shadow-[#0071e3]/40`} style={{ animation: 'wlFloat 5s ease-in-out infinite' }}>W</div>
      <div className={`relative font-black tracking-tight ${compact ? 'text-5xl' : 'text-7xl'}`}>weelink</div>
      <div className={`relative h-10 font-bold text-white/80 ${compact ? 'text-xl' : 'text-3xl'}`}>
        <div key={line} style={{ animation: 'wlLine 4s ease-in-out both' }}>{LINES[line]}</div>
      </div>
      {!compact && restaurant && <div className="absolute bottom-6 inset-x-0 text-lg font-bold text-white/40">{restaurant} · يعمل بنظام weelink</div>}
    </div>
  );
};
