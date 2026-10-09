import React from 'react';
import { SlideDividerShape } from '../types';

export interface SlideDividerOption {
  id: SlideDividerShape;
  name: string;
  // Mini 2-tone preview SVG representation (as drawn in user's sketch 2)
  renderPreview: (active: boolean) => React.ReactNode;
  // Where the next slide shows through at the bottom of this slide, in a 1200×120 box stretched over
  // the slide's width and the divider's height (none for a straight edge).
  path?: string;
}

export const SLIDE_DIVIDER_OPTIONS: SlideDividerOption[] = [
  {
    id: 'straight',
    name: 'مستقيم (عادي)',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        {/* Top: White */}
        <rect x="0" y="0" width="60" height="22" fill="#ffffff" />
        {/* Bottom: Grey */}
        <rect x="0" y="22" width="60" height="22" fill="#9ca3af" />
        {/* Divider line */}
        <line x1="0" y1="22" x2="60" y2="22" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
  },
  {
    id: 'wave',
    name: 'موجة ناعمة',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,22 C15,14 30,30 45,22 C52,18 56,20 60,22 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,22 C15,14 30,30 45,22 C52,18 56,20 60,22" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    path: 'M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,40 L1200,120 L0,120 Z',
  },
  {
    id: 'slanted',
    name: 'ميلان زاوي',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <polygon points="0,32 60,16 60,44 0,44" fill="#9ca3af" />
        <line x1="0" y1="32" x2="60" y2="16" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    path: 'M0,120 L1200,0 L1200,120 Z',
  },
  {
    id: 'curve-down',
    name: 'قوس مقعر لأسفل',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,16 Q30,34 60,16 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,16 Q30,34 60,16" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    path: 'M0,0 Q600,120 1200,0 L1200,120 L0,120 Z',
  },
  {
    id: 'curve-up',
    name: 'قوس محدب لأعلى',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,30 Q30,12 60,30 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,30 Q30,12 60,30" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    path: 'M0,120 Q600,0 1200,120 L1200,120 L0,120 Z',
  },
  {
    id: 'triangle',
    name: 'سهم مثلث V',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <polygon points="0,18 30,32 60,18 60,44 0,44" fill="#9ca3af" />
        <polyline points="0,18 30,32 60,18" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    path: 'M0,0 L600,120 L1200,0 L1200,120 L0,120 Z',
  },
  {
    id: 'asymmetric-wave',
    name: 'موجة متدفقة',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,28 C20,34 35,10 60,24 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,28 C20,34 35,10 60,24" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    path: 'M0,70 Q400,140 700,20 T1200,60 L1200,120 L0,120 Z',
  },
  {
    id: 'double-wave',
    name: 'موجة مزدوجة',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,22 Q15,14 30,22 T60,22 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,22 Q15,14 30,22 T60,22" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    path: 'M0,50 C150,100 250,0 400,60 C550,120 650,20 800,70 C950,120 1050,20 1200,60 L1200,120 L0,120 Z',
  },
  {
    id: 'zigzag',
    name: 'تعرج متدرج',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <polyline points="0,24 10,18 20,24 30,18 40,24 50,18 60,24" fill="none" stroke="#6b7280" strokeWidth="1" />
        <polygon points="0,24 10,18 20,24 30,18 40,24 50,18 60,24 60,44 0,44" fill="#9ca3af" />
      </svg>
    ),
    path: 'M0,60 L100,0 L200,60 L300,0 L400,60 L500,0 L600,60 L700,0 L800,60 L900,0 L1000,60 L1100,0 L1200,60 L1200,120 L0,120 Z',
  },
  {
    id: 'tilt-right',
    name: 'انحدار يمين',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <polygon points="0,16 60,32 60,44 0,44" fill="#9ca3af" />
        <line x1="0" y1="16" x2="60" y2="32" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    path: 'M0,0 L1200,120 L0,120 Z',
  },
  {
    id: 'tilt-left',
    name: 'انحدار يسار',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <polygon points="0,32 60,16 60,44 0,44" fill="#9ca3af" />
        <line x1="0" y1="32" x2="60" y2="16" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    path: 'M0,120 L1200,0 L1200,120 L0,120 Z',
  },
  {
    id: 'clouds',
    name: 'سحابي منحني',
    renderPreview: (_active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,26 Q10,14 20,24 Q30,12 40,24 Q50,14 60,26 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,26 Q10,14 20,24 Q30,12 40,24 Q50,14 60,26" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    path: 'M0,50 Q150,0 300,50 Q450,0 600,50 Q750,0 900,50 Q1050,0 1200,50 L1200,120 L0,120 Z',
  },
];

// How far (unscaled px) the next slide reaches up under a shaped edge.
export const SLIDE_DIVIDER_HEIGHT = 54;

export const slideDividerPath = (shape?: SlideDividerShape) =>
  shape && shape !== 'straight' ? SLIDE_DIVIDER_OPTIONS.find((o) => o.id === shape)?.path : undefined;

// A mask that lets only the divider's shape through, stretched over the given box.
export const slideDividerMask = (path: string): React.CSSProperties => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="${path}" fill="black"/></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  const size = `100% ${SLIDE_DIVIDER_HEIGHT}px`;
  return {
    maskImage: url, WebkitMaskImage: url,
    maskSize: size, WebkitMaskSize: size,
    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'top left', WebkitMaskPosition: 'top left',
  };
};
