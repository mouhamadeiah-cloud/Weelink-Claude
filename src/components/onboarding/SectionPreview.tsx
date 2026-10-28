// What a section looks like in the page, drawn from the ready slides: the admin's own list when it has one for the category (the same ones
// «شرائح جاهزة» offers in the editor), else the code's own ready slide, as the editor does. A section with neither shows nothing.
import React, { useEffect, useState } from 'react';
import { readyListTakenOver, readySlidesOf } from '../../services/readySlides';
import { previewCategoryOf } from '../../data/sectionQuestions';
import { FIXED_READY_CATEGORIES, READY_SLIDE_CATEGORIES } from '../../data/readyCategories';
import { getSlideTemplatePayload, slideTemplateCount } from '../../data/slideTemplates';
import type { GallerySlide } from '../../services/galleryView';
import { LiveSlide } from '../gallery/LiveSlide';
import { SlideTemplatePreview, SlidePayload } from '../rightDrawer/SlideTemplatePreview';

// A slide that cannot be drawn must never take the question down with it.
class Safe extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

type Shown = { from: 'admin'; slide: GallerySlide } | { from: 'code'; payload: SlidePayload; category: string } | null;

export const SectionPreview: React.FC<{ sectionId: string }> = ({ sectionId }) => {
  const category = previewCategoryOf(sectionId);
  const [shown, setShown] = useState<Shown>(null);
  useEffect(() => {
    setShown(null);
    if (!category) return;
    let live = true;
    const code = (): Shown => {
      if (!slideTemplateCount(category)) return null;
      const name = READY_SLIDE_CATEGORIES.find((c) => c.id === category)?.name || 'شريحة';
      try { return { from: 'code', payload: getSlideTemplatePayload(category, 0, name) as SlidePayload, category }; } catch { return null; }
    };
    if (FIXED_READY_CATEGORIES.includes(category)) { setShown(code()); return; }
    Promise.all([readySlidesOf(category).catch(() => [] as GallerySlide[]), readyListTakenOver().catch(() => false)]).then(([list, taken]) => {
      if (!live) return;
      const mine = list.find((g) => g.elements.length > 0);
      // A category that has the admin's slides is the admin's; only a category without any falls back to the code's own.
      setShown(mine ? { from: 'admin', slide: mine } : taken ? null : code());
    });
    return () => { live = false; };
  }, [category]);
  if (!shown) return null;
  return (
    <div className="space-y-1.5">
      <Safe>
        {shown.from === 'admin'
          ? <div className="pointer-events-none rounded-xl border border-neutral-200 overflow-hidden shadow-sm"><LiveSlide slide={shown.slide.slide} elements={shown.slide.elements} maxHeight={320} /></div>
          : <div className="pointer-events-none"><SlideTemplatePreview payload={shown.payload} categoryId={shown.category} index={0} onAdd={() => {}} bare /></div>}
      </Safe>
      <p className="text-center text-[11px] font-bold text-neutral-500">مثال على شكل هالقسم بصفحتك، وبعد البناء بتظهر بياناتك</p>
    </div>
  );
};
