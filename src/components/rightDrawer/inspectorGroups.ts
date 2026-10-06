// The docked panel shows everything about the selection on one page: a few groups of settings,
// each a card that opens and closes. The column beside the panel lists the same groups by name and
// scrolls the panel to the one clicked. Which groups there are depends on what is selected.
import { ElementType } from '../../types';
import type { DrawerSection } from './types';

export type InspectorGroupId = 'content' | 'font' | 'colors' | 'shape' | 'layout' | 'motion';

export type InspectorTarget =
  | { kind: 'navbar' }
  | { kind: 'slide' }
  | { kind: 'element'; type: ElementType };

export interface InspectorGroup {
  id: InspectorGroupId;
  title: string;
  // The name under its icon in the column (short enough for 64px).
  label: string;
  // The panel sections drawn inside the card, in order.
  sections: DrawerSection[];
}

// Elements whose own settings (gallery images, booking hours, table cells...) are more than size and rotation.
export const TYPES_WITH_SETTINGS: ElementType[] = [
  'gallery', 'table', 'calendar', 'video', 'map', 'cart', 'checkout', 'carListings', 'carSearch', 'menuList', 'menuCart',
];
// Elements whose settings are drawn by the shop's own panel rather than the format section.
export const SHOP_SETTING_TYPES: ElementType[] = ['shopProducts', 'shopSearch'];
const TEXT_TYPES: ElementType[] = ['heading', 'paragraph', 'button'];

export const inspectorGroups = (target: InspectorTarget): InspectorGroup[] => {
  const look: InspectorGroup = { id: 'shape', title: 'الشكل', label: 'الشكل', sections: ['border', 'opacity', 'shadow', 'lighting'] };

  if (target.kind === 'navbar') {
    return [
      { id: 'content', title: 'النافبار', label: 'النافبار', sections: ['navbar-settings'] },
      { id: 'colors', title: 'الألوان', label: 'الألوان', sections: ['color', 'background'] },
      look,
    ];
  }
  if (target.kind === 'slide') {
    return [
      // The way this slide meets the next one, drawn by the inspector itself.
      { id: 'content', title: 'الشريحة', label: 'الشريحة', sections: [] },
      { id: 'colors', title: 'الخلفية', label: 'الخلفية', sections: ['background'] },
      look,
      { id: 'layout', title: 'الطبقات', label: 'الطبقات', sections: ['layers'] },
    ];
  }

  const { type } = target;
  const groups: InspectorGroup[] = [];
  const hasSettings = TYPES_WITH_SETTINGS.includes(type);
  // The image's replacing and clipping, the mask's shape and the shape's grouping are drawn by the
  // inspector itself (content: []), next to any settings the type has.
  const content: DrawerSection[] = type === 'gallery' ? ['gallery'] : hasSettings ? ['format'] : [];
  if (content.length || ['image', 'mask', 'shape', ...SHOP_SETTING_TYPES].includes(type)) {
    groups.push({ id: 'content', title: 'المحتوى', label: 'المحتوى', sections: content });
  }
  if (TEXT_TYPES.includes(type)) groups.push({ id: 'font', title: 'الخط', label: 'الخط', sections: ['typography'] });
  groups.push({
    id: 'colors',
    title: type === 'image' ? 'الألوان والفلاتر' : 'الألوان',
    label: 'الألوان',
    sections: type === 'image' ? ['color'] : ['color', 'background'],
  });
  groups.push(look);
  groups.push({
    id: 'layout',
    title: 'المكان والحجم',
    label: 'المكان',
    // An element with its own settings shows its size inside them already.
    sections: hasSettings ? ['layers'] : ['format', 'layers'],
  });
  groups.push({ id: 'motion', title: 'الرابط والحركة', label: 'الحركة', sections: ['link', 'animation'] });
  return groups;
};

// Where a section asked for by name (an old shortcut, a "settings" link) now lives.
export const groupOfSection = (section: DrawerSection, target: InspectorTarget): InspectorGroupId | null => {
  const normalized: DrawerSection =
    section === 'fontSize' || section === 'fontFamily' || section === 'alignment' || section === 'list' ? 'typography' : section;
  const found = inspectorGroups(target).find((g) => g.sections.includes(normalized));
  return found ? found.id : null;
};

// The sections that belong to the inspector (anything else, like adding elements or the page's
// settings, still has a page of its own).
export const INSPECTOR_SECTIONS: DrawerSection[] = [
  'color', 'background', 'border', 'opacity', 'lighting', 'shadow', 'format', 'gallery',
  'typography', 'fontSize', 'fontFamily', 'alignment', 'list', 'animation', 'layers', 'link', 'navbar-settings',
];
