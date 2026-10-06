// The «رسوم متحركة» element's settings: a few animations in the panel itself and «عرض المزيد»,
// which opens all of them in a panel beside it (like the text effects). Under the tiles: the
// animation's colours, speed, how it plays, and a link to a Lottie file of the user's own.
import React, { useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import type { CanvasElement } from '../../types';
import { FEATURED_LOTTIE, LOTTIE_ANIMATIONS, LOTTIE_GROUPS, LottieDef, lottieById } from '../../utils/lottieAnimations';
import { LottiePlayer } from '../LottiePlayer';

type LottiePatch = Partial<Pick<CanvasElement, 'lottieId' | 'lottieUrl' | 'lottieColor' | 'lottieColor2' | 'lottieLoop' | 'lottieSpeed' | 'lottieTrigger' | 'name'>>;

// Picking an animation starts from its own colours and drops a linked file. The element takes the
// animation's name unless the user named it themselves.
export const pickLottie = (def: LottieDef, el: CanvasElement): LottiePatch => {
  const autoName = !el.name || el.name === 'رسم متحرك' || el.name === lottieById(el.lottieId)?.name;
  return { lottieId: def.id, lottieUrl: undefined, lottieColor: undefined, lottieColor2: undefined, ...(autoName ? { name: def.name } : {}) };
};

interface TileProps {
  def: LottieDef;
  selected: boolean;
  onPick: () => void;
  size?: 'sm' | 'lg';
  color?: string;
  color2?: string;
}

export const LottieTile: React.FC<TileProps> = ({ def, selected, onPick, size = 'sm', color, color2 }) => (
  <button
    type="button"
    onClick={onPick}
    aria-pressed={selected}
    aria-label={def.name}
    title={def.name}
    className={`flex flex-col items-stretch gap-1 rounded-xl p-1 text-center transition-all cursor-pointer ${selected ? 'ring-2 ring-[#0071e3] bg-[#0071e3]/5' : 'hover:bg-neutral-100'}`}
  >
    <span className={`block rounded-lg overflow-hidden border border-black/5 bg-[#f5f5f7] ${size === 'lg' ? 'h-20 p-1.5' : 'h-14 p-1'}`}>
      <LottiePlayer animationId={def.id} color={selected ? color : undefined} color2={selected ? color2 : undefined} />
    </span>
    <span className={`text-[10px] truncate ${selected ? 'font-bold text-[#0071e3]' : 'text-neutral-600'}`}>{def.name}</span>
  </button>
);

const ColorRow: React.FC<{ label: string; value: string; onPick: (v: string) => void }> = ({ label, value, onPick }) => (
  <label className="flex items-center justify-between gap-2 text-[12px] font-medium text-neutral-700">
    <span>{label}</span>
    <span className="flex items-center gap-2">
      <span className="font-mono text-[10.5px] text-neutral-400" dir="ltr">{value}</span>
      <input type="color" value={value} onChange={(e) => onPick(e.target.value)} className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer bg-white p-0.5" />
    </span>
  </label>
);

const TRIGGERS: [NonNullable<CanvasElement['lottieTrigger']>, string][] = [
  ['auto', 'دائماً'],
  ['view', 'عند الظهور'],
  ['hover', 'عند المرور'],
];

interface SettingsProps {
  element: CanvasElement;
  onChange: (patch: LottiePatch) => void;
  onShowAll: () => void;
}

export const LottieSettings: React.FC<SettingsProps> = ({ element, onChange, onShowAll }) => {
  const current = element.lottieUrl ? undefined : lottieById(element.lottieId);
  const shownIds = current && !FEATURED_LOTTIE.includes(current.id) ? [current.id, ...FEATURED_LOTTIE.slice(0, 6)] : FEATURED_LOTTIE;
  const shown = shownIds.map((id) => lottieById(id)).filter((d): d is LottieDef => !!d);
  const [urlDraft, setUrlDraft] = useState(element.lottieUrl || '');
  const speed = element.lottieSpeed || 1;
  const trigger = element.lottieTrigger || 'auto';
  const urlOk = /^https:\/\/\S+$/i.test(urlDraft.trim());

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1">
        {shown.map((def) => (
          <LottieTile key={def.id} def={def} selected={current?.id === def.id} color={element.lottieColor} color2={element.lottieColor2} onPick={() => onChange(pickLottie(def, element))} />
        ))}
      </div>

      <button
        type="button"
        onClick={onShowAll}
        className="w-full h-9 rounded-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        عرض المزيد ({LOTTIE_ANIMATIONS.length} رسمة)
        <ChevronLeft size={14} />
      </button>

      <div className="space-y-3 rounded-xl bg-neutral-50 border border-neutral-200 p-3">
        {current && (
          <>
            <ColorRow label="اللون" value={element.lottieColor || current.color} onPick={(v) => onChange({ lottieColor: v })} />
            {current.color2 && <ColorRow label="اللون التاني" value={element.lottieColor2 || current.color2} onPick={(v) => onChange({ lottieColor2: v })} />}
          </>
        )}

        <div className="space-y-1.5">
          <div className="text-[12px] font-medium text-neutral-700">متى بتتحرك</div>
          <div role="radiogroup" aria-label="متى بتتحرك" className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 text-[11.5px] font-bold">
            {TRIGGERS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={trigger === id}
                onClick={() => onChange({ lottieTrigger: id })}
                className={`h-8 rounded-lg transition-colors cursor-pointer ${trigger === id ? 'bg-white text-[#0071e3] shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between text-[12px] font-medium text-neutral-700 cursor-pointer">
          <span>تكرار الحركة</span>
          <input type="checkbox" checked={element.lottieLoop !== false} onChange={(e) => onChange({ lottieLoop: e.target.checked })} className="w-4 h-4 accent-[#0071e3] cursor-pointer" />
        </label>

        <label className="block space-y-1.5">
          <span className="flex items-center justify-between text-[12px] font-medium text-neutral-700">
            <span>السرعة</span>
            <span className="text-[10.5px] text-neutral-400" dir="ltr">{speed.toFixed(2).replace(/\.?0+$/, '')}×</span>
          </span>
          <input
            type="range"
            min={0.25}
            max={2.5}
            step={0.25}
            value={speed}
            onChange={(e) => onChange({ lottieSpeed: Number(e.target.value) })}
            className="w-full accent-[#0071e3] cursor-pointer"
          />
        </label>
      </div>

      <div className="space-y-1.5 rounded-xl border border-neutral-200 p-3">
        <div className="text-[12px] font-medium text-neutral-700">رسمة من LottieFiles أو غيره</div>
        <p className="text-[10.5px] text-neutral-500 leading-relaxed">الصق رابط ملف Lottie (‏.json) بيبدأ بـ https، وبتظهر بدل رسمتنا. ألوانها بتضل متل ما هي.</p>
        <div className="flex gap-1.5">
          <input
            type="url"
            dir="ltr"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://…/animation.json"
            className="flex-1 min-w-0 h-8 px-2 rounded-lg border border-neutral-300 text-[11px] font-mono focus:outline-none focus:border-[#0071e3]"
          />
          <button
            type="button"
            disabled={!urlOk}
            onClick={() => onChange({ lottieUrl: urlDraft.trim() })}
            className="h-8 px-3 rounded-lg bg-[#0071e3] text-white text-[11px] font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            استخدام
          </button>
        </div>
        {element.lottieUrl && (
          <button
            type="button"
            onClick={() => {
              setUrlDraft('');
              onChange({ lottieUrl: undefined });
            }}
            className="text-[10.5px] font-bold text-red-600 hover:underline cursor-pointer"
          >
            إزالة الرابط والرجوع لرسومنا
          </button>
        )}
      </div>
    </div>
  );
};

interface GalleryProps {
  element: CanvasElement;
  onChange: (patch: LottiePatch) => void;
  onClose: () => void;
}

// Every animation, by group, in the panel beside the control panel.
export const LottieGallery: React.FC<GalleryProps> = ({ element, onChange, onClose }) => {
  const selectedId = element.lottieUrl ? undefined : element.lottieId;
  return (
    <div className="h-full flex flex-col bg-[#fbfbfd] text-right" dir="rtl">
      <div className="h-12 px-3 bg-[#f5f5f7] border-b border-neutral-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-neutral-800">رسوم متحركة</span>
          <span className="text-[10px] text-[#0071e3] font-bold bg-[#0071e3]/5 border border-[#0071e3]/10 px-1.5 py-0.5 rounded-full">{LOTTIE_ANIMATIONS.length} رسمة</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-neutral-200 text-neutral-500 hover:text-black flex items-center justify-center transition-all cursor-pointer"
          aria-label="إغلاق"
        >
          <X size={15} strokeWidth={2.4} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        <p className="text-[10.5px] text-neutral-500 leading-relaxed -mt-0.5">اضغط على رسمة لتحطها مكان المختارة. لونها وسرعتها بتغيّرهم من لوحة التحكم.</p>
        {LOTTIE_GROUPS.map((g) => (
          <div key={g.id} className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500">
              <span>{g.name}</span>
              <span className="flex-1 h-px bg-neutral-200" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {LOTTIE_ANIMATIONS.filter((d) => d.group === g.id).map((def) => (
                <LottieTile
                  key={def.id}
                  def={def}
                  size="lg"
                  selected={selectedId === def.id}
                  color={element.lottieColor}
                  color2={element.lottieColor2}
                  onPick={() => onChange(pickLottie(def, element))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
