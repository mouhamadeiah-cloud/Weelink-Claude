// What a section looks like in the page, drawn from the admin's own ready slides (the same ones «شرائح جاهزة» offers in the editor), so
// the owner sees a real slide next to Wee AI's question. A section without a ready slide shows nothing: its explanation is enough.
import React, { useEffect, useState } from 'react';
import { readySlidesOf } from '../../services/readySlides';
import { previewCategoryOf } from '../../data/sectionQuestions';
import type { GallerySlide } from '../../services/galleryView';
import { LiveSlide } from '../gallery/LiveSlide';

// A slide that cannot be drawn must never take the question down with it.
class Safe extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export const SectionPreview: React.FC<{ sectionId: string }> = ({ sectionId }) => {
  const category = previewCategoryOf(sectionId);
  const [slide, setSlide] = useState<GallerySlide | null>(null);
  useEffect(() => {
    setSlide(null);
    if (!category) return;
    let live = true;
    readySlidesOf(category).then((list) => live && setSlide(list.find((g) => g.elements.length > 0) || null)).catch(() => {});
    return () => { live = false; };
  }, [category]);
  if (!slide) return null;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <p className="px-2.5 py-1.5 text-[11px] font-bold text-neutral-500 border-b border-neutral-100">هيك ممكن يظهر هالقسم بصفحتك (مثال، وبعد البناء بتظهر بياناتك)</p>
      <div className="pointer-events-none">
        <Safe><LiveSlide slide={slide.slide} elements={slide.elements} maxHeight={240} /></Safe>
      </div>
    </div>
  );
};
