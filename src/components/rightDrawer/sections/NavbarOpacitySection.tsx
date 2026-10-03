// Moved verbatim from RightDrawer.tsx (was an inline block in the drawer body).
import React from 'react';
import { SectionHeader, Slider } from '../../ui/SharedControls';
import { RightDrawerProps } from '../types';

interface NavbarOpacitySectionProps {
  navbar: RightDrawerProps['navbar'];
  onUpdateNavbar: RightDrawerProps['onUpdateNavbar'];
}

export const NavbarOpacitySection = ({
  navbar,
  onUpdateNavbar,
}: NavbarOpacitySectionProps) => {
  return (
    <div className="space-y-5 text-right" dir="rtl">
      <SectionHeader title="شفافية النافبار" />
      <Slider
        label="شفافية الخلفية"
        value={Math.round((navbar.backgroundOpacity ?? 1) * 100)}
        min={0}
        max={100}
        onChange={(v) => onUpdateNavbar({ backgroundOpacity: v / 100 })}
        formatValue={(v) => `${v}%`}
      />
      <Slider
        label="شفافية النصوص"
        value={Math.round((navbar.textOpacity ?? 1) * 100)}
        min={0}
        max={100}
        onChange={(v) => onUpdateNavbar({ textOpacity: v / 100 })}
        formatValue={(v) => `${v}%`}
      />
    </div>
  );
};
