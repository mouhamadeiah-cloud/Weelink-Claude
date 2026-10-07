// The docked panel shows everything about the selection on one page: a few groups of settings,
// each a card that opens and closes. The column beside the panel lists the same groups by name and
// scrolls the panel to the one clicked. Which groups there are depends on what is selected.
import { ElementType } from '../../types';
import type { DrawerSection } from './types';

export type InspectorGroupId = 'content' | 'font' | 'effects' | 'colors' | 'shape' | 'layout' | 'motion';

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
const TEXT_TYPES: ElementType[] = ['heading', 'paragraph', 'button', 'badge'];

// Each card's title says whose settings it holds (the element's, the slide's or the navbar's), so
// the two are never mixed up; the column keeps the short labels.
export const inspectorGroups = (target: InspectorTarget): InspectorGroup[] => {
  const shapeSections: DrawerSection[] = ['border', 'opacity', 'shadow', 'lighting'];

  if (target.kind === 'navbar') {
    return [
      { id: 'content', title: 'إعدادات النافبار', label: 'النافبار', sections: ['navbar-settings'] },
      { id: 'colors', title: 'ألوان النافبار', label: 'الألوان', sections: ['color', 'background'] },
      { id: 'shape', title: 'شكل النافبار', label: 'الشكل', sections: shapeSections },
    ];
  }
  if (target.kind === 'slide') {
    return [
      // The way this slide meets the next one, drawn by the inspector itself.
      { id: 'content', title: 'تداخل الشريحة', label: 'الشريحة', sections: [] },
      { id: 'colors', title: 'خلفية الشريحة', label: 'الخلفية', sections: ['background'] },
      { id: 'shape', title: 'شكل الشريحة', label: 'الشكل', sections: shapeSections },
      { id: 'layout', title: 'طبقات الشريحة', label: 'الطبقات', sections: ['layers'] },
    ];
  }

  const { type } = target;
  const groups: InspectorGroup[] = [];
  const hasSettings = TYPES_WITH_SETTINGS.includes(type);
  // The image's replacing and clipping, the mask's shape and the shape's grouping are drawn by the
  // inspector itself (content: []), next to any settings the type has.
  const content: DrawerSection[] = type === 'gallery' ? ['gallery'] : hasSettings ? ['format'] : [];
  if (content.length || ['image', 'mask', 'shape', 'lottie', ...SHOP_SETTING_TYPES].includes(type)) {
    groups.push({ id: 'content', title: 'محتوى العنصر', label: 'المحتوى', sections: content });
  }
  if (TEXT_TYPES.includes(type)) groups.push({ id: 'font', title: 'خط العنصر', label: 'الخط', sections: ['typography'] });
  // Glow, outline, highlight... of the letters, drawn by the inspector itself.
  if (TEXT_TYPES.includes(type)) groups.push({ id: 'effects', title: 'تأثيرات النص', label: 'تأثيرات', sections: [] });
  groups.push({
    id: 'colors',
    title: type === 'image' ? 'ألوان الصورة وفلاترها' : type === 'lottie' ? 'خلفية العنصر' : 'ألوان العنصر',
    label: type === 'lottie' ? 'الخلفية' : 'الألوان',
    // The animation's own colours are with the animation, in its content card.
    sections: type === 'image' ? ['color'] : type === 'lottie' ? ['background'] : ['color', 'background'],
  });
  groups.push({ id: 'shape', title: 'شكل العنصر', label: 'الشكل', sections: shapeSections });
  groups.push({
    id: 'layout',
    title: 'مكان العنصر وحجمه',
    label: 'المكان',
    // An element with its own settings shows its size inside them already.
    sections: hasSettings ? ['layers'] : ['format', 'layers'],
  });
  groups.push({ id: 'motion', title: 'رابط العنصر وحركته', label: 'الحركة', sections: ['link', 'animation'] });
  return groups;
};

// The quick ways into a group, shown under it in the column once it is picked: each one brings that
// part of the group's card into view. A font's are the two halves of its toolbar.
export type InspectorShortcutId = DrawerSection | 'font-family' | 'font-size';
export interface InspectorShortcut {
  id: InspectorShortcutId;
  label: string;
}
const SHORTCUT_LABEL: Partial<Record<DrawerSection, string>> = {
  color: 'لون النص',
  background: 'الخلفية',
  border: 'الإطار',
  opacity: 'الشفافية',
  shadow: 'الظل',
  format: 'الأبعاد',
  layers: 'الطبقات',
  link: 'الرابط',
  animation: 'الحركة',
};
export const groupShortcuts = (group: InspectorGroup, target: InspectorTarget): InspectorShortcut[] => {
  if (group.id === 'font') return [{ id: 'font-family', label: 'نوع الخط' }, { id: 'font-size', label: 'الحجم' }];
  const isImage = target.kind === 'element' && target.type === 'image';
  const items = group.sections
    // The glow is drawn with the shadow, as one tool.
    .filter((s) => s !== 'lighting' && SHORTCUT_LABEL[s])
    .map((s) => ({ id: s, label: s === 'color' && isImage ? 'الفلاتر' : SHORTCUT_LABEL[s]! }));
  // One part alone is the group itself.
  return items.length > 1 ? items : [];
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

// A short explanation of each group, shown by its «؟» button. Written for someone building their
// first page.
export const inspectorHelp = (id: InspectorGroupId, target: InspectorTarget): string => {
  const kind = target.kind;
  switch (id) {
    case 'content':
      if (kind === 'navbar') return 'الشريط اللي بأعلى كل صفحات موقعك: اسمك أو شعارك، وأسماء الصفحات اللي بيضغط عليها الزائر، وهل بيضل ثابت فوق وقت ينزل الزائر بالصفحة.';
      if (kind === 'slide') return 'كيف بتلتقي هالشريحة مع الشريحة اللي بعدها: خط مستقيم، موجة، زاوية مايلة… اختار الشكل وشوف النتيجة تحت الشريحة مباشرة.';
      if (target.type === 'lottie') return 'اختار الرسمة المتحركة ولونها وسرعتها، ومتى بتتحرك: دائماً، لما يوصلها الزائر، أو لما يمرّق الماوس فوقها. «عرض المزيد» بيفتح كل الرسوم، وفيك تلصق رابط رسمة من LottieFiles.';
      if (target.type === 'image') return 'بدّل الصورة بصورة من جهازك أو من مكتبة الصور، أو قصّها بشكل (دائرة، قلب، نجمة…) بدل المستطيل.';
      return 'إعدادات هالعنصر الخاصة فيه: الصور بمعرض الصور، أوقات الحجز، خلايا الجدول، رابط الفيديو أو الخريطة، أو منتجات المتجر.';
    case 'font':
      return 'شكل الكتابة: نوع الخط وحجمه، عريض أو مائل أو تحته خط، المحاذاة يمين أو وسط أو يسار، وتحويل النص لقائمة بنقاط أو أرقام.';
    case 'effects':
      return 'شكل جاهز للحروف: توهج نيون، ظل، حروف مجوفة، تدرج أو ذهبي، تمييز الكلمة، أو حركة. اختار واحد، وبعدين غيّر لونه وقوته. «عرض المزيد» بيفتح كل التأثيرات.';
    case 'colors':
      if (kind === 'slide') return 'خلفية الشريحة: لون واحد، تدرج بين لونين أو أكتر، أو صورة. «ألوان صفحتك» هي الألوان الخمسة اللي اخترتها لكل الموقع.';
      if (kind === 'element' && target.type === 'image') return 'غيّر ألوان الصورة: صبغة بلون، أبيض وأسود، تفتيح أو تغميق، بدون ما تتغير الصورة الأصلية.';
      return 'لون الكتابة ولون الخلفية خلف العنصر. «ألوان صفحتك» هي الألوان الخمسة اللي اخترتها لكل الموقع، فإذا استعملتها بيضل موقعك متناسق.';
    case 'shape':
      return 'الإطار حول العنصر وتدوير زواياه، الشفافية (كم بيبيّن اللي وراه)، والظل: خارجي بيرفع العنصر عن الصفحة، وداخلي بيعطيه توهج من جوا.';
    case 'layout':
      if (kind === 'slide') return 'كل العناصر بهالشريحة بالترتيب: اللي فوق بالقائمة بيطلع فوق الباقي على الصفحة. اسحب لتغيير الترتيب.';
      return 'مكان العنصر وحجمه بالأرقام، تدويره، وترتيبه فوق أو تحت العناصر التانية. فيك كمان تحرّكه بالأسهم من الكيبورد.';
    case 'motion':
      return 'وين بياخد الزائر لما يضغط: صفحة من موقعك، رابط خارجي، واتساب أو اتصال. والحركة اللي بيظهر فيها العنصر لما يوصله الزائر.';
  }
};
