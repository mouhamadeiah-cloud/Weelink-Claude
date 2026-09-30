import React from 'react';
import { SlideDividerShape } from '../types';

export interface SlideDividerOption {
  id: SlideDividerShape;
  name: string;
  // Mini 2-tone preview SVG representation (as drawn in user's sketch 2)
  renderPreview: (active: boolean) => React.ReactNode;
  // Canvas full-width SVG divider
  renderDivider: (fillColor: string, height?: number) => React.ReactNode;
}

export const SLIDE_DIVIDER_OPTIONS: SlideDividerOption[] = [
  {
    id: 'straight',
    name: 'مستقيم (عادي)',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        {/* Top: White */}
        <rect x="0" y="0" width="60" height="22" fill="#ffffff" />
        {/* Bottom: Grey */}
        <rect x="0" y="22" width="60" height="22" fill="#9ca3af" />
        {/* Divider line */}
        <line x1="0" y1="22" x2="60" y2="22" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    renderDivider: () => null,
  },
  {
    id: 'wave',
    name: 'موجة ناعمة',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,22 C15,14 30,30 45,22 C52,18 56,20 60,22 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,22 C15,14 30,30 45,22 C52,18 56,20 60,22" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    renderDivider: (fillColor, height = 48) => (
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
          <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,40 L1200,120 L0,120 Z" fill={fillColor} />
        </svg>
      </div>
    ),
  },
  {
    id: 'slanted',
    name: 'ميلان زاوي',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <polygon points="0,32 60,16 60,44 0,44" fill="#9ca3af" />
        <line x1="0" y1="32" x2="60" y2="16" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    renderDivider: (fillColor, height = 48) => (
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
          <polygon points="0,120 1200,0 1200,120" fill={fillColor} />
        </svg>
      </div>
    ),
  },
  {
    id: 'curve-down',
    name: 'قوس مقعر لأسفل',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,16 Q30,34 60,16 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,16 Q30,34 60,16" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    renderDivider: (fillColor, height = 48) => (
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
          <path d="M0,0 Q600,120 1200,0 L1200,120 L0,120 Z" fill={fillColor} />
        </svg>
      </div>
    ),
  },
  {
    id: 'curve-up',
    name: 'قوس محدب لأعلى',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,30 Q30,12 60,30 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,30 Q30,12 60,30" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    renderDivider: (fillColor, height = 48) => (
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
          <path d="M0,120 Q600,0 1200,120 L1200,120 L0,120 Z" fill={fillColor} />
        </svg>
      </div>
    ),
  },
  {
    id: 'triangle',
    name: 'سهم مثلث V',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <polygon points="0,18 30,32 60,18 60,44 0,44" fill="#9ca3af" />
        <polyline points="0,18 30,32 60,18" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    renderDivider: (fillColor, height = 48) => (
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
          <polygon points="0,0 600,120 1200,0 1200,120 0,120" fill={fillColor} />
        </svg>
      </div>
    ),
  },
  {
    id: 'asymmetric-wave',
    name: 'موجة متدفقة',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,28 C20,34 35,10 60,24 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,28 C20,34 35,10 60,24" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    renderDivider: (fillColor, height = 48) => (
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
          <path d="M0,70 Q400,140 700,20 T1200,60 L1200,120 L0,120 Z" fill={fillColor} />
        </svg>
      </div>
    ),
  },
  {
    id: 'double-wave',
    name: 'موجة مزدوجة',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,22 Q15,14 30,22 T60,22 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,22 Q15,14 30,22 T60,22" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    renderDivider: (fillColor, height = 48) => (
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
          <path d="M0,50 C150,100 250,0 400,60 C550,120 650,20 800,70 C950,120 1050,20 1200,60 L1200,120 L0,120 Z" fill={fillColor} />
        </svg>
      </div>
    ),
  },
  {
    id: 'zigzag',
    name: 'تعرج متدرج',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <polyline points="0,24 10,18 20,24 30,18 40,24 50,18 60,24" fill="none" stroke="#6b7280" strokeWidth="1" />
        <polygon points="0,24 10,18 20,24 30,18 40,24 50,18 60,24 60,44 0,44" fill="#9ca3af" />
      </svg>
    ),
    renderDivider: (fillColor, height = 48) => (
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
          <polygon points="0,60 100,0 200,60 300,0 400,60 500,0 600,60 700,0 800,60 900,0 1000,60 1100,0 1200,60 1200,120 0,120" fill={fillColor} />
        </svg>
      </div>
    ),
  },
  {
    id: 'tilt-right',
    name: 'انحدار يمين',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <polygon points="0,16 60,32 60,44 0,44" fill="#9ca3af" />
        <line x1="0" y1="16" x2="60" y2="32" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    renderDivider: (fillColor, height = 48) => (
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
          <polygon points="0,0 1200,120 0,120" fill={fillColor} />
        </svg>
      </div>
    ),
  },
  {
    id: 'tilt-left',
    name: 'انحدار يسار',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <polygon points="0,32 60,16 60,44 0,44" fill="#9ca3af" />
        <line x1="0" y1="32" x2="60" y2="16" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    renderDivider: (fillColor, height = 48) => (
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
          <polygon points="0,120 1200,0 1200,120 0,120" fill={fillColor} />
        </svg>
      </div>
    ),
  },
  {
    id: 'clouds',
    name: 'سحابي منحني',
    renderPreview: (active) => (
      <svg viewBox="0 0 60 44" className="w-full h-full rounded-md overflow-hidden">
        <rect x="0" y="0" width="60" height="44" fill="#ffffff" />
        <path d="M0,26 Q10,14 20,24 Q30,12 40,24 Q50,14 60,26 L60,44 L0,44 Z" fill="#9ca3af" />
        <path d="M0,26 Q10,14 20,24 Q30,12 40,24 Q50,14 60,26" fill="none" stroke="#6b7280" strokeWidth="1" />
      </svg>
    ),
    renderDivider: (fillColor, height = 48) => (
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
          <path d="M0,50 Q150,0 300,50 Q450,0 600,50 Q750,0 900,50 Q1050,0 1200,50 L1200,120 L0,120 Z" fill={fillColor} />
        </svg>
      </div>
    ),
  },
];
