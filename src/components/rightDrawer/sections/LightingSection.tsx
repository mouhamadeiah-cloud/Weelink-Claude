// Moved verbatim from RightDrawer.tsx (was an inline IIFE in the drawer body).
import React from 'react';
import { Check } from 'lucide-react';
import { CanvasElement, Slide, getGlowShadowStyle, getLightGradientStyle } from '../../../types';
import { RightDrawerProps } from '../types';

interface LightingSectionProps {
  activeSlide: Slide;
  customColors: [string, string, string, string, string];
  lightingTarget: 'element' | 'slide';
  onUpdateElementStyles: RightDrawerProps['onUpdateElementStyles'];
  onUpdateSlideGlow: RightDrawerProps['onUpdateSlideGlow'];
  selectedElement: RightDrawerProps['selectedElement'];
  setLightingTarget: React.Dispatch<React.SetStateAction<'element' | 'slide'>>;
  styles: CanvasElement['styles'];
}

export const LightingSection = ({
  activeSlide,
  customColors,
  lightingTarget,
  onUpdateElementStyles,
  onUpdateSlideGlow,
  selectedElement,
  setLightingTarget,
  styles,
}: LightingSectionProps) => {
  const isTargetElement = lightingTarget === 'element' && !!selectedElement;

  // Read values based on target (innerGlowIntensity/innerGlowColor/innerGlowPosition maps to inner lighting)
  const activeLightIntensity = isTargetElement 
    ? (styles.innerGlowIntensity ?? 0) 
    : (activeSlide?.innerGlowIntensity ?? 0);
  const activeLightColor = isTargetElement 
    ? (styles.innerGlowColor || '#0071e3') 
    : (activeSlide?.innerGlowColor || '#0071e3');
  const activeLightPosition = isTargetElement 
    ? (styles.innerGlowPosition || 'center') 
    : (activeSlide?.innerGlowPosition || 'center');
  const activeBrightness = isTargetElement 
    ? (styles.brightness || 100) 
    : 100;

  // Update functions
  const updateLightIntensity = (intensity: number) => {
    if (isTargetElement) {
      onUpdateElementStyles({ innerGlowIntensity: intensity });
    } else if (activeSlide) {
      onUpdateSlideGlow?.(activeSlide.id, { innerGlowIntensity: intensity });
    }
  };

  const updateLightColor = (color: string) => {
    if (isTargetElement) {
      onUpdateElementStyles({ innerGlowColor: color });
    } else if (activeSlide) {
      onUpdateSlideGlow?.(activeSlide.id, { innerGlowColor: color });
    }
  };

  const updateLightPosition = (pos: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
    if (isTargetElement) {
      onUpdateElementStyles({ innerGlowPosition: pos });
    } else if (activeSlide) {
      onUpdateSlideGlow?.(activeSlide.id, { innerGlowPosition: pos });
    }
  };

  // 50 basic colors (10 rows of 5 colors each, representing key spectral/design system colors)
  const BASIC_50_COLORS = [
    '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
    '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412',
    '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#854d0e',
    '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d',
    '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59',
    '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75',
    '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
    '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8',
    '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d',
    '#ffffff', '#f3f4f6', '#e5e7eb', '#4b5563', '#111827'
  ];

  // 9 Directions mapping to labels and CSS styles
  const DIRECTION_CELLS = [
    { id: 'top-left', label: 'أعلى يسار', name: 'زاوية علوية يسار' },
    { id: 'top', label: 'أعلى', name: 'أعلى الوسط' },
    { id: 'top-right', label: 'أعلى يمين', name: 'زاوية علوية يمين' },
    { id: 'left', label: 'يسار', name: 'الوسط يسار' },
    { id: 'center', label: 'الوسط', name: 'من جميع الجهات' },
    { id: 'right', label: 'يمين', name: 'الوسط يمين' },
    { id: 'bottom-left', label: 'أسفل يسار', name: 'زاوية سفلية يسار' },
    { id: 'bottom', label: 'أسفل', name: 'أسفل الوسط' },
    { id: 'bottom-right', label: 'أسفل يمين', name: 'زاوية سفلية يمين' },
  ] as const;

  return (
    <div className="space-y-4 text-right" dir="rtl">
                  
      {/* Target Scope Switcher (تعديل إضاءة العنصر أو الشريحة) */}
      {selectedElement && (
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
          <button
            onClick={() => setLightingTarget('element')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              lightingTarget === 'element' 
                ? 'bg-white text-[#0071e3] shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            العنصر المختار
          </button>
          <button
            onClick={() => setLightingTarget('slide')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              lightingTarget === 'slide' 
                ? 'bg-white text-[#0071e3] shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            الشريحة الحالية
          </button>
        </div>
      )}

      <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-2.5 rounded-xl text-center">
        <span className="text-[11px] font-bold text-[#0071e3]">
          {isTargetElement 
            ? `تعديل إضاءة العنصر: ${selectedElement.name}` 
            : `تعديل إضاءة الشريحة: ${activeSlide?.name || 'الشريحة الحالية'}`}
        </span>
      </div>

      {/* أولاً: درجة السطوع الأساسية (للعناصر فقط) */}
      {isTargetElement && (
        <div className="space-y-1.5 pb-2 border-b border-neutral-200/70">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-700 font-bold">سطوع العنصر (Brightness):</span>
            <span className="font-mono text-neutral-500 font-bold">{activeBrightness}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            step="5"
            value={activeBrightness}
            onChange={(e) => onUpdateElementStyles({ brightness: Number(e.target.value) })}
            className="w-full accent-[#0071e3]"
          />
        </div>
      )}

      {/* أولاً: درجة الإضاءة (Intensity / Spread / Glow Radius) */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-neutral-700 font-bold">شدة ومدى الإضاءة الداخلية (Lighting Intensity):</span>
          <span className="font-mono text-[#0071e3] font-bold">{activeLightIntensity}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={activeLightIntensity}
          onChange={(e) => updateLightIntensity(Number(e.target.value))}
          className="w-full accent-[#0071e3] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
          <span>إيقاف (0px)</span>
          <span>متوسط (25px)</span>
          <span>شديد (50px)</span>
        </div>
      </div>

      {/* ثانياً: لون الإضاءة */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-neutral-800 block">
          لون الإضاءة والتوهج الداخلي (Light Color):
        </span>

        {/* أ. ألوان الصفحة الافتراضية */}
        <div className="space-y-1">
          <span className="text-[10px] text-neutral-400 font-semibold block">
            ألوان الصفحة الافتراضية:
          </span>
          <div className="flex gap-2 p-1.5 bg-neutral-50 rounded-xl border border-neutral-200/65">
            {customColors.map((hex, idx) => {
              const isSelected = activeLightColor.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={`light-palette-color-${idx}-${hex}`}
                  onClick={() => updateLightColor(hex)}
                  className={`w-7 h-7 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                    isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                  title={`لون الصفحة ${idx + 1}: ${hex}`}
                >
                  {isSelected && (
                    <Check 
                      size={12} 
                      className={['#ffffff', '#e5e5ea', '#f5f5f7'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} 
                      strokeWidth={3} 
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ب. الخمسين لون الأساسية */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-neutral-400 font-semibold block">
              الخمسون لوناً الأساسية:
            </span>
            <span className="text-[9px] text-neutral-400 font-mono" dir="ltr">50 basic colors</span>
          </div>
          <div className="p-2 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-h-40 overflow-y-auto pr-1">
            <div className="grid grid-cols-10 gap-1.5">
              {BASIC_50_COLORS.map((hex, idx) => {
                const isSelected = activeLightColor.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={`light-basic-color-${idx}-${hex}`}
                    onClick={() => updateLightColor(hex)}
                    className={`w-5 h-5 rounded-md border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-4xs flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                    }`}
                    style={{ backgroundColor: hex }}
                    title={hex}
                  >
                    {isSelected && (
                      <Check 
                        size={10} 
                        className={['#ffffff', '#f3f4f6', '#e5e7eb'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} 
                        strokeWidth={3} 
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* منتقي لون حر مخصص */}
        <div className="flex items-center gap-1.5 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
          <input
            type="color"
            value={activeLightColor.startsWith('#') ? activeLightColor : '#0071e3'}
            onChange={(e) => updateLightColor(e.target.value)}
            className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0 shadow-3xs"
          />
          <input
            type="text"
            value={activeLightColor}
            onChange={(e) => updateLightColor(e.target.value)}
            placeholder="اختر لوناً حراً"
            className="flex-1 text-[11px] px-2 py-1 bg-white rounded-md border border-neutral-200 font-mono text-left"
            dir="ltr"
          />
        </div>
      </div>

      {/* ثالثاً: مربعات خفيفة تبرز مربعات رمادية مطبق عليها الإضاءة من الداخل */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-bold text-neutral-800 block">
          توجيه اتجاه وزاوية الإضاءة الداخلية (Light Position):
        </span>
        <p className="text-[10px] text-neutral-500 leading-tight">
          انقر على المربع لتوجيه الإضاءة في الاتجاه المرغوب. تبرز المعاينات شكل الإضاءة الداخلية (inset) المطبقة على مربع رمادي افتراضي:
        </p>

        {/* 3x3 Grid of Direction Previews (using isInset = true) */}
        <div className="bg-neutral-100 p-3 rounded-2xl border border-neutral-200/80 flex justify-center items-center">
          <div className="grid grid-cols-3 gap-3.5 max-w-[240px] w-full">
            {DIRECTION_CELLS.map((cell) => {
              const isSelected = activeLightPosition === cell.id;
              const previewIntensity = activeLightIntensity > 0 ? Math.min(activeLightIntensity, 16) : 10;
              const boxPreviewShadow = getGlowShadowStyle(previewIntensity, activeLightColor, cell.id, true);

              return (
                <button
                  key={`light-dir-${cell.id}`}
                  onClick={() => updateLightPosition(cell.id)}
                  className={`relative aspect-square rounded-xl p-1 transition-all flex flex-col items-center justify-center cursor-pointer border-2 bg-white ${
                    isSelected
                      ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-xs scale-105 z-10'
                      : 'border-transparent hover:border-neutral-300'
                  }`}
                  title={cell.name}
                >
                  {/* Gray square with the specific glow direction applied inwardly (inset) */}
                  <div 
                    className="w-9 h-9 rounded-lg bg-neutral-300 relative overflow-hidden transition-all flex items-center justify-center border border-neutral-300/40"
                  >
                    {/* Gradual Fading Inset Glow Preview Layer */}
                    <div 
                      className="absolute inset-0 pointer-events-none mix-blend-screen"
                      style={getLightGradientStyle(previewIntensity, activeLightColor, cell.id)}
                    />

                    {isSelected ? (
                      <span className="w-4 h-4 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-bold shadow-4xs shrink-0 z-20">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-bold text-[#1d1d1f] pointer-events-none select-none z-10 bg-white/40 px-1 rounded-sm">
                        {cell.label}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
