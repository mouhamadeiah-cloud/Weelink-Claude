// Moved verbatim from RightDrawer.tsx (was an inline block in the drawer body).
import React from 'react';
import { Check } from 'lucide-react';
import { CanvasElement } from '../../../types';
import { FIFTY_SOLID_COLORS, MANDATORY_BG_COLORS, PASTEL_SOFT_GRADIENTS, RICH_MULTI_GRADIENTS } from '../../../data/backgroundPresets';
import { RightDrawerProps } from '../types';
import { elementDisplayName } from '../../../utils/elementLabels';

interface ColorSectionProps {
  elementGradientCategory: string;
  onUpdateElementStyles: RightDrawerProps['onUpdateElementStyles'];
  selectedElement: RightDrawerProps['selectedElement'];
  setElementGradientCategory: React.Dispatch<React.SetStateAction<string>>;
  styles: CanvasElement['styles'];
}

export const ColorSection = ({
  elementGradientCategory,
  onUpdateElementStyles,
  selectedElement,
  setElementGradientCategory,
  styles,
}: ColorSectionProps) => {
  return (
    <div className="space-y-4 text-right" dir="rtl">

      {(selectedElement?.type === 'image' || selectedElement?.type === 'gallery') ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-2.5 rounded-xl text-center">
            <span className="text-[11px] font-bold text-[#0071e3]">
              {selectedElement.type === 'gallery' ? 'تعديل ألوان وفلاتر صور المعرض: ' : 'تعديل ألوان وفلاتر الصورة: '}
              {elementDisplayName(selectedElement)}
            </span>
          </div>

          {/* 1. فلاتر وتأثيرات ألوان الصورة */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                فلاتر وتأثيرات الألوان الجاهزة:
              </span>
              <span className="text-[10px] text-neutral-400">
                (فلاتر بصرية)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
              {[
                { id: 'none', name: 'أصلي (الطبيعي)', preview: '🖼️' },
                { id: 'grayscale', name: 'أبيض وأسود', preview: '🌗' },
                { id: 'warm', name: 'عتيق دافئ', preview: '🌅' },
                { id: 'cool', name: 'أزرق بارد', preview: '❄️' },
                { id: 'vintage', name: 'كلاسيكي قديم', preview: '🕰️' },
                { id: 'technicolor', name: 'سينمائي زاهي', preview: '🎬' },
                { id: 'invert', name: 'عكس الألوان', preview: '🧩' },
                { id: 'blur', name: 'تغبيش / ضبابي', preview: '🌫️' }
              ].map((filterOpt) => {
                const isSelected = (styles.imageFilter || 'none') === filterOpt.id;
                return (
                  <button
                    key={filterOpt.id}
                    type="button"
                    onClick={() => onUpdateElementStyles({ imageFilter: filterOpt.id === 'none' ? undefined : filterOpt.id })}
                    className={`p-2 rounded-xl border text-[11px] font-semibold text-right transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] ring-1 ring-[#0071e3]'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <span className="text-sm select-none">{filterOpt.preview}</span>
                    <span className="truncate">{filterOpt.name}</span>
                    {isSelected && <Check size={12} className="text-[#0071e3] mr-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. تلوين مخصص من مكتبة الخمسين لون الأساسية */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                تغيير ألوان الصورة من الـ 50 لوناً الأساسية:
              </span>
              <span className="text-[10px] text-neutral-400">
                (صبغ وتلوين دمج)
              </span>
            </div>

            <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/70">
              <div className="grid grid-cols-10 gap-1.5 justify-items-center">
                {FIFTY_SOLID_COLORS.map((hex, idx) => {
                  const isSelected = styles.imageTintColor?.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={`image-tint-fifty-${idx}-${hex}`}
                      type="button"
                      onClick={() => onUpdateElementStyles({ imageTintColor: hex })}
                      className={`w-5.5 h-5.5 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                        isSelected ? 'ring-2 ring-[#0071e3] ring-offset-1 scale-110 z-10' : ''
                      }`}
                      style={{ backgroundColor: hex }}
                      title={`تلوين: ${hex}`}
                    >
                      {isSelected && (
                        <Check 
                          size={10} 
                          className={['#ffffff', '#fafafa', '#f5f5f7'].includes(hex) ? 'text-black' : 'text-white'} 
                          strokeWidth={3} 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* إزالة التلوين */}
            {styles.imageTintColor && (
              <button
                type="button"
                onClick={() => onUpdateElementStyles({ imageTintColor: undefined })}
                className="w-full py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-red-200/55"
              >
                <span>إزالة تلوين الصورة ✕</span>
              </button>
            )}
          </div>

          {/* 3. شريط كثافة التلوين (إذا كان مفعلاً) */}
          {styles.imageTintColor && (
            <>
              <div className="space-y-1.5 pt-1 border-t border-neutral-200/80">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-700 font-bold">كثافة صبغ الألوان:</span>
                  <span className="font-mono text-[#0071e3] font-bold">{styles.imageTintOpacity ?? 50}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={styles.imageTintOpacity ?? 50}
                  onChange={(e) => onUpdateElementStyles({ imageTintOpacity: Number(e.target.value) })}
                  className="w-full accent-[#0071e3]"
                />
              </div>

              {/* 4. نمط دمج الألوان */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-neutral-800 block">
                  نمط دمج وصبغ الألوان:
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'multiply', label: 'مضاعفة ✦' },
                    { id: 'color', label: 'تلوين كامل' },
                    { id: 'overlay', label: 'تراكب' },
                    { id: 'screen', label: 'شاشة' }
                  ].map((blend) => {
                    const isSelected = (styles.imageTintBlendMode || 'multiply') === blend.id;
                    return (
                      <button
                        key={blend.id}
                        type="button"
                        onClick={() => onUpdateElementStyles({ imageTintBlendMode: blend.id })}
                        className={`py-1.5 px-0.5 rounded-lg border text-[10px] font-semibold text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] ring-1 ring-[#0071e3]'
                            : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600'
                        }`}
                      >
                        {blend.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* 1. الألوان الإلزامية */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                ألوان سريعة:
              </span>
              <span className="text-[10px] text-neutral-400">
                (أبيض، أسود، أزرق…)
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200/70">
              {MANDATORY_BG_COLORS.map((item) => {
                const isSelected = styles.color === item.value;
                return (
                  <button
                    key={`element-mandatory-${item.name}`}
                    onClick={() => onUpdateElementStyles({ color: item.value })}
                    className="group relative flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                    title={item.name}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        item.border ? 'border border-neutral-300' : 'border border-black/15'
                      } ${
                        isSelected 
                          ? 'ring-2 ring-[#0071e3] ring-offset-2 scale-105 shadow-xs' 
                          : 'shadow-2xs'
                      }`}
                      style={{
                        backgroundColor: item.value === 'transparent' ? '#ffffff' : item.value,
                        backgroundImage: item.value === 'transparent' 
                          ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' 
                          : undefined,
                        backgroundSize: item.value === 'transparent' ? '8px 8px' : undefined,
                      }}
                    >
                      {isSelected && (
                        <Check 
                          size={14} 
                          className={item.value === '#18181b' ? 'text-white' : 'text-[#0071e3]'} 
                          strokeWidth={2.8}
                        />
                      )}
                    </div>
                    <span className="text-[9.5px] font-medium text-neutral-600 truncate max-w-[48px]">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. منحدر لوني - 50 لون */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                ألوان أساسية:
              </span>
              <span className="text-[10px] text-neutral-400">
                (ألوان صلبة دقيقة)
              </span>
            </div>

            <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/70">
              <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                {FIFTY_SOLID_COLORS.map((hex, idx) => {
                  const isSelected = styles.color?.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={`element-fifty-${idx}-${hex}`}
                      onClick={() => onUpdateElementStyles({ color: hex })}
                      className={`w-6 h-6 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                        isSelected ? 'ring-2 ring-[#0071e3] ring-offset-1 scale-110 z-10' : ''
                      }`}
                      style={{ backgroundColor: hex }}
                      title={`لون ${idx + 1}: ${hex}`}
                    >
                      {isSelected && (
                        <Check 
                          size={11} 
                          className={['#ffffff', '#fafafa', '#f5f5f7', '#e5e5ea', '#fffbeb', '#fef3c7'].includes(hex) ? 'text-black' : 'text-white'} 
                          strokeWidth={3} 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. ألوان تدريجية متنوعة مخلطة */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800">
            تدرجات لونية للنص:
          </span>
          <span className="text-[10px] text-neutral-400">
            (تلوّن حروف النص بتدرج)
          </span>
        </div>

        {/* الصف العلوي: باستيل ناعم */}
        <div className="p-2 bg-neutral-50 rounded-2xl border border-neutral-200/60 space-y-1">
          <div className="text-[10px] font-semibold text-neutral-500 mb-1">
            باستيل ناعم متعدد النغمات:
          </div>
          <div className="grid grid-cols-7 gap-1.5 justify-items-center">
            {PASTEL_SOFT_GRADIENTS.map((grad) => {
              const isSelected = styles.color === grad.value;
              return (
                <button
                  key={`element-pastel-${grad.id}`}
                  onClick={() => onUpdateElementStyles({ color: grad.value })}
                  className={`w-7 h-7 rounded-full border border-black/10 shadow-3xs flex items-center justify-center transition-all hover:scale-125 cursor-pointer ${
                    isSelected ? 'ring-2 ring-[#0071e3] ring-offset-2 scale-110 z-10' : ''
                  }`}
                  style={{ background: grad.value }}
                  title={grad.name}
                >
                  {isSelected && (
                    <Check size={12} className="text-neutral-800" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* تصنيفات التدرج للفلترة */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none pt-0.5">
          {[
            { id: 'الكل', label: 'الكل' },
            { id: 'sunset', label: 'شفق وغروب' },
            { id: 'neon', label: 'نيون وكوزميك' },
            { id: 'ocean', label: 'طبيعة وبحر' },
            { id: 'metallic', label: 'ميتاليك وفخامة' },
            { id: 'dark', label: 'ليلي داكن' },
          ].map((filterTab) => (
            <button
              key={`element-filter-${filterTab.id}`}
              onClick={() => setElementGradientCategory(filterTab.id)}
              className={`text-[9.5px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                elementGradientCategory === filterTab.id
                  ? 'bg-[#0071e3] text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-black'
              }`}
            >
              {filterTab.label}
            </button>
          ))}
        </div>

        {/* شبكة التدرجات */}
        <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-h-48 overflow-y-auto pr-1">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 justify-items-center">
            {RICH_MULTI_GRADIENTS
              .filter(g => elementGradientCategory === 'الكل' || g.category === elementGradientCategory)
              .map((grad) => {
                const isSelected = styles.color === grad.value;
                return (
                  <button
                    key={`element-grad-${grad.id}`}
                    onClick={() => onUpdateElementStyles({ color: grad.value })}
                    className={`w-7 h-7 rounded-full border border-black/10 shadow-2xs flex items-center justify-center transition-all hover:scale-125 cursor-pointer ${
                      isSelected ? 'ring-2 ring-[#0071e3] ring-offset-2 scale-110 z-10' : 'hover:z-10'
                    }`}
                    style={{ background: grad.value }}
                    title={grad.name}
                  >
                    {isSelected && (
                      <Check size={12} className="text-white drop-shadow-md" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* منتقي مخصص مع الإدخال */}
      <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
          <input
            type="color"
            value={styles.color?.startsWith('#') ? styles.color : '#ffffff'}
            onChange={(e) => onUpdateElementStyles({ color: e.target.value })}
            className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
          />
          <input
            type="text"
            value={styles.color || '#1d1d1f'}
            onChange={(e) => onUpdateElementStyles({ color: e.target.value })}
            placeholder="#1d1d1f"
            className="flex-1 text-xs px-2 py-1 bg-white rounded-md border border-neutral-200 font-mono text-left"
            dir="ltr"
          />
        </div>
      </div>

    </div>
  );
};
