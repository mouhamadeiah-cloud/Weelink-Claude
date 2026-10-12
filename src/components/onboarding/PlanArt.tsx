// A small drawing on each package card: what the owner gets, as screens and devices (a page, a
// phone taking orders, a phone and a tablet, a whole team of devices). Drawn in the kind's colour.
import React from 'react';
import type { Plan } from '../../data/plans';
import type { ProjectType } from '../shop/shopTypes';

const Lines = ({ x, y, w, n, gap = 7, accent }: { x: number; y: number; w: number; n: number; gap?: number; accent: string }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <rect key={i} x={x} y={y + i * gap} width={i === 0 ? w * 0.6 : w * (0.9 - (i % 2) * 0.25)} height={3} rx={1.5} fill={i === 0 ? accent : '#d6d0c6'} />
    ))}
  </>
);

// A browser window with a page in it.
const Page = ({ x, y, w, h, accent }: { x: number; y: number; w: number; h: number; accent: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={8} fill="#fff" stroke="#e5e0d8" />
    <circle cx={x + 8} cy={y + 7} r={2} fill="#e5e0d8" />
    <circle cx={x + 15} cy={y + 7} r={2} fill="#e5e0d8" />
    <rect x={x + 6} y={y + 14} width={w - 12} height={h * 0.32} rx={5} fill={accent} opacity={0.85} />
    <Lines x={x + 8} y={y + 20 + h * 0.32} w={w - 16} n={3} accent={accent} />
  </g>
);

// A phone with a list and an order button.
const Phone = ({ x, y, accent }: { x: number; y: number; accent: string }) => (
  <g>
    <rect x={x} y={y} width={34} height={62} rx={7} fill="#1c1a17" />
    <rect x={x + 3} y={y + 5} width={28} height={52} rx={4} fill="#fff" />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={x + 6} y={y + 9 + i * 13} width={8} height={8} rx={2} fill={accent} opacity={0.35 + i * 0.2} />
        <rect x={x + 16} y={y + 10 + i * 13} width={12} height={2.5} rx={1} fill="#d6d0c6" />
        <rect x={x + 16} y={y + 14 + i * 13} width={8} height={2.5} rx={1} fill="#e5e0d8" />
      </g>
    ))}
    <rect x={x + 6} y={y + 48} width={22} height={6} rx={3} fill={accent} />
  </g>
);

// A tablet with order tickets (cashier or kitchen).
const Tablet = ({ x, y, accent, label }: { x: number; y: number; accent: string; label?: string }) => (
  <g>
    <rect x={x} y={y} width={62} height={44} rx={6} fill="#1c1a17" />
    <rect x={x + 3} y={y + 3} width={56} height={38} rx={3} fill="#fff" />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={x + 6 + i * 17} y={y + 7} width={15} height={22} rx={2} fill={i === 0 ? accent : '#f1ede6'} opacity={i === 0 ? 0.9 : 1} />
        <rect x={x + 8 + i * 17} y={y + 11} width={10} height={2} rx={1} fill={i === 0 ? '#fff' : '#d6d0c6'} />
        <rect x={x + 8 + i * 17} y={y + 15} width={7} height={2} rx={1} fill={i === 0 ? '#fff' : '#e5e0d8'} />
      </g>
    ))}
    {label && <text x={x + 31} y={y + 37} textAnchor="middle" fontSize={6} fontWeight={700} fill="#5b5348">{label}</text>}
  </g>
);

// A small calendar (booking) and a play button (video) for the bigger page.
const Calendar = ({ x, y, accent }: { x: number; y: number; accent: string }) => (
  <g>
    <rect x={x} y={y} width={40} height={36} rx={6} fill="#fff" stroke="#e5e0d8" />
    <rect x={x} y={y} width={40} height={9} rx={4} fill={accent} />
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={x + 5 + (i % 3) * 11} y={y + 13 + Math.floor(i / 3) * 7} width={8} height={4} rx={1} fill={i === 4 ? accent : '#e5e0d8'} />
    ))}
  </g>
);

const Play = ({ x, y, accent }: { x: number; y: number; accent: string }) => (
  <g>
    <rect x={x} y={y} width={40} height={28} rx={6} fill="#1c1a17" />
    <circle cx={x + 20} cy={y + 14} r={8} fill={accent} />
    <path d={`M${x + 17} ${y + 10} L${x + 25} ${y + 14} L${x + 17} ${y + 18} Z`} fill="#fff" />
  </g>
);

// The screens' names per kind: a restaurant's tablets are its stations, a store's are its desks.
const SCREENS: Record<ProjectType, string[]> = {
  restaurant: ['كاشير', 'مطبخ', 'بار', 'جرسون'],
  shop: ['طلبات', 'مستودع', 'حسابات', 'توصيل'],
  cars: ['طلبات', 'سيارات', 'حسابات', 'تجارب'],
  page: ['', '', '', ''],
};

export const PlanArt: React.FC<{ art: Plan['art']; accent: string; kind: ProjectType }> = ({ art, accent, kind }) => {
  const [a, b, c, d] = SCREENS[kind];
  return (
  <svg viewBox="0 0 200 90" className="w-full h-24" role="img" aria-hidden="true">
    <rect width={200} height={90} rx={14} fill="#f6f3ee" />
    {art === 'page' && <Page x={55} y={10} w={90} h={70} accent={accent} />}
    {art === 'pagePro' && (
      <>
        <Page x={18} y={10} w={86} h={70} accent={accent} />
        <Calendar x={114} y={10} accent={accent} />
        <Play x={114} y={52} accent={accent} />
        <Calendar x={160} y={30} accent={accent} />
      </>
    )}
    {art === 'phone' && (
      <>
        <Page x={30} y={14} w={80} h={62} accent={accent} />
        <Phone x={128} y={14} accent={accent} />
      </>
    )}
    {art === 'phoneTablet' && (
      <>
        <Phone x={22} y={14} accent={accent} />
        <Tablet x={70} y={23} accent={accent} label={a} />
        <rect x={140} y={22} width={44} height={46} rx={8} fill="#fff" stroke="#e5e0d8" />
        <rect x={147} y={50} width={6} height={12} rx={2} fill={accent} opacity={0.5} />
        <rect x={157} y={42} width={6} height={20} rx={2} fill={accent} opacity={0.75} />
        <rect x={167} y={32} width={6} height={30} rx={2} fill={accent} />
      </>
    )}
    {art === 'team' && (
      <>
        <Phone x={10} y={14} accent={accent} />
        <Tablet x={56} y={4} accent={accent} label={a} />
        <Tablet x={126} y={4} accent={accent} label={b} />
        <Tablet x={56} y={46} accent={accent} label={c} />
        <Tablet x={126} y={46} accent={accent} label={d} />
      </>
    )}
  </svg>
  );
};
