// Moved verbatim from RightDrawer.tsx (was an inline IIFE in the drawer body).
import React from 'react';
import { Check } from 'lucide-react';
import { CanvasElement } from '../../../types';
import { RightDrawerProps } from '../types';
import { DEFAULT_MOTION_FROM, DEFAULT_MOTION_TO, MotionState } from '../../../utils/customMotion';

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
    { id: 'jello', name: 'تموج هلامي', desc: 'تموج مائل مرتعش وممتع', arrow: '🍮 〰️', delay: 2 },
    { id: 'custom', name: 'حركة مخصصة ✎', desc: 'من حالة إلى حالة تحددها أنت', arrow: 'A ➔ B', delay: 1.2 }
  ];

  return (
    <div className="space-y-4 text-right animate-fade" dir="rtl">
      {/* Header info */}
      <div className="bg-brand/5 border border-brand/10 p-3 rounded-xl">
        <span className="text-xs font-bold text-brand block mb-1">
          لوحة الحركات والأنيميشن التفاعلي:
        </span>
        <p className="text-xs text-neutral-500 leading-relaxed">
          اختر نمط الحركة والسرعة والحدث المناسب لتنشيط وتحريك العناصر والشرائط الإخبارية على الصفحة.
        </p>
      </div>

      {/* 1. Trigger Selection */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-neutral-800 block">
          تنشيط التأثير وحالة التشغيل:
        </span>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 rounded-xl border border-neutral-200">
          {[
            { id: 'hover', label: 'مرور الماوس 🖱️' },
            { id: 'once', label: 'فتح الصفحة 🔄' },
            { id: 'scroll', label: 'عند التمرير 📜' },
            { id: 'loop', label: 'مستمر دائم 🔁' }
          ].map((trig) => {
            const isSelected = currentTrigger === trig.id;
            return (
              <button
                key={trig.id}
                type="button"
                onClick={() => onUpdateElementStyles({ animationTrigger: trig.id as any })}
                className={`py-2 px-1 rounded-lg text-xs font-extrabold text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-brand shadow-xs ring-1 ring-black/[0.04]'
                    : 'text-neutral-600 hover:text-black hover:bg-white/45'
                }`}
              >
                {trig.label}
              </button>
            );
          })}
        </div>
        {currentTrigger === 'scroll' && (
          <p className="text-xs text-neutral-500 leading-relaxed">
            «عند التمرير» بتشتغل بالمعاينة (زر العين) وعلى الصفحة المنشورة: العنصر بيستنى لحد ما الزائر يوصل له، وبتعيد الحركة كل ما رجع لعنده من فوق أو من تحت. بالمحرر نفسه الحركة بتشتغل مرة وحدة عند الفتح.
          </p>
        )}
      </div>

      {/* 2. Speed Slider */}
      {currentAnimation !== 'none' && (
        <div className="space-y-1.5 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-700">مدة وسرعة الحركة:</span>
            <span className="font-mono text-brand font-bold bg-brand/10 px-2 py-0.5 rounded-md">
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
            className="w-full accent-brand h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-xs text-neutral-400 font-mono">
            <span>0.3ث (سريع)</span>
            <span>10ث</span>
            <span>20ث (بطيء)</span>
          </div>
        </div>
      )}

      {/* Custom motion: the two states the element moves between */}
      {currentAnimation === 'custom' && (
        <div className="space-y-2">
          {([
            { key: 'animationFrom' as const, title: 'حالة البداية', state: { ...DEFAULT_MOTION_FROM, ...styles.animationFrom } },
            { key: 'animationTo' as const, title: 'حالة النهاية', state: { ...DEFAULT_MOTION_TO, ...styles.animationTo } },
          ]).map(({ key, title, state }) => {
            const set = (patch: MotionState) => onUpdateElementStyles({ [key]: { ...(styles[key] || {}), ...patch } });
            const rows: { field: keyof MotionState; label: string; min: number; max: number; step: number; unit: string; scale?: number }[] = [
              { field: 'x', label: 'الإزاحة أفقياً', min: -600, max: 600, step: 10, unit: 'px' },
              { field: 'y', label: 'الإزاحة عمودياً', min: -600, max: 600, step: 10, unit: 'px' },
              { field: 'opacity', label: 'الشفافية', min: 0, max: 100, step: 5, unit: '%', scale: 100 },
              { field: 'scale', label: 'الحجم', min: 10, max: 300, step: 5, unit: '%', scale: 100 },
              { field: 'rotate', label: 'الدوران', min: -360, max: 360, step: 5, unit: '°' },
            ];
            return (
              <div key={key} className="space-y-1.5 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-xs font-bold text-neutral-800 block">{title}</span>
                {rows.map((r) => {
                  const shown = Math.round((state[r.field] as number) * (r.scale || 1));
                  return (
                    <label key={r.field} className="block">
                      <span className="flex justify-between text-xs text-neutral-600">
                        <span>{r.label}</span>
                        <span className="font-mono text-brand font-bold">{shown}{r.unit}</span>
                      </span>
                      <input
                        type="range" min={r.min} max={r.max} step={r.step} value={shown}
                        onChange={(e) => set({ [r.field]: Number(e.target.value) / (r.scale || 1) })}
                        className="w-full accent-brand h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            );
          })}
          <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
            <input type="checkbox" checked={Boolean(styles.animationAlternate)} onChange={(e) => onUpdateElementStyles({ animationAlternate: e.target.checked })} />
            ذهاب وإياب (المستمر ومرور الماوس يعملان هكذا دائماً)
          </label>
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
                    animationDuration: animItem.id === 'none' ? undefined : animItem.delay,
                    // A ticker runs for ever; the other trigger choices make it play once or wait for the mouse.
                    ...(animItem.id.startsWith('marquee') ? { animationTrigger: 'loop' as const } : {}),
                  });
                }}
                className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1.5 relative group ${
                  isSelected
                    ? 'border-brand bg-brand/5 shadow-sm ring-1 ring-brand'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/50'
                }`}
              >
                {/* Title & select indicator */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-neutral-800">
                    {animItem.name}
                  </span>
                  {isSelected && (
                    <div className="w-3.5 h-3.5 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
                      <Check size={9} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Mini descriptive graphic diagram (عنصر رمادي وأبيض وأسهم الحركة) */}
                <div className="w-full h-8 bg-neutral-100 rounded-lg border border-neutral-200/50 flex items-center justify-center relative overflow-hidden select-none">
                  {/* Background gray element container */}
                  <div className="w-11/12 h-6 bg-neutral-200/40 rounded border border-dashed border-neutral-300 flex items-center justify-between px-1.5">
                    {/* white core animated block */}
                    <div className="w-6 h-5 bg-white rounded shadow-3xs border border-neutral-200 flex items-center justify-center text-xs text-neutral-400 font-bold shrink-0">
                      ▫️
                    </div>
                    {/* Motion explanation arrows */}
                    <span className="text-xs font-mono text-brand font-bold shrink-0">
                      {animItem.arrow}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <span className="text-xs text-neutral-400 font-medium truncate">
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
