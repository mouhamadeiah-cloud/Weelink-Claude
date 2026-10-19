// The short explainer animations shown over the editor, one per group of settings. Each is a page in
// public/intro-videos that plays itself and talks to IntroVideoPlayer through postMessage.
import type { InspectorGroupId, InspectorTarget } from '../rightDrawer/inspectorGroups';

// One part of a long explainer, picked from the player's list of chapters.
export interface IntroChapter {
  id: string;
  title: string;
  src: string;
}

export interface IntroVideo {
  id: InspectorGroupId | 'add' | 'structure' | 'weeai' | 'admin';
  title: string;
  src: string;
  // A long explainer is cut into short chapters; src is then the first one's.
  chapters?: IntroChapter[];
}

const chaptersOf = (group: string, list: [string, string][]): IntroChapter[] =>
  list.map(([id, title]) => ({ id, title, src: `/intro-videos/${group}-${id}.html` }));

// Groups whose card differs by what is selected (a slide, the navbar, an image…) have a chapter for each.
const VIDEOS: Partial<Record<InspectorGroupId, IntroVideo>> = {
  content: {
    id: 'content',
    title: 'شرح «المحتوى»',
    src: '/intro-videos/content-element.html',
    chapters: chaptersOf('content', [['element', 'إعدادات العنصر'], ['image', 'الصورة'], ['lottie', 'الرسوم المتحركة'], ['navbar', 'النافبار'], ['slide', 'تداخل الشريحة']]),
  },
  font: {
    id: 'font',
    title: 'شرح «الخط»',
    src: '/intro-videos/font.html',
    chapters: [{ id: 'font', title: 'الخط', src: '/intro-videos/font.html' }, { id: 'effects', title: 'تأثيرات النص', src: '/intro-videos/effects.html' }],
  },
  colors: {
    id: 'colors',
    title: 'شرح «الألوان»',
    src: '/intro-videos/colors-element.html',
    chapters: chaptersOf('colors', [['element', 'ألوان العنصر'], ['image', 'فلاتر الصورة'], ['slide', 'خلفية الشريحة']]),
  },
  shape: { id: 'shape', title: 'شرح «الشكل»', src: '/intro-videos/shape.html' },
  layout: {
    id: 'layout',
    title: 'شرح «المكان»',
    src: '/intro-videos/layout-element.html',
    chapters: chaptersOf('layout', [['element', 'مكان العنصر'], ['slide', 'طبقات الشريحة']]),
  },
  link: { id: 'link', title: 'شرح «الرابط»', src: '/intro-videos/motion-link.html' },
  motion: { id: 'motion', title: 'شرح «الحركة»', src: '/intro-videos/motion-animation.html' },
};

export const introVideoFor = (group: InspectorGroupId): IntroVideo | null => VIDEOS[group] ?? null;

// The chapter of a group's explainer that fits what is selected.
export const introChapterFor = (group: InspectorGroupId, target: InspectorTarget): string | null => {
  const ids = VIDEOS[group]?.chapters?.map((c) => c.id);
  if (!ids) return null;
  const type = target.kind === 'element' ? target.type : null;
  const pick = target.kind === 'navbar' ? 'navbar' : target.kind === 'slide' ? 'slide' : type === 'image' || type === 'lottie' ? type : 'element';
  return ids.includes(pick) ? pick : ids[0];
};

export const chapterOf = (video: IntroVideo, id: string | null): IntroChapter | null =>
  (id && video.chapters?.find((c) => c.id === id)) || null;

// The column's «الهيكل» and «Wee AI» panels.
export const STRUCTURE_VIDEO: IntroVideo = { id: 'structure', title: 'شرح «الهيكل»', src: '/intro-videos/structure.html' };
export const WEEAI_VIDEO: IntroVideo = { id: 'weeai', title: 'شرح «Wee AI»', src: '/intro-videos/weeai.html' };

// The «إضافة» panel: a quick tour, then one chapter per thing that can be added (ids as in its grid).
const ADD_CHAPTERS: [string, string][] = [
  ['tour', 'جولة سريعة'],
  ['text', 'النص'],
  ['image', 'الصورة'],
  ['button', 'الزر'],
  ['icons', 'الأيقونة'],
  ['shape', 'الأشكال'],
  ['divider', 'الخط الفاصل'],
  ['video', 'الفيديو'],
  ['lottie', 'الرسوم المتحركة'],
  ['gallery', 'معرض الصور'],
  ['map', 'الخريطة'],
  ['calendar', 'حجز المواعيد'],
  ['ratings', 'التقييمات'],
  ['pricing', 'الأسعار'],
  ['sheet', 'الجدول'],
  ['group-templates', 'البطاقات الجاهزة'],
  ['html', 'الكود المخصص'],
];

export const ADD_VIDEO: IntroVideo = {
  id: 'add',
  title: 'شرح «الإضافة»',
  src: '/intro-videos/add-tour.html',
  chapters: ADD_CHAPTERS.map(([id, title]) => ({ id, title, src: `/intro-videos/add-${id}.html` })),
};

export const addChapterFor = (category: string): IntroChapter | null =>
  ADD_VIDEO.chapters?.find((c) => c.id === category) ?? null;

// The admin of each kind of page; it floats over the editor, so its explainer opens from a button in its header.
export type AdminKind = 'page' | 'restaurant' | 'shop' | 'cars';
export const ADMIN_VIDEOS: Record<AdminKind, IntroVideo> = {
  page: { id: 'admin', title: 'شرح «إدارة الصفحة»', src: '/intro-videos/admin-page.html' },
  restaurant: { id: 'admin', title: 'شرح «إدارة المطعم»', src: '/intro-videos/admin-restaurant.html' },
  shop: { id: 'admin', title: 'شرح «إدارة المتجر»', src: '/intro-videos/admin-shop.html' },
  cars: { id: 'admin', title: 'شرح «إدارة معرض السيارات»', src: '/intro-videos/admin-cars.html' },
};
