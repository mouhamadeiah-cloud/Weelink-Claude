// Moved verbatim from RightDrawer.tsx (was an inline block in the drawer body).
import React from 'react';
import { ColorSwatchPicker, PillTabs, SectionHeader, Slider } from '../../ui/SharedControls';
import { FIFTY_SOLID_COLORS } from '../../../data/backgroundPresets';
import { RightDrawerProps } from '../types';

interface NavbarBorderSectionProps {
  navbar: RightDrawerProps['navbar'];
  onUpdateNavbar: RightDrawerProps['onUpdateNavbar'];
}

export const NavbarBorderSection = ({
  navbar,
  onUpdateNavbar,
}: NavbarBorderSectionProps) => {
  return (
    <div className="space-y-5 text-right" dir="rtl">
      <SectionHeader title="إطار النافبار" />
      <Slider
        label="سمك الإطار"
        value={navbar.borderWidth ?? 0}
        min={0}
        max={20}
        onChange={(v) => onUpdateNavbar({ borderWidth: v, borderStyle: (navbar.borderStyle || 'none') === 'none' ? 'solid' : navbar.borderStyle })}
        formatValue={(v) => `${v}px`}
      />
      <Slider
        label="تدوير الحواف"
        value={navbar.borderRadius ?? 0}
        min={0}
        max={60}
        onChange={(v) => onUpdateNavbar({ borderRadius: v })}
        formatValue={(v) => `${v}px`}
      />
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-neutral-800 block">نمط الإطار</span>
        <PillTabs
          className="w-full"
          value={(navbar.borderStyle || 'none') as string}
          options={[
            { value: 'none', label: 'بدون' },
            { value: 'solid', label: 'متصل' },
            { value: 'dashed', label: 'متقطع' },
            { value: 'dotted', label: 'منقط' },
          ]}
          onChange={(v) => onUpdateNavbar({ borderStyle: v, borderWidth: v === 'none' ? 0 : (navbar.borderWidth || 2) })}
        />
      </div>
      <ColorSwatchPicker
        swatches={FIFTY_SOLID_COLORS.map((hex) => ({ value: hex }))}
        selectedValue={navbar.borderColor || 'transparent'}
        onSelect={(color) => onUpdateNavbar({ borderColor: color, borderStyle: (navbar.borderStyle || 'none') === 'none' ? 'solid' : navbar.borderStyle })}
      />
    </div>
  );
};
