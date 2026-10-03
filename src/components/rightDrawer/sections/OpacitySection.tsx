// Moved verbatim from RightDrawer.tsx (was an inline IIFE in the drawer body).
import React from 'react';
import { Check } from 'lucide-react';
import { CanvasElement, Slide } from '../../../types';
import { RightDrawerProps } from '../types';

interface OpacitySectionProps {
  activeSlide: Slide;
  onUpdateElementStyles: RightDrawerProps['onUpdateElementStyles'];
  onUpdateSlideOpacity: RightDrawerProps['onUpdateSlideOpacity'];
  opacityPart: 'element' | 'background';
  opacityTarget: 'element' | 'slide';
  selectedElement: RightDrawerProps['selectedElement'];
  setOpacityPart: React.Dispatch<React.SetStateAction<'element' | 'background'>>;
  setOpacityTarget: React.Dispatch<React.SetStateAction<'element' | 'slide'>>;
  styles: CanvasElement['styles'];
}

export const OpacitySection = ({
  activeSlide,
  onUpdateElementStyles,
  onUpdateSlideOpacity,
  opacityPart,
  opacityTarget,
  selectedElement,
  setOpacityPart,
  setOpacityTarget,
  styles,
}: OpacitySectionProps) => {
  const isTargetElement = opacityTarget === 'element' && !!selectedElement;
              
  // Check if element has background
  const elementHasBg = Boolean(
    (styles.backgroundColor && styles.backgroundColor !== 'transparent' && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
    styles.backgroundImage
  );
              
  // Check if slide has background
  const slideHasBg = Boolean(
    (activeSlide?.backgroundColor && activeSlide.backgroundColor !== 'transparent' && activeSlide.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
    activeSlide?.backgroundImage
  );

  const currentHasBg = isTargetElement ? elementHasBg : slideHasBg;

  // Effective opacityPart (fallback to element if background is not available)
  const effectivePart = (opacityPart === 'background' && !currentHasBg) ? 'element' : opacityPart;

  // Read current opacity value based on target and part
  let currentOpacity = 1;
  if (isTargetElement) {
    if (effectivePart === 'background') {
      currentOpacity = styles.backgroundOpacity ?? 1;
    } else {
      currentOpacity = styles.contentOpacity ?? styles.opacity ?? 1;
    }
  } else {
    if (effectivePart === 'background') {
      currentOpacity = activeSlide?.backgroundOpacity ?? 1;
    } else {
      currentOpacity = activeSlide?.opacity ?? 1;
    }
  }

  // Handler to update opacity
  const handleOpacityChange = (val: number) => {
    const roundedVal = Math.round(val * 100) / 100;
    if (isTargetElement) {
      if (effectivePart === 'background') {
        onUpdateElementStyles({ backgroundOpacity: roundedVal });
      } else {
        onUpdateElementStyles({ contentOpacity: roundedVal, opacity: roundedVal });
      }
    } else if (activeSlide) {
      if (effectivePart === 'background') {
        onUpdateSlideOpacity?.(activeSlide.id, { backgroundOpacity: roundedVal });
      } else {
        onUpdateSlideOpacity?.(activeSlide.id, { opacity: roundedVal });
      }
    }
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Target Scope Switcher (العنصر المختار / الشريحة الحالية) */}
      {selectedElement && (
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
          <button
            onClick={() => setOpacityTarget('element')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              opacityTarget === 'element' 
                ? 'bg-white text-[#0071e3] shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            العنصر المختار
          </button>
          <button
            onClick={() => setOpacityTarget('slide')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              opacityTarget === 'slide' 
                ? 'bg-white text-[#0071e3] shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            الشريحة الحالية
          </button>
        </div>
      )}

      {/* Main Pill Selector (كما في الرسم اليدوي: الخلفية / العنصر) */}
      <div className="p-1 bg-neutral-100 rounded-2xl border border-neutral-200/80 flex items-center gap-1 shadow-2xs">
        {/* خيار العنصر */}
        <button
          onClick={() => setOpacityPart('element')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            effectivePart === 'element'
              ? 'bg-white text-[#0071e3] shadow-sm ring-1 ring-black/[0.04]'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/50'
          }`}
        >
          <span>العنصر</span>
          <span className="text-[10px] text-neutral-400 font-normal">
            {isTargetElement ? '(النص والمحتوى)' : '(المحتوى)'}
          </span>
        </button>

        {/* خيار الخلفية - معطل في حال كان العنصر أو الشريحة بلا خلفية */}
        <button
          onClick={() => {
            if (currentHasBg) {
              setOpacityPart('background');
            }
          }}
          disabled={!currentHasBg}
          title={!currentHasBg ? 'هذا العنصر بلا لون أو صورة خلفية حالياً' : 'تعديل شفافية الخلفية'}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            !currentHasBg
              ? 'opacity-40 cursor-not-allowed bg-neutral-200/40 text-neutral-400'
              : effectivePart === 'background'
                ? 'bg-white text-[#0071e3] shadow-sm ring-1 ring-black/[0.04] cursor-pointer'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/50 cursor-pointer'
          }`}
        >
          <span>الخلفية</span>
          {!currentHasBg && (
            <span className="text-[9.5px] px-1 py-0.2 bg-neutral-300/60 rounded text-neutral-500 font-normal">
              معطل
            </span>
          )}
        </button>
      </div>

      {/* تنبيه تعطيل خيار الخلفية إذا لم تكن هناك خلفية */}
      {!currentHasBg && (
        <div className="p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 flex items-start gap-2 animate-fadeIn">
          <span className="text-amber-500 text-sm shrink-0">ℹ️</span>
          <div className="leading-tight">
            <p className="font-bold text-[11px]">
              {isTargetElement ? 'العنصر بدون خلفية (شفافة)' : 'الشريحة بدون خلفية'}
            </p>
            <p className="text-[10px] text-amber-700/85 mt-0.5">
              تم تعطيل خيار شفافية الخلفية لعدم وجود لون أو صورة خلفية. يمكنك تعيين خلفية من قسم «تعديل الخلفية» لتفعيله.
            </p>
          </div>
        </div>
      )}

      {/* بطاقة معلومات النمط النشط وقيمة الشفافية */}
      <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-2.5 rounded-xl">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-[#0071e3]">
            {effectivePart === 'element'
              ? (isTargetElement ? 'شفافية العنصر نفسه (النص/المحتوى)' : 'شفافية عناصر ومحتوى الشريحة')
              : (isTargetElement ? 'شفافية خلفية العنصر' : 'شفافية خلفية الشريحة')}
          </span>
          <span className="font-mono text-[#0071e3] font-extrabold text-sm">
            {Math.round(currentOpacity * 100)}%
          </span>
        </div>
        <p className="text-[10px] text-neutral-500 mt-1">
          {effectivePart === 'element'
            ? 'تطبيق الشفافية على النص أو المحتوى مع بقاء الخلفية واضحة كما هي.'
            : 'تطبيق الشفافية على لون أو صورة الخلفية فقط مع بقاء النص واضحاً ومقروءاً.'}
        </p>
      </div>

      {/* شريط السحب لتعديل الشفافية */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={currentOpacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
          className="w-full accent-[#0071e3] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
          <span>0% (شفاف)</span>
          <span>50%</span>
          <span>100% (معتم)</span>
        </div>
      </div>

      {/* أزرار سريعة للنسب المئوية */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-semibold text-neutral-600 block">
          نسب جاهزة وسريعة:
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 0.75, 0.5, 0.25, 0.1].map((val) => {
            const isSelected = Math.abs(currentOpacity - val) < 0.03;
            return (
              <button
                key={val}
                onClick={() => handleOpacityChange(val)}
                className={`py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0071e3] text-white border-[#0071e3] font-bold shadow-xs'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                {Math.round(val * 100)}%
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
