// The gallery slides the admin added to a ready-slide category (server/readySlides.ts), under that category's own slides in the
// editor's ready-slide panel: the same cards as «من معرض التصاميم», in the admin's order, added with the page's style.
import React, { useEffect, useState } from 'react';
import { GalleryCard, loadGallery } from './GalleryPicker';
import { galleryOnlyCategories, readyByCategory } from '../../services/readySlides';
import type { GallerySlide } from '../../services/galleryView';

// The slides of a category (none while loading or if the list cannot be read: the code's own slides are always there).
// `replacesCode`: the admin switched the category to the gallery, so the code's slides are hidden, but only when it has slides to show.
export const useReadyFromGallery = (categoryId: string | null): { slides: GallerySlide[]; replacesCode: boolean } => {
  const [state, setState] = useState<{ slides: GallerySlide[]; replacesCode: boolean }>({ slides: [], replacesCode: false });
  useEffect(() => {
    setState({ slides: [], replacesCode: false });
    if (!categoryId) return;
    let alive = true;
    Promise.all([readyByCategory(), loadGallery(), galleryOnlyCategories().catch(() => new Set<string>())])
      .then(([byCategory, all, only]) => {
        if (!alive) return;
        const byId = new Map(all.map((g) => [g.id, g]));
        const slides = (byCategory[categoryId] || []).map((id) => byId.get(id)).filter((g): g is GallerySlide => !!g && g.kind === 'slide');
        setState({ slides, replacesCode: only.has(categoryId) && slides.length > 0 });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [categoryId]);
  return state;
};

export const ReadyFromGallery: React.FC<{ slides: GallerySlide[]; onAdd: (g: GallerySlide) => void }> = ({ slides, onAdd }) => {
  if (!slides.length) return null;
  return (
    <div className="space-y-4" dir="rtl">
      <p className="text-xs font-bold text-neutral-600">من معرض التصاميم</p>
      {slides.map((g) => <GalleryCard key={g.id} g={g} addLabel="إضافة" onAdd={() => onAdd(g)} />)}
    </div>
  );
};
