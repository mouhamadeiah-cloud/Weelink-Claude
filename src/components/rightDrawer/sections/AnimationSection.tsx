// Moved verbatim from RightDrawer.tsx (was an inline IIFE in the drawer body).
import React from 'react';
import { Check } from 'lucide-react';
import { CanvasElement } from '../../../types';
import { RightDrawerProps } from '../types';

interface AnimationSectionProps {
  styles: CanvasElement['styles'];
  onUpdateElementStyles: RightDrawerProps['onUpdateElementStyles'];
}

export const AnimationSection = ({
  styles,
  onUpdateElementStyles,
}: AnimationSectionProps) => {
  const currentAnimation = styles.animation || 'none';
  const currentTrigger = styles.animationTrigger || 'once';
  const currentDuration = styles.animationDuration || (
    ['spin-slow'].includes(currentAnimation) ? 10 :
    ['marquee-rtl', 'marquee-ltr'].includes(currentAnimation) ? 12 :
    ['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale-up', 'scale-down'].includes(currentAnimation) ? 1.2 :
    ['pulse', 'brightness', 'shake', 'bounce', 'flash', 'float', 'heartbeat', 'rubberband', 'swing', 'jello'].includes(currentAnimation) ? 2 : 1.5
  );

  const ANIMATIONS_LIST = [
    { id: 'none', name: 'بدون حركة ✕', desc: 'إيقاف الحركة بالكامل', arrow: '▫️', delay: 1.5 },
    { id: 'fade', name: 'تلاشي ناعم', desc: 'ظهور تدريجي من الشفافية', arrow: '▫️ ➔ ⬜', delay: 1.2 },
    { id: 'slide-up', name: 'انزلاق لأعلى', desc: 'دخول انسيابي للأعلى', arrow: '⬆️', delay: 1.2 },
    { id: 'slide-down', name: 'انزلاق لأسفل', desc: 'دخول انسيابي للأسفل', arrow: '⬇️', delay: 1.2 },
    { id: 'slide-left', name: 'انزلاق لليسار', desc: 'دخول من اليمين لليسار', arrow: '⬅️', delay: 1.2 },
    { id: 'slide-right', name: 'انزلاق لليمين', desc: 'دخول من اليسار لليمين', arrow: '➡️', delay: 1.2 },
    { id: 'marquee-rtl', name: 'شريط متكرر ⇠ يسار', desc: 'شريط متحرك كالنشرات الإخبارية', arrow: '⇠ ⇠ ⇠', delay: 12 },
    { id: 'marquee-ltr', name: 'شريط متكرر ⇢ يمين', desc: 'شريط متحرك لجهة اليمين', arrow: '⇢ ⇢ ⇢', delay: 12 },
    { id: 'pulse', name: 'نبض مستمر', desc: 'تكبير وتصغير متكرر هادئ', arrow: '⤾ ⤿', delay: 2 },
    { id: 'brightness', name: 'وميض سطوع', desc: 'توهج ضوئي دوري لافت', arrow: '✨ 💡', delay: 2 },
    { id: 'scale-up', name: 'تكبير تدريجي', desc: 'نمو سلس من نقطة الصفر', arrow: '🔍 ↗️', delay: 1.2 },
    { id: 'scale-down', name: 'تصغير تدريجي', desc: 'دخول عملاق ثم يستقر', arrow: '🔎 ↙️', delay: 1.2 },
    { id: 'shake', name: 'اهتزاز لافت', desc: 'اهتزاز يمين ويسار للتنبيه', arrow: '⇎ 🫨', delay: 2 },
    { id: 'bounce', name: 'ارتداد نطاطي', desc: 'ارتداد مرن لأعلى وأسفل', arrow: '⇅ 🏀', delay: 2 },
    { id: 'rotate', name: 'دوران 360', desc: 'دوران كامل حول المركز', arrow: '🔄', delay: 2.5 },
    { id: 'spin-slow', name: 'دوران هادئ', desc: 'دوران بطيء جداً للخلفيات', arrow: '🌀 ⟳', delay: 10 },
    { id: 'flash', name: 'وميض خاطف', desc: 'وميض متقطع سريع ومثير', arrow: '⚡ ⌁', delay: 2 },
    { id: 'float', name: 'طفو مائي', desc: 'تحليق خفيف طافٍ بالهواء', arrow: '🎈 ≁', delay: 2.5 },
    { id: 'heartbeat', name: 'خفقان سريع', desc: 'نبضتان سريعتان كنبض القلب', arrow: '💗 ❤️', delay: 2 },
    { id: 'rubberband', name: 'مطاط مرن', desc: 'تمطط جانبي مرن ومرح', arrow: '↔️ 🎗️', delay: 2 },
    { id: 'swing', name: 'تأرجح مائل', desc: 'أرجوحة لطيفة من الأعلى', arrow: '⤾ 📐', delay: 2 },
    { id: 'jello', name: 'تموج هلامي', desc: 'تموج مائل مرتعش وممتع', arrow: '🍮 〰️', delay: 2 }
  ];

  return (
    <div className="space-y-4 text-right animate-fade" dir="rtl">
      {/* Header info */}
      <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-3 rounded-xl">
        <span className="text-[11px] font-bold text-[#0071e3] block mb-1">
          لوحة الحركات والأنيميشن التفاعلي:
        </span>
        <p className="text-[10px] text-neutral-500 leading-relaxed">
          اختر نمط الحركة والسرعة والحدث المناسب لتنشيط وتحريك العناصر والشرائط الإخبارية على الصفحة.
        </p>
      </div>

      {/* 1. Trigger Selection */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-neutral-800 block">
          تنشيط التأثير وحالة التشغيل:
        </span>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-xl border border-neutral-200">
          {[
            { id: 'hover', label: 'مرور الماوس 🖱️' },
            { id: 'once', label: 'فتح الصفحة 🔄' },
            { id: 'loop', label: 'مستمر دائم 🔁' }
          ].map((trig) => {
            const isSelected = currentTrigger === trig.id;
            return (
              <button
                key={trig.id}
                type="button"
                onClick={() => onUpdateElementStyles({ animationTrigger: trig.id as any })}
                className={`py-2 px-1 rounded-lg text-[10px] font-extrabold text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-[#0071e3] shadow-xs ring-1 ring-black/[0.04]'
                    : 'text-neutral-600 hover:text-black hover:bg-white/45'
                }`}
              >
                {trig.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Speed Slider */}
      {currentAnimation !== 'none' && (
        <div className="space-y-1.5 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-700">مدة وسرعة الحركة:</span>
            <span className="font-mono text-[#0071e3] font-bold bg-[#0071e3]/10 px-2 py-0.5 rounded-md">
              {currentDuration} ثانية
            </span>
          </div>
          <input
            type="range"
            min="0.3"
            max="20"
            step="0.1"
            value={currentDuration}
            onChange={(e) => onUpdateElementStyles({ animationDuration: Number(e.target.value) })}
            className="w-full accent-[#0071e3] h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
            <span>0.3ث (سريع)</span>
            <span>10ث</span>
            <span>20ث (بطيء)</span>
          </div>
        </div>
      )}

      {/* 3. Animations Grid */}
      <div className="space-y-1.5 pt-1">
        <span className="text-xs font-bold text-neutral-800 block">
          اختر حركة من الحركات الـ ٢٠+ المبتكرة:
        </span>
        <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
          {ANIMATIONS_LIST.map((animItem) => {
            const isSelected = currentAnimation === animItem.id;
            return (
              <button
                key={animItem.id}
                type="button"
                onClick={() => {
                  onUpdateElementStyles({ 
                    animation: animItem.id,
                    animationDuration: animItem.id === 'none' ? undefined : animItem.delay
                  });
                }}
                className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1.5 relative group ${
                  isSelected
                    ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-sm ring-1 ring-[#0071e3]'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/50'
                }`}
              >
                {/* Title & select indicator */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold text-neutral-800">
                    {animItem.name}
                  </span>
                  {isSelected && (
                    <div className="w-3.5 h-3.5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                      <Check size={9} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Mini descriptive graphic diagram (عنصر رمادي وأبيض وأسهم الحركة) */}
                <div className="w-full h-8 bg-neutral-100 rounded-lg border border-neutral-200/50 flex items-center justify-center relative overflow-hidden select-none">
                  {/* Background gray element container */}
                  <div className="w-11/12 h-6 bg-neutral-200/40 rounded border border-dashed border-neutral-300 flex items-center justify-between px-1.5">
                    {/* white core animated block */}
                    <div className="w-5 h-3 bg-white rounded shadow-3xs border border-neutral-200 flex items-center justify-center text-[7px] text-neutral-400 font-bold shrink-0">
                      ▫️
                    </div>
                    {/* Motion explanation arrows */}
                    <span className="text-[9px] font-mono text-[#0071e3] font-bold shrink-0">
                      {animItem.arrow}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <span className="text-[9px] text-neutral-400 font-medium truncate">
                  {animItem.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
