// The «تأثيرات النص» card: a few effects in the panel itself and «عرض المزيد», which opens all of
// them in a panel beside it (like the ready slides). Picking one sets the text's effect; under the
// tiles its colour, strength and, for «صورة بالحروف», the picture.
import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import type { ElementStyles } from '../../types';
import {
  FEATURED_TEXT_EFFECTS,
  TEXT_EFFECTS,
  TEXT_EFFECT_GROUPS,
  TEXT_EFFECT_IMAGES,
  TextEffectDef,
  getTextEffectStyles,
  textEffectById,
} from '../../utils/textEffects';

type FxPatch = Partial<Pick<ElementStyles, 'textEffect' | 'textEffectColor' | 'textEffectColor2' | 'textEffectIntensity' | 'textEffectImage'>>;

interface TileProps {
  def: TextEffectDef;
  styles: ElementStyles;
  selected: boolean;
  onPick: () => void;
  size?: 'sm' | 'lg';
}

// One effect drawn on a word in the text's own font.
export const TextEffectTile: React.FC<TileProps> = ({ def, styles, selected, onPick, size = 'sm' }) => {
  const sample: ElementStyles = {
    color: def.dark ? '#ffffff' : '#1d1d1f',
    textEffect: def.id,
    // The tile of the chosen effect shows the user's own colours and strength.
    ...(selected
      ? {
          textEffectColor: styles.textEffectColor,
          textEffectColor2: styles.textEffectColor2,
          textEffectIntensity: styles.textEffectIntensity,
          textEffectImage: styles.textEffectImage,
        }
      : {}),
  };
  const fx = getTextEffectStyles(sample, 1);
  const block: React.CSSProperties = { ...(fx?.block || {}) };
  // Motions that play once on the page repeat in the tile so they can be seen.
  if (typeof block.animation === 'string' && block.animation.endsWith(' both')) {
    block.animation = block.animation.replace(/ both$/, ' infinite alternate');
  }
  const word = 'أهلا';
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      aria-label={def.name}
      title={def.name}
      className={`group flex flex-col items-stretch gap-1 rounded-xl p-1 text-center transition-all cursor-pointer ${
        selected ? 'ring-2 ring-[#0071e3] bg-[#0071e3]/5' : 'hover:bg-neutral-100'
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-lg overflow-hidden border border-black/5 ${size === 'lg' ? 'h-16' : 'h-12'} ${
          def.dark ? 'bg-[#111827]' : 'bg-[#f5f5f7]'
        }`}
      >
        <span
          className="font-bold leading-none whitespace-nowrap px-1"
          style={{ fontFamily: styles.fontFamily || 'Cairo, sans-serif', fontSize: size === 'lg' ? 24 : 17, color: sample.color, ...block }}
        >
          {fx?.inline ? <span style={fx.inline}>{word}</span> : word}
        </span>
      </span>
      <span className={`text-[10px] truncate ${selected ? 'font-bold text-[#0071e3]' : 'text-neutral-600'}`}>{def.name}</span>
    </button>
  );
};

interface PickerProps {
  styles: ElementStyles;
  onChange: (patch: FxPatch) => void;
  onShowAll: () => void;
}

// Picking a new effect starts from its own colours and strength.
const pickPatch = (id: string): FxPatch => ({
  textEffect: id,
  textEffectColor: undefined,
  textEffectColor2: undefined,
  textEffectIntensity: undefined,
});

export const TextEffectsPicker: React.FC<PickerProps> = ({ styles, onChange, onShowAll }) => {
  const current = textEffectById(styles.textEffect);
  // The chosen effect stays in view even when it is not one of the featured ones.
  const shownIds = current && !FEATURED_TEXT_EFFECTS.includes(current.id) ? [current.id, ...FEATURED_TEXT_EFFECTS.slice(0, 6)] : FEATURED_TEXT_EFFECTS;
  const shown = shownIds.map((id) => textEffectById(id)!).filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => onChange({ textEffect: undefined })}
          aria-pressed={!current}
          className={`flex flex-col items-stretch gap-1 rounded-xl p-1 transition-all cursor-pointer ${!current ? 'ring-2 ring-[#0071e3] bg-[#0071e3]/5' : 'hover:bg-neutral-100'}`}
        >
          <span className="h-12 rounded-lg border border-dashed border-neutral-300 bg-white flex items-center justify-center text-neutral-400">
            <X size={16} />
          </span>
          <span className={`text-[10px] ${!current ? 'font-bold text-[#0071e3]' : 'text-neutral-600'}`}>بدون</span>
        </button>
        {shown.map((def) => (
          <TextEffectTile key={def.id} def={def} styles={styles} selected={current?.id === def.id} onPick={() => onChange(pickPatch(def.id))} />
        ))}
      </div>

      <button
        type="button"
        onClick={onShowAll}
        className="w-full h-9 rounded-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        عرض المزيد ({TEXT_EFFECTS.length} تأثير)
        <ChevronLeft size={14} />
      </button>

      {current && <TextEffectControls def={current} styles={styles} onChange={onChange} />}
    </div>
  );
};

const ColorRow: React.FC<{ label: string; value: string; onPick: (v: string) => void }> = ({ label, value, onPick }) => (
  <label className="flex items-center justify-between gap-2 text-[12px] font-medium text-neutral-700">
    <span>{label}</span>
    <span className="flex items-center gap-2">
      <span className="font-mono text-[10.5px] text-neutral-400" dir="ltr">{value}</span>
      <input type="color" value={value} onChange={(e) => onPick(e.target.value)} className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer bg-white p-0.5" />
    </span>
  </label>
);

// The chosen effect's colour, strength and picture.
const TextEffectControls: React.FC<{ def: TextEffectDef; styles: ElementStyles; onChange: (p: FxPatch) => void }> = ({ def, styles, onChange }) => {
  const base = styles.color && /^#[0-9a-f]{6}$/i.test(styles.color) ? styles.color : '#1d1d1f';
  // Outlines without a colour of their own take the text's colour.
  const ownColor = def.color || (def.id === 'hollow' || def.id === 'hollow-shadow' ? base : undefined);
  const intensity = styles.textEffectIntensity ?? 50;
  return (
    <div className="space-y-3 rounded-xl bg-neutral-50 border border-neutral-200 p-3">
      <div className="text-[11px] font-bold text-neutral-500">{def.name}</div>
      {ownColor && (
        <ColorRow label={def.id === 'hollow' || def.id === 'hollow-shadow' ? 'لون الإطار' : 'لون التأثير'} value={styles.textEffectColor || ownColor} onPick={(v) => onChange({ textEffectColor: v })} />
      )}
      {def.color2 && (
        <ColorRow label={def.id === 'hollow-shadow' ? 'لون الظل' : 'اللون التاني'} value={styles.textEffectColor2 || def.color2} onPick={(v) => onChange({ textEffectColor2: v })} />
      )}
      {def.image && (
        <div className="space-y-1.5">
          <div className="text-[12px] font-medium text-neutral-700">الصورة داخل الحروف</div>
          <div className="grid grid-cols-4 gap-1.5">
            {TEXT_EFFECT_IMAGES.map((url, i) => {
              const on = (styles.textEffectImage || TEXT_EFFECT_IMAGES[0]) === url;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => onChange({ textEffectImage: url })}
                  aria-label={`صورة ${i + 1}`}
                  aria-pressed={on}
                  className={`h-10 rounded-lg bg-cover bg-center cursor-pointer ${on ? 'ring-2 ring-[#0071e3]' : 'ring-1 ring-black/10'}`}
                  style={{ backgroundImage: `url("${url.replace('w=800', 'w=160')}")` }}
                />
              );
            })}
          </div>
        </div>
      )}
      <label className="block space-y-1.5">
        <span className="flex items-center justify-between text-[12px] font-medium text-neutral-700">
          <span>{def.group === 'motion' ? 'السرعة' : 'القوة'}</span>
          <span className="text-[10.5px] text-neutral-400">{intensity}%</span>
        </span>
        <input
          type="range"
          min={10}
          max={100}
          value={intensity}
          onChange={(e) => onChange({ textEffectIntensity: Number(e.target.value) })}
          className="w-full accent-[#0071e3] cursor-pointer"
        />
      </label>
    </div>
  );
};

interface GalleryProps {
  styles: ElementStyles;
  onChange: (patch: FxPatch) => void;
  onClose: () => void;
}

// Every effect, by group, in the panel beside the control panel.
export const TextEffectsGallery: React.FC<GalleryProps> = ({ styles, onChange, onClose }) => (
  <div className="h-full flex flex-col bg-[#fbfbfd] text-right" dir="rtl">
    <div className="h-12 px-3 bg-[#f5f5f7] border-b border-neutral-200 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-neutral-800">تأثيرات النص</span>
        <span className="text-[10px] text-[#0071e3] font-bold bg-[#0071e3]/5 border border-[#0071e3]/10 px-1.5 py-0.5 rounded-full">{TEXT_EFFECTS.length} تأثير</span>
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
      <p className="text-[10.5px] text-neutral-500 leading-relaxed -mt-0.5">اضغط على تأثير ليتطبق على النص المختار. لونه وقوته بتغيّرهم من لوحة التحكم.</p>
      {TEXT_EFFECT_GROUPS.map((g) => (
        <div key={g.id} className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500">
            <span>{g.name}</span>
            <span className="flex-1 h-px bg-neutral-200" />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {TEXT_EFFECTS.filter((d) => d.group === g.id).map((def) => (
              <TextEffectTile key={def.id} def={def} styles={styles} size="lg" selected={styles.textEffect === def.id} onPick={() => onChange(pickPatch(def.id))} />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
