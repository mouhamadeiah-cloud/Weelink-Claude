// The short explainer animations shown over the editor, one per group of settings. Each is a page in
// public/intro-videos that plays itself and talks to IntroVideoPlayer through postMessage.
import type { InspectorGroupId } from '../rightDrawer/inspectorGroups';

// One part of a long explainer, picked from the player's list of chapters.
export interface IntroChapter {
  id: string;
  title: string;
  src: string;
}

export interface IntroVideo {
  id: InspectorGroupId | 'add';
  title: string;
  src: string;
  // A long explainer is cut into short chapters; src is then the first one's.
  chapters?: IntroChapter[];
}

const VIDEOS: Partial<Record<InspectorGroupId, IntroVideo>> = {
  shape: { id: 'shape', title: 'شرح «الشكل»', src: '/intro-videos/shape.html' },
};

export const introVideoFor = (group: InspectorGroupId): IntroVideo | null => VIDEOS[group] ?? null;

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
