import React from 'react';
import { Check } from 'lucide-react';
import { EDITOR_COLORS } from '../../utils/designTokens';

/**
 * Shared, reusable control-panel UI primitives.
 *
 * Goal: every drawer/section in the editor should build its color pickers,
 * sliders, tab switchers and section headers from THESE components instead
 * of hand-rolling a new variant each time. New editing UI should start here.
 */

// ---------------------------------------------------------------------------
// ColorSwatchPicker
// ---------------------------------------------------------------------------

export interface ColorSwatch {
  /** CSS color / gradient / image-url background value */
  value: string;
  /** Optional accessible label (also used as title attribute) */
  label?: string;
}

interface ColorSwatchPickerProps {
  swatches: ColorSwatch[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  /** Swatch diameter in pixels. Default 28 (the "w-7 h-7" size already dominant in the codebase). */
  size?: number;
  /** Number of columns in the grid. Default 7. */
  columns?: number;
  className?: string;
}

export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
  swatches,
  selectedValue,
  onSelect,
  size = 28,
  columns = 7,
  className = '',
}) => {
  return (
    <div
      className={`grid gap-2 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {swatches.map((swatch, i) => {
        const isSelected = selectedValue === swatch.value;
        return (
          <button
            key={`${swatch.value}-${i}`}
            type="button"
            title={swatch.label}
            onClick={() => onSelect(swatch.value)}
            className="relative rounded-full shrink-0 transition-transform hover:scale-105"
            style={{
              width: size,
              height: size,
              background: swatch.value,
              boxShadow: isSelected
                ? `0 0 0 2px #fff, 0 0 0 4px ${EDITOR_COLORS.accent}`
                : `0 0 0 1px ${EDITOR_COLORS.border}`,
            }}
          >
            {isSelected && (
              <Check
                size={Math.max(10, size * 0.4)}
                strokeWidth={3}
                className="absolute inset-0 m-auto text-white drop-shadow"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Slider (standardizes the de-facto `accent-[#0071e3]` range-input pattern)
// ---------------------------------------------------------------------------

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** How the current value is displayed, e.g. (v) => `${v}%` */
  formatValue?: (value: number) => string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue = (v) => String(v),
  className = '',
}) => {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px]" style={{ color: EDITOR_COLORS.textSecondary }}>
          {label}
        </span>
        <span
          className="font-mono font-bold text-[13px]"
          style={{ color: EDITOR_COLORS.accent }}
        >
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: EDITOR_COLORS.accent }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// PillTabs (one canonical segmented-tab switcher)
// ---------------------------------------------------------------------------

export interface PillTabOption<T extends string = string> {
  value: T;
  label: string;
}

interface PillTabsProps<T extends string = string> {
  options: PillTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function PillTabs<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
}: PillTabsProps<T>) {
  return (
    <div
      className={`inline-flex p-1 rounded-xl gap-0.5 ${className}`}
      style={{ background: EDITOR_COLORS.panelBg }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              background: active ? '#ffffff' : 'transparent',
              color: active ? EDITOR_COLORS.accent : EDITOR_COLORS.textSecondary,
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionHeader (one canonical drawer-section heading)
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between mb-2.5 ${className}`}>
      <div className="flex items-center gap-1.5">
        {icon && (
          <span style={{ color: EDITOR_COLORS.iconDefault }} className="flex items-center">
            {icon}
          </span>
        )}
        <h3
          className="text-[13px] font-semibold"
          style={{ color: EDITOR_COLORS.textPrimary }}
        >
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
};
