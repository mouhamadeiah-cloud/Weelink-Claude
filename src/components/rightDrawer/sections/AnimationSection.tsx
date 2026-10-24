// Moved verbatim from RightDrawer.tsx (was an inline IIFE in the drawer body).
import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { CanvasElement } from '../../../types';
import { RightDrawerProps } from '../types';
import { MotionState, pinMotionEdit, realMotionState, RELATIVE_MOTION_STATE, resolveMotion, startMotionEdit } from '../../../utils/customMotion';

interface AnimationSectionProps {
  styles: CanvasElement['styles'];
  onUpdateElementStyles: RightDrawerProps['onUpdateElementStyles'];
  // The element as it stands (phone layout in the phone view): a custom motion's start is taken from it, and its end is
  // the element as the owner leaves it on the page.
  element?: { id: string; x: number; y: number; width: number; height: number };
  // The phone view: a phone plays a motion's shift at half size, so a shift is stored doubled.
  phone?: boolean;
  // An extra animation of the element: no intro, and no tickers.
  extra?: boolean;
  // The element's own turn and lock: a custom motion's end is the element as it is (utils/customMotion).
  rotation?: number;
  locked?: boolean;
  // The editor shows the state being edited on the element; null when the panel lets go of it.
  onPreview?: (id: string, which: 'from' | 'to' | null) => void;
}

const AnimationEditor = ({
  styles,
  onUpdateElementStyles,
  element,
  phone = false,
  extra = false,
  rotation = 0,
  locked = false,
  onPreview,
}: AnimationSectionProps) => {
  const currentAnimation = styles.animation || 'none';
  const isCustom = currentAnimation === 'custom';
  // Only the extra animations still set their states with sliders (they lie on top of the first one, so they stay relative).
  const [tab, setTab] = useState<'from' | 'to'>('from');
  const real = extra ? RELATIVE_MOTION_STATE : realMotionState(styles, rotation);
  const resolved = resolveMotion(styles, real);
  const elementId = element?.id;
  const shrink = phone ? 2 : 1;

  // The owner sets the end of the first custom motion on the page itself (Eyad, 24 Oct): the start is taken from the
  // element when the editing begins and stays; the owner moves, resizes, fades or turns the element; «تثبيت وإغلاق» keeps
  // the element as it is (the end) and stores the start as the way back from it. The editing is kept on the element
  // (styles.animationEditing, which the editor marks with a glow) and ends only when «تثبيت وإغلاق» is pressed, not when
  // the panel closes or another element is selected (Eyad, 24 Oct).
  const startMark = styles.animationEditing;
  const editing = !!startMark;
  const beginEditing = () => {
    if (element) onUpdateElementStyles(startMotionEdit(element, styles, rotation, shrink));
  };
  const pin = () => {
    const patch = element ? pinMotionEdit(element, styles, rotation, shrink) : null;
    if (patch) onUpdateElementStyles(patch);
  };
  useEffect(() => {
    if (!extra && isCustom && elementId) onPreview?.(elementId, 'to');
  }, [extra, isCustom, elementId]);
  // Another animation chosen while the end was being set: nothing is left to edit.
  useEffect(() => {
    if (!extra && !isCustom && styles.animationEditing) onUpdateElementStyles({ animationEditing: undefined });
  }, [extra, isCustom, styles.animationEditing]);
  // Choosing a custom motion starts it at once: the start is taken from the element as it is.
  useEffect(() => {
    if (!extra && isCustom && elementId && !editing && styles.animationFrom === undefined) beginEditing();
  }, [extra, isCustom, elementId, editing, styles.animationFrom]);
  // Leaving the custom motion (another animation, another element, the panel closed): the element lets go of the preview;
  // a motion still being edited stays marked on the page until it is pinned.
  useEffect(() => {
    if (extra || !isCustom || !elementId) return;
    return () => onPreview?.(elementId, null);
  }, [extra, isCustom, elementId]);

  const currentTrigger = styles.animationTrigger || 'once';
  const currentDuration = styles.animationDuration || (
    ['spin-slow'].includes(currentAnimation) ? 10 :
    ['marquee-rtl', 'marquee-ltr'].includes(currentAnimation) ? 12 :
    ['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale-up', 'scale-down'].includes(currentAnimation) ? 1.2 :
    ['pulse', 'brightness', 'shake', 'bounce', 'flash', 'float', 'heartbeat', 'rubberband', 'swing', 'jello'].includes(currentAnimation) ? 2 : 1.5
  );

  const ANIMATIONS_LIST = [
    { id: 'none', name: 'بدون حركة ✕', desc: 'إيقاف الحركة بالكامل', arrow: '▫️', delay: 1.5 },
    { id: 'custom', name: 'حركة مخصصة ✎', desc: 'من حالة إلى حالة تحددها أنت', arrow: 'A ➔ B', delay: 1.2 },
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

  const rows: { field: keyof MotionState; label: string; min: number; max: number; step: number; unit: string; scale?: number }[] = [
    { field: 'x', label: 'الإزاحة أفقياً', min: -600, max: 600, step: 10, unit: 'px' },
    { field: 'y', label: 'الإزاحة عمودياً', min: -600, max: 600, step: 10, unit: 'px' },
    { field: 'opacity', label: 'الشفافية', min: 0, max: 100, step: 5, unit: '%', scale: 100 },
    { field: 'scale', label: 'الحجم', min: 10, max: 300, step: 5, unit: '%', scale: 100 },
    { field: 'rotate', label: 'الدوران', min: -360, max: 360, step: 5, unit: '°' },
  ];
  const state = resolved[tab];
  // A change to the first state is the owner's decision for it; the last state stays as it was saved.
  const write = (patch: MotionState) => {
    if (tab === 'from') onUpdateElementStyles({ animationFrom: { ...(styles.animationFrom || {}), ...patch }, animationTo: styles.animationTo ?? resolved.to });
    else onUpdateElementStyles({ animationTo: { ...resolved.to, ...patch } });
  };
  const alternate = (
    <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
      <input type="checkbox" checked={Boolean(styles.animationAlternate)} onChange={(e) => onUpdateElementStyles({ animationAlternate: e.target.checked })} />
      ذهاب وإياب (المستمر ومرور الماوس يعملان هكذا دائماً)
    </label>
  );
  const customPanel = extra ? (
    <div key="custom-panel" className="col-span-2 space-y-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
      <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-lg" role="tablist" aria-label="حالة الحركة">
        {([['from', 'البداية'], ['to', 'النهاية']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`py-1.5 rounded-md text-xs font-extrabold cursor-pointer ${tab === id ? 'bg-white text-brand shadow-xs ring-1 ring-black/[0.04]' : 'text-neutral-600 hover:text-black'}`}
          >{label}</button>
        ))}
      </div>
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
              onChange={(e) => write({ [r.field]: Number(e.target.value) / (r.scale || 1) })}
              className="w-full accent-brand h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
            />
          </label>
        );
      })}
      {alternate}
    </div>
  ) : (
    <div key="custom-panel" className="col-span-2 space-y-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
      {editing ? (
        <>
          <p className="text-xs text-neutral-700 leading-relaxed">
            وضع الحركة مفعّل: العنصر عليه علامة على الصفحة. حرّكه أو كبّره أو دوّره أو غيّر شفافيته مباشرة؛ هاد بيكون وضعه بالنهاية. بيضل مفعّل حتى لو سكّرت اللوحة، وما بينتهي إلا لما تضغط «تثبيت وإغلاق».
          </p>
          {locked && <p className="text-xs text-amber-700 leading-relaxed">العنصر مقفل، فكّ قفله من شريط التحديد لتقدر تحرّكه.</p>}
          <button
            type="button"
            onClick={() => pin()}
            className="w-full h-9 rounded-lg text-xs font-extrabold bg-brand text-white hover:bg-brand-hover cursor-pointer"
          >تثبيت وإغلاق</button>
        </>
      ) : (
        <>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {styles.animationFrom ? 'العنصر على وضع النهاية، والبداية محفوظة منه.' : 'ما تحددت الحركة بعد: العنصر ثابت.'}
          </p>
          <button
            type="button"
            onClick={beginEditing}
            className="w-full h-9 rounded-lg text-xs font-extrabold bg-white border border-neutral-300 text-neutral-700 hover:border-brand cursor-pointer"
          >{styles.animationFrom ? 'تعديل الحركة' : 'ابدأ تحديد الحركة'}</button>
        </>
      )}
      {alternate}
    </div>
  );

  return (
    <div className="space-y-4 text-right animate-fade" dir="rtl">
      {/* Header info */}
      {!extra && <div className="bg-brand/5 border border-brand/10 p-3 rounded-xl">
        <span className="text-xs font-bold text-brand block mb-1">
          لوحة الحركات والأنيميشن التفاعلي:
        </span>
        <p className="text-xs text-neutral-500 leading-relaxed">
          اختر نمط الحركة والسرعة والحدث المناسب لتنشيط وتحريك العناصر والشرائط الإخبارية على الصفحة.
        </p>
      </div>}

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
            { id: 'scrub', label: 'مع التمرير ↕' },
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
        {currentTrigger === 'scrub' && (
          <label className="flex items-center justify-between gap-2 text-xs text-neutral-700">
            <span className="font-bold">متى تتحرك؟</span>
            <select
              value={styles.animationScrub || 'enter'}
              onChange={(e) => onUpdateElementStyles({ animationScrub: e.target.value as 'enter' | 'leave' | 'through' })}
              className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-xs"
            >
              <option value="enter">وهو داخل من أسفل الشاشة</option>
              <option value="leave">وهو خارج من أعلى الشاشة (للغلاف)</option>
              <option value="through">طوال مروره على الشاشة</option>
            </select>
          </label>
        )}
        {currentTrigger === 'scrub' && (
          <p className="text-xs text-neutral-500 leading-relaxed">
            «مع التمرير» بتتقدم الحركة مع إصبع الزائر نفسه: العنصر على حالة البداية وهو داخل من أسفل الشاشة، وعلى حالة النهاية لما يوصل لنص الشاشة تقريباً، وبترجع لو رجع لفوق. بتشتغل بالمعاينة وعلى الصفحة المنشورة بالمتصفحات الحديثة (وغيرها بتشتغل مرة عند الوصول). بالمحرر العنصر بيبقى ثابت.
          </p>
        )}
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

      {/* 3. Animations Grid */}
      <div className="space-y-1.5 pt-1">
        <span className="text-xs font-bold text-neutral-800 block">
          اختر حركة من الحركات الـ ٢٠+ المبتكرة:
        </span>
        <div className={`grid grid-cols-2 gap-2 pr-1 ${isCustom ? '' : 'max-h-[360px] overflow-y-auto'}`}>
          {ANIMATIONS_LIST.filter((a) => !(extra && (a.id === 'none' || a.id.startsWith('marquee')))).map((animItem) => {
            const isSelected = currentAnimation === animItem.id;
            return (
              <React.Fragment key={animItem.id}>
              <button
                key={animItem.id}
                type="button"
                onClick={() => {
                  // A custom motion starts as the element is (no motion); the owner then sets its end on the page.
                  if (animItem.id === 'custom' && !isCustom) setTab('from');
                  onUpdateElementStyles({ 
                    animation: animItem.id,
                    animationDuration: animItem.id === 'none' ? undefined : animItem.delay,
                    ...(animItem.id === 'custom' && !isCustom ? { animationFrom: undefined, animationTo: extra ? { ...real } : undefined } : {}),
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
              {animItem.id === 'custom' && isCustom && customPanel}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MAX_EXTRA = 3;

export const AnimationSection = (props: Omit<AnimationSectionProps, 'extra'>) => {
  const { styles, onUpdateElementStyles } = props;
  const layers = styles.animationLayers || [];
  const setLayers = (next: typeof layers) => onUpdateElementStyles({ animationLayers: next.length ? next : undefined });
  return (
    <div className="space-y-4">
      <AnimationEditor {...props} />
      {(styles.animation || 'none') !== 'none' && (
        <div className="space-y-3 pt-2 border-t border-neutral-200">
          <span className="text-xs font-bold text-neutral-800 block">حركات إضافية لنفس العنصر ({layers.length}/{MAX_EXTRA}):</span>
          <p className="text-xs text-neutral-500 leading-relaxed">تعمل فوق الحركة الأولى معاً، ولكل واحدة حدثها وسرعتها. مثال: دخول مرة واحدة مع نبض مستمر.</p>
          {layers.map((layer, i) => (
            <div key={i} className="space-y-2 p-2.5 rounded-xl border border-neutral-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand">الحركة {i + 2}</span>
                <button type="button" onClick={() => setLayers(layers.filter((_, k) => k !== i))} className="text-xs font-bold text-red-600 cursor-pointer">حذف</button>
              </div>
              <AnimationEditor
                {...props}
                extra
                styles={layer as CanvasElement['styles']}
                onUpdateElementStyles={(patch) => setLayers(layers.map((l, k) => (k === i ? { ...l, ...(patch as object) } : l)))}
              />
            </div>
          ))}
          {layers.length < MAX_EXTRA && (
            <button
              type="button"
              onClick={() => setLayers([...layers, { animation: 'pulse', animationTrigger: 'loop', animationDuration: 2 }])}
              className="w-full py-2 rounded-xl border border-dashed border-brand text-xs font-bold text-brand hover:bg-brand/5 cursor-pointer"
            >+ أضف حركة أخرى</button>
          )}
        </div>
      )}
    </div>
  );
};
