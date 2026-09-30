export interface PagePalette {
  id: string;
  name: string;
  colors: [string, string, string, string, string]; // [bg, card, border, text, accent]
}

export const TWENTY_PAGE_PALETTES: PagePalette[] = [
  {
    id: 'apple-classic',
    name: 'أبل كلاسيك',
    colors: ['#fbfbfd', '#ffffff', '#e5e5ea', '#1d1d1f', '#0071e3'],
  },
  {
    id: 'modern-azure',
    name: 'سماوي عصري',
    colors: ['#f0f9ff', '#ffffff', '#bae6fd', '#0c4a6e', '#0284c7'],
  },
  {
    id: 'oasis-emerald',
    name: 'زمرد الواحة',
    colors: ['#f0fdf4', '#ffffff', '#bbf7d0', '#14532d', '#059669'],
  },
  {
    id: 'desert-najd',
    name: 'نجد الصحراوي',
    colors: ['#fefce8', '#ffffff', '#fef08a', '#713f12', '#ca8a04'],
  },
  {
    id: 'coral-sunset',
    name: 'شفق وردي',
    colors: ['#fff1f2', '#ffffff', '#fecdd3', '#881337', '#e11d48'],
  },
  {
    id: 'royal-violet',
    name: 'بنفسج ملكي',
    colors: ['#faf5ff', '#ffffff', '#e9d5ff', '#581c87', '#7c3aed'],
  },
  {
    id: 'tech-indigo',
    name: 'نيلي تقني',
    colors: ['#eef2ff', '#ffffff', '#c7d2fe', '#312e81', '#4f46e5'],
  },
  {
    id: 'modern-charcoal',
    name: 'فحم مودرن (داكن)',
    colors: ['#18181b', '#27272a', '#3f3f46', '#f4f4f5', '#38bdf8'],
  },
  {
    id: 'midnight-dark',
    name: 'ليل داكن',
    colors: ['#0f172a', '#1e293b', '#334155', '#f8fafc', '#38bdf8'],
  },
  {
    id: 'arabic-moka',
    name: 'قهوة عربية',
    colors: ['#fdf8f6', '#ffffff', '#edd5be', '#44281d', '#9a3412'],
  },
  {
    id: 'coastal-turquoise',
    name: 'فيروزي ساحلي',
    colors: ['#f0fdfa', '#ffffff', '#99f6e4', '#134e4a', '#0d9488'],
  },
  {
    id: 'islamic-gold',
    name: 'ذهب إسلامي',
    colors: ['#faf8f0', '#ffffff', '#e9dfb5', '#45380d', '#d97706'],
  },
  {
    id: 'clean-monochrome',
    name: 'رمادي نقي',
    colors: ['#f9fafb', '#ffffff', '#e5e7eb', '#111827', '#4b5563'],
  },
  {
    id: 'calm-mint',
    name: 'نعناعي هادئ',
    colors: ['#ecfdf5', '#ffffff', '#a7f3d0', '#064e3b', '#10b981'],
  },
  {
    id: 'warm-amber',
    name: 'عنبر دافئ',
    colors: ['#fffbeb', '#ffffff', '#fde68a', '#78350f', '#d97706'],
  },
  {
    id: 'ruby-crimson',
    name: 'ياقوت أحمر',
    colors: ['#fdf2f2', '#ffffff', '#fbcfe8', '#701a75', '#db2777'],
  },
  {
    id: 'slate-stone',
    name: 'حجر طبيعي',
    colors: ['#f8fafc', '#ffffff', '#cbd5e1', '#0f172a', '#64748b'],
  },
  {
    id: 'levantine-olive',
    name: 'زيتوني شامي',
    colors: ['#f7fee7', '#ffffff', '#d9f99d', '#365314', '#65a30d'],
  },
  {
    id: 'andalusian-clay',
    name: 'فخار أندلسي',
    colors: ['#fff7ed', '#ffffff', '#fed7aa', '#7c2d12', '#ea580c'],
  },
  {
    id: 'neon-aurora',
    name: 'أورورا نيون (داكن)',
    colors: ['#090d16', '#131b2e', '#1f2d4d', '#e2e8f0', '#06b6d4'],
  },
];
