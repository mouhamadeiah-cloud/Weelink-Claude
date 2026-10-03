// Moved verbatim from RightDrawer.tsx (was an inline IIFE in the drawer body).
import React from 'react';
import { Check } from 'lucide-react';
import { CanvasElement, Slide } from '../../../types';
import { RightDrawerProps } from '../types';

interface BorderSectionProps {
  activeSlide: Slide;
  borderTarget: 'element' | 'slide';
  onUpdateElementStyles: RightDrawerProps['onUpdateElementStyles'];
  onUpdateSlideBorder: RightDrawerProps['onUpdateSlideBorder'];
  selectedElement: RightDrawerProps['selectedElement'];
  setBorderTarget: React.Dispatch<React.SetStateAction<'element' | 'slide'>>;
  styles: CanvasElement['styles'];
}

export const BorderSection = ({
  activeSlide,
  borderTarget,
  onUpdateElementStyles,
  onUpdateSlideBorder,
  selectedElement,
  setBorderTarget,
  styles,
}: BorderSectionProps) => {
  // Determine current targets and styles
  const isTargetElement = borderTarget === 'element' && !!selectedElement;
  const activeBorderWidth = isTargetElement 
    ? (styles.borderWidth ?? 0) 
    : (activeSlide?.borderWidth ?? 0);
  const activeBorderRadius = isTargetElement 
    ? (styles.borderRadius ?? 0) 
    : (activeSlide?.borderRadius ?? 0);
  const activeBorderColor = isTargetElement 
    ? (styles.borderColor || 'transparent') 
    : (activeSlide?.borderColor || 'transparent');
  const activeBorderStyle = isTargetElement 
    ? (styles.borderStyle || 'none') 
    : (activeSlide?.borderStyle || 'none');

  // Functions to apply modifications
  const updateWidth = (w: number) => {
    if (isTargetElement) {
      onUpdateElementStyles({ borderWidth: w, borderStyle: activeBorderStyle === 'none' ? 'solid' : activeBorderStyle });
    } else if (activeSlide) {
      onUpdateSlideBorder(activeSlide.id, { borderWidth: w, borderStyle: activeBorderStyle === 'none' ? 'solid' : activeBorderStyle });
    }
  };

  const updateRadius = (r: number) => {
    if (isTargetElement) {
      onUpdateElementStyles({ borderRadius: r });
    } else if (activeSlide) {
      onUpdateSlideBorder(activeSlide.id, { borderRadius: r });
    }
  };

  const updateColor = (c: string) => {
    if (isTargetElement) {
      onUpdateElementStyles({ borderColor: c, borderStyle: activeBorderStyle === 'none' ? 'solid' : activeBorderStyle });
    } else if (activeSlide) {
      onUpdateSlideBorder(activeSlide.id, { borderColor: c, borderStyle: activeBorderStyle === 'none' ? 'solid' : activeBorderStyle });
    }
  };

  const updateStyle = (s: string) => {
    if (isTargetElement) {
      onUpdateElementStyles({ borderStyle: s, borderWidth: s === 'none' ? 0 : (activeBorderWidth || 2) });
    } else if (activeSlide) {
      onUpdateSlideBorder(activeSlide.id, { borderStyle: s, borderWidth: s === 'none' ? 0 : (activeBorderWidth || 2) });
    }
  };

  const applyPreset = (presetStyle: any) => {
    if (isTargetElement) {
      onUpdateElementStyles(presetStyle);
    } else if (activeSlide) {
      onUpdateSlideBorder(activeSlide.id, presetStyle);
    }
  };

  // Grid of 20 high-quality border design presets
  const BORDER_PRESETS_20 = [
    { id: 'b_solid_thin', label: 'متصل رفيع', name: 'إطار كلاسيكي رفيع متصل', style: { borderStyle: 'solid', borderWidth: 1, borderRadius: 8, borderColor: '#e5e5ea' } },
    { id: 'b_solid_thick', label: 'متصل سميك', name: 'إطار كلاسيكي سميك', style: { borderStyle: 'solid', borderWidth: 4, borderRadius: 12, borderColor: '#1d1d1f' } },
    { id: 'b_dashed_thin', label: 'متقطع ناعم', name: 'إطار تقني متقطع', style: { borderStyle: 'dashed', borderWidth: 1.5, borderRadius: 8, borderColor: '#0071e3' } },
    { id: 'b_dashed_thick', label: 'متقطع بارز', name: 'إطار متقطع سميك', style: { borderStyle: 'dashed', borderWidth: 3.5, borderRadius: 16, borderColor: '#dc2626' } },
    { id: 'b_dotted_thin', label: 'منقط ناعم', name: 'إطار طابع بريدي ناعم', style: { borderStyle: 'dotted', borderWidth: 2, borderRadius: 6, borderColor: '#6b7280' } },
    { id: 'b_dotted_thick', label: 'منقط سميك', name: 'إطار منقط عريض', style: { borderStyle: 'dotted', borderWidth: 5, borderRadius: 20, borderColor: '#4f46e5' } },
    { id: 'b_double_classic', label: 'خط مزدوج', name: 'إطار ملكي مزدوج كلاسيكي', style: { borderStyle: 'double', borderWidth: 4, borderRadius: 10, borderColor: '#1d1d1f' } },
    { id: 'b_double_thick', label: 'مزدوج عريض', name: 'إطار مزدوج عريض وفخم', style: { borderStyle: 'double', borderWidth: 7, borderRadius: 14, borderColor: '#d97706' } },
    { id: 'b_groove_3d', label: 'أخدود ثلاثي', name: 'إطار منقوش غائر ثلاثي الأبعاد', style: { borderStyle: 'groove', borderWidth: 4, borderRadius: 12, borderColor: '#059669' } },
    { id: 'b_ridge_3d', label: 'بروز ثلاثي', name: 'إطار بارز منقوش ثلاثي الأبعاد', style: { borderStyle: 'ridge', borderWidth: 4, borderRadius: 12, borderColor: '#2563eb' } },
    { id: 'b_inset_3d', label: 'داخل غائر', name: 'حواف غائرة للداخل ثلاثية الأبعاد', style: { borderStyle: 'inset', borderWidth: 4, borderRadius: 8, borderColor: '#dc2626' } },
    { id: 'b_outset_3d', label: 'خارج بارز', name: 'حواف بارزة للخارج ثلاثية الأبعاد', style: { borderStyle: 'outset', borderWidth: 4, borderRadius: 8, borderColor: '#7c3aed' } },
    { id: 'b_retro_neobrutal', label: 'بروتاليست حاد', name: 'نيوبروتاليست حاد الحواف', style: { borderStyle: 'solid', borderWidth: 3, borderRadius: 0, borderColor: '#000000' } },
    { id: 'b_retro_curved', label: 'بروتاليست دافئ', name: 'نيوبروتاليست دافئ الحواف', style: { borderStyle: 'solid', borderWidth: 3, borderRadius: 16, borderColor: '#000000' } },
    { id: 'b_gold_royal', label: 'ذهبي ملكي', name: 'إطار ذهبي ملكي كلاسيكي', style: { borderStyle: 'double', borderWidth: 5, borderRadius: 4, borderColor: '#d4af37' } },
    { id: 'b_neon_cyan', label: 'نيون متوهج', name: 'إطار سيان نيون مضيء', style: { borderStyle: 'solid', borderWidth: 2, borderRadius: 12, borderColor: '#00f2fe' } },
    { id: 'b_glass_light', label: 'زجاجي ناعم', name: 'إطار زجاجي شفاف ناعم', style: { borderStyle: 'solid', borderWidth: 1, borderRadius: 20, borderColor: 'rgba(120,120,120,0.4)' } },
    { id: 'b_badge_corner', label: 'حواف بطاقة', name: 'إطار مخصص للشارات والبطاقات', style: { borderStyle: 'solid', borderWidth: 2, borderRadius: 24, borderColor: '#e0c3fc' } },
    { id: 'b_stitch_gray', label: 'خياطة رمادية', name: 'نمط خياطة رمادية ناعمة', style: { borderStyle: 'dashed', borderWidth: 1, borderRadius: 10, borderColor: '#9e9e9e' } },
    { id: 'b_thick_charcoal', label: 'فحم عريض', name: 'إطار فحمي عريض جداً', style: { borderStyle: 'solid', borderWidth: 8, borderRadius: 16, borderColor: '#1c1c1e' } },
  ];

  return (
    <div className="space-y-4 text-right" dir="rtl">
                  
      {/* Target Toggle Tab (إذا كان هناك عنصر محدد، يتيح الاختيار بين تعديل إطار العنصر أو الشريحة) */}
      {selectedElement && (
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
          <button
            onClick={() => setBorderTarget('element')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              borderTarget === 'element' 
                ? 'bg-white text-[#0071e3] shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            العنصر المختار
          </button>
          <button
            onClick={() => setBorderTarget('slide')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              borderTarget === 'slide' 
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
            ? `تعديل إطار العنصر: ${selectedElement.name}` 
            : `تعديل إطار الشريحة: ${activeSlide?.name || 'الشريحة الحالية'}`}
        </span>
      </div>

      {/* 1. سمك الإطار */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-neutral-700 font-bold">سمك الإطار (Border Width):</span>
          <span className="font-mono text-[#0071e3] font-bold">{activeBorderWidth}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          value={activeBorderWidth}
          onChange={(e) => updateWidth(Number(e.target.value))}
          className="w-full accent-[#0071e3]"
        />
      </div>

      {/* 2. درجة تدوير الحواف */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-neutral-700 font-bold">تدوير الحواف (Border Radius):</span>
          <span className="font-mono text-[#0071e3] font-bold">{activeBorderRadius}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={activeBorderRadius}
          onChange={(e) => updateRadius(Number(e.target.value))}
          className="w-full accent-[#0071e3]"
        />
      </div>

      {/* 3. نوع الإطار */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-neutral-800 block">
          خيارات نمط الإطار (Border Style):
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'none', label: 'بدون إطار' },
            { id: 'solid', label: 'متصل ──' },
            { id: 'dashed', label: 'متقطع ╌╌' },
            { id: 'dotted', label: 'منقط ┈┈' },
          ].map((item) => {
            const isSelected = activeBorderStyle === item.id;
            return (
              <button
                key={`border-style-${item.id}`}
                onClick={() => updateStyle(item.id)}
                className={`py-2 px-1 rounded-xl border text-[10.5px] font-semibold text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] ring-1 ring-[#0071e3]'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. لون الإطار */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-neutral-800 block">
          لون الإطار (Border Color):
        </span>
                    
        {/* لوحة الألوان القياسية */}
        <div className="grid grid-cols-10 gap-1.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200/70">
          {['#ffffff', '#000000', '#0071e3', '#1d1d1f', '#e5e5ea', '#dc2626', '#059669', '#d97706', '#7c3aed', '#f43f5e'].map((hex) => {
            const isSelected = activeBorderColor.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={`border-color-std-${hex}`}
                onClick={() => updateColor(hex)}
                className={`w-5.5 h-5.5 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                  isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                }`}
                style={{ backgroundColor: hex }}
                title={hex}
              >
                {isSelected && (
                  <Check 
                    size={10} 
                    className={['#ffffff', '#e5e5ea'].includes(hex) ? 'text-black' : 'text-white'} 
                    strokeWidth={3} 
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* منتقي لون مخصص */}
        <div className="flex items-center gap-1.5 bg-neutral-50 p-1 rounded-lg border border-neutral-200">
          <input
            type="color"
            value={activeBorderColor.startsWith('#') ? activeBorderColor : '#1d1d1f'}
            onChange={(e) => updateColor(e.target.value)}
            className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent shrink-0"
          />
          <input
            type="text"
            value={activeBorderColor}
            onChange={(e) => updateColor(e.target.value)}
            placeholder="اختر لوناً"
            className="flex-1 text-[10px] px-1.5 py-0.5 bg-white rounded border border-neutral-200 font-mono text-left"
            dir="ltr"
          />
        </div>
      </div>

      {/* 5. ٢٠ إطاراً شكل ومقترح مبتكر */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800">
            معرض ٢٠ شكلاً وتصميماً ملهماً للإطارات:
          </span>
          <span className="text-[9.5px] text-neutral-400">
            (تطبيق بنقرة واحدة)
          </span>
        </div>

        <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-h-56 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2">
            {BORDER_PRESETS_20.map((preset) => {
              const isCurrent = activeBorderStyle === preset.style.borderStyle && 
                                activeBorderWidth === preset.style.borderWidth &&
                                activeBorderColor.toLowerCase() === preset.style.borderColor.toLowerCase();
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.style)}
                  className={`p-2 rounded-xl border text-right transition-all cursor-pointer relative group flex flex-col gap-1 ${
                    isCurrent 
                      ? 'border-[#0071e3] bg-[#0071e3]/10 ring-1 ring-[#0071e3]' 
                      : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-neutral-700">
                      {preset.label}
                    </span>
                    {isCurrent && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0071e3] flex items-center justify-center shrink-0">
                        <Check size={8} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                              
                  {/* مظهر معاينة مصغر للإطار */}
                  <div 
                    className="w-full h-5 rounded-md mt-0.5" 
                    style={{
                      borderStyle: preset.style.borderStyle,
                      borderWidth: `${Math.min(preset.style.borderWidth, 3)}px`,
                      borderColor: preset.style.borderColor,
                      borderRadius: `${Math.min(preset.style.borderRadius, 6)}px`,
                      backgroundColor: 'rgba(0,0,0,0.02)'
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
