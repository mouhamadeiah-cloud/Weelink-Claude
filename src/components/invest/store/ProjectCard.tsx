// A project's card on the site (and beside the editor in the admin window): photo, sector and
// status, title, place, a funding bar (raised of target), the minimum share, the expected return
// and the duration. 'wide' lays the same facts out as a row with the photo at the side.
import React from 'react';
import { ImageOff, MapPin, TrendingUp, Clock, Coins } from 'lucide-react';
import { InvestProject, investStatusMeta, fundedPercent } from '../investTypes';
import { formatMoney } from '../../shop/adminUi';

export interface ProjectLook {
  accent: string;
  cardBg: string;
  text: string;
  radius: number;
  font: string;
}

export const DEFAULT_PROJECT_LOOK: ProjectLook = {
  accent: '#0F6B4F',
  cardBg: '#FFFFFF',
  text: '#1d1d1f',
  radius: 22,
  font: "'IBM Plex Sans Arabic', sans-serif",
};

interface ProjectCardProps {
  project: InvestProject;
  raised: number;
  look: ProjectLook;
  wide?: boolean;
  onOpen?: () => void;
}

export const FundingBar: React.FC<{ raised: number; target: number; currency: string; accent: string; compact?: boolean }> = ({ raised, target, currency, accent, compact }) => {
  const pct = fundedPercent(raised, target);
  return (
    <div className="space-y-1.5">
      <div className="h-2 rounded-full bg-black/[0.07] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: accent }} />
      </div>
      <div className={`flex items-center justify-between gap-2 ${compact ? 'text-[11px]' : 'text-xs'} font-bold`}>
        <span style={{ color: accent }}>{pct}% مموّل</span>
        {target > 0 && <span className="opacity-60 truncate" dir="ltr">{formatMoney(raised, currency)} / {formatMoney(target, currency)}</span>}
      </div>
    </div>
  );
};

const Fact: React.FC<{ icon: React.ElementType; label: string; value: string; accent: string }> = ({ icon: Icon, label, value, accent }) => (
  <div className="min-w-0">
    <div className="flex items-center gap-1 text-[10px] font-bold opacity-50"><Icon size={11} style={{ color: accent }} />{label}</div>
    <div className="text-xs font-black truncate">{value}</div>
  </div>
);

export const ProjectCard: React.FC<ProjectCardProps> = ({ project: p, raised, look, wide, onOpen }) => {
  const status = investStatusMeta(p.status);
  const facts = [
    p.minInvestment > 0 && { icon: Coins, label: 'أقل مشاركة', value: formatMoney(p.minInvestment, p.currency) },
    p.expectedReturn && { icon: TrendingUp, label: 'العائد المتوقع', value: p.expectedReturn },
    p.duration && { icon: Clock, label: 'المدة', value: p.duration },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  const photo = (
    <div className={`relative overflow-hidden bg-black/[0.04] ${wide ? 'w-[38%] shrink-0 self-stretch' : 'aspect-[16/10]'}`}>
      {p.images[0] ? (
        <img src={p.images[0]} alt={p.title} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-30"><ImageOff size={36} /></div>
      )}
      <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
        <span className="px-2.5 h-6 rounded-full text-[11px] font-bold text-white flex items-center" style={{ backgroundColor: status.color }}>{status.label}</span>
        {p.sector && <span className="px-2.5 h-6 rounded-full text-[11px] font-bold bg-white/90 text-[#1d1d1f] flex items-center">{p.sector}</span>}
      </div>
    </div>
  );

  return (
    <div
      role={onOpen ? 'button' : undefined}
      onClick={onOpen}
      className={`h-full overflow-hidden border border-black/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] text-right ${wide ? 'flex' : 'flex flex-col'} ${onOpen ? 'cursor-pointer' : ''}`}
      style={{ backgroundColor: look.cardBg, color: look.text, borderRadius: look.radius, fontFamily: look.font }}
      dir="rtl"
    >
      {photo}
      <div className="flex-1 min-w-0 p-4 flex flex-col gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-black leading-snug line-clamp-2">{p.title || 'مشروع بلا اسم'}</h3>
          {p.location && <div className="flex items-center gap-1 text-[11px] font-bold opacity-55"><MapPin size={12} />{p.location}</div>}
        </div>
        {p.summary && <p className={`text-xs leading-relaxed opacity-70 ${wide ? 'line-clamp-3' : 'line-clamp-2'}`}>{p.summary}</p>}
        <div className="mt-auto space-y-3">
          {p.target > 0 && <FundingBar raised={raised} target={p.target} currency={p.currency} accent={look.accent} compact />}
          {facts.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/[0.06]">
              {facts.map((f) => <Fact key={f.label} {...f} accent={look.accent} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
