// The admin's ready slides of the open category (server/readySlides.ts), in the editor's ready-slide panel: the same cards as
// «من معرض التصاميم», in the admin's order, added with the page's style.
import React, { useEffect, useState } from 'react';
import { GalleryCard } from './GalleryPicker';
import { readyListTakenOver, readySlidesOf } from '../../services/readySlides';
import type { GallerySlide } from '../../services/galleryView';
import { FIXED_READY_CATEGORIES } from '../../data/readyCategories';

// The slides of a category (none while loading or if the list cannot be read: the code's own slides are always there).
// `replacesCode`: the admin's list took over from the code's slides (it was copied once), so the code's are hidden for these categories.
export const useReadyFromGallery = (categoryId: string | null): { slides: GallerySlide[]; replacesCode: boolean } => {
  const [state, setState] = useState<{ slides: GallerySlide[]; replacesCode: boolean }>({ slides: [], replacesCode: false });
  useEffect(() => {
    setState({ slides: [], replacesCode: false });
    if (!categoryId || FIXED_READY_CATEGORIES.includes(categoryId)) return; // fixed categories: the code's slides only
    let alive = true;
    Promise.all([readySlidesOf(categoryId), readyListTakenOver().catch(() => false)])
      .then(([slides, taken]) => {
        if (alive) setState({ slides, replacesCode: taken });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [categoryId]);
  return state;
};

export const ReadyFromGallery: React.FC<{ slides: GallerySlide[]; onAdd: (g: GallerySlide) => void; replacesCode?: boolean }> = ({ slides, onAdd, replacesCode }) => {
  if (!slides.length) return replacesCode ? <p className="py-6 text-center text-xs text-neutral-500" dir="rtl">لا توجد شرائح في هذه الفئة بعد.</p> : null;
  return (
    <div className="space-y-4" dir="rtl">
      {!replacesCode && <p className="text-xs font-bold text-neutral-600">شرائح أضافتها الإدارة</p>}
      {slides.map((g) => <GalleryCard key={g.id} g={g} addLabel="إضافة" onAdd={() => onAdd(g)} />)}
    </div>
  );
};
