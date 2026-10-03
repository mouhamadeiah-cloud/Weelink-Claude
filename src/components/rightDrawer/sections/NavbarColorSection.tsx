// Moved verbatim from RightDrawer.tsx (was an inline block in the drawer body).
import React from 'react';
import { ColorSwatchPicker, SectionHeader } from '../../ui/SharedControls';
import { FIFTY_SOLID_COLORS } from '../../../data/backgroundPresets';
import { RightDrawerProps } from '../types';

interface NavbarColorSectionProps {
  navbar: RightDrawerProps['navbar'];
  onUpdateNavbar: RightDrawerProps['onUpdateNavbar'];
}

export const NavbarColorSection = ({
  navbar,
  onUpdateNavbar,
}: NavbarColorSectionProps) => {
  return (
    <div className="space-y-4 text-right" dir="rtl">
      <SectionHeader title="لون نصوص النافبار" />
      <ColorSwatchPicker
        swatches={FIFTY_SOLID_COLORS.map((hex) => ({ value: hex }))}
        selectedValue={navbar.textColor}
        onSelect={(color) => onUpdateNavbar({ textColor: color })}
      />
    </div>
  );
};
