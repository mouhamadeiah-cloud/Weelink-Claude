// A product's images in one of the four gallery layouts from the editor (same layouts as the
// gallery element). Clicking a thumbnail shows it as the main image.
import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { GalleryLayout } from '../../../types';

interface ProductGalleryProps {
  images: string[];
  layout: GalleryLayout;
  badge?: React.ReactNode;
  className?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, layout, badge, className = 'h-[340px] sm:h-[420px]' }) => {
  const [active, setActive] = useState(0);
  useEffect(() => { if (active >= images.length) setActive(0); }, [images.length, active]);

  if (images.length === 0) {
    return (
      <div className={`${className} w-full rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-300`}>
        <ImageOff size={40} />
      </div>
    );
  }

  const main = (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-100">
      <img src={images[active] || images[0]} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
      {badge}
    </div>
  );
  const thumb = (src: string, i: number, cls: string) => (
    <button
      key={src + i}
      type="button"
      onClick={() => setActive(i)}
      className={`${cls} rounded-xl overflow-hidden bg-neutral-100 border-2 transition cursor-pointer ${i === active ? 'border-[#B4532A]' : 'border-transparent opacity-80 hover:opacity-100'}`}
    >
      <img src={src} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
    </button>
  );
  const single = images.length === 1;

  // dir="ltr" so "left"/"right" in the layout names mean what they say.
  return (
    <div dir="ltr" className={`${className} w-full`}>
      {(layout === 'top-main' || single) && (
        <div className="w-full h-full flex flex-col gap-2">
          <div className="flex-1 min-h-0">{main}</div>
          {!single && <div className="h-[20%] min-h-[48px] grid grid-cols-5 gap-2">{images.map((src, i) => thumb(src, i, 'w-full h-full'))}</div>}
        </div>
      )}
      {!single && layout === 'left-thumbnails' && (
        <div className="w-full h-full flex gap-2">
          <div className="w-[38%] h-full grid grid-cols-2 grid-rows-2 gap-2">{images.slice(0, 4).map((src, i) => thumb(src, i, 'w-full h-full'))}</div>
          <div className="flex-1 min-w-0">{main}</div>
        </div>
      )}
      {!single && layout === 'right-thumbnails' && (
        <div className="w-full h-full flex gap-2">
          <div className="flex-1 min-w-0">{main}</div>
          <div className="w-[38%] h-full grid grid-cols-2 grid-rows-2 gap-2">{images.slice(0, 4).map((src, i) => thumb(src, i, 'w-full h-full'))}</div>
        </div>
      )}
      {!single && layout === 'left-main-row' && (
        <div className="w-full h-full flex gap-2">
          <div className="w-[70%] h-full">{main}</div>
          <div className="flex-1 min-w-0 flex flex-col gap-2">{images.slice(0, 5).map((src, i) => thumb(src, i, 'flex-1 min-h-0 w-full'))}</div>
        </div>
      )}
    </div>
  );
};

// Small diagrams of the four layouts, for the editor's picker.
export const GALLERY_LAYOUTS: { id: GalleryLayout; label: string }[] = [
  { id: 'top-main', label: 'صورة كبيرة وتحتها صف' },
  { id: 'left-thumbnails', label: 'شبكة يسار وصورة كبيرة' },
  { id: 'right-thumbnails', label: 'صورة كبيرة وشبكة يمين' },
  { id: 'left-main-row', label: 'صورة كبيرة وعمود صغير' },
];

export const GalleryLayoutIcon: React.FC<{ layout: GalleryLayout }> = ({ layout }) => {
  const b = 'bg-current rounded-[2px]';
  return (
    <div dir="ltr" className="w-14 h-10 p-1 flex gap-[3px]">
      {layout === 'top-main' && (
        <div className="w-full h-full flex flex-col gap-[3px]">
          <div className={`flex-1 ${b}`} />
          <div className="h-[28%] grid grid-cols-4 gap-[3px]">{[0, 1, 2, 3].map((i) => <div key={i} className={`${b} opacity-50`} />)}</div>
        </div>
      )}
      {layout === 'left-thumbnails' && (
        <>
          <div className="w-[40%] grid grid-cols-2 grid-rows-2 gap-[3px]">{[0, 1, 2, 3].map((i) => <div key={i} className={`${b} opacity-50`} />)}</div>
          <div className={`flex-1 ${b}`} />
        </>
      )}
      {layout === 'right-thumbnails' && (
        <>
          <div className={`flex-1 ${b}`} />
          <div className="w-[40%] grid grid-cols-2 grid-rows-2 gap-[3px]">{[0, 1, 2, 3].map((i) => <div key={i} className={`${b} opacity-50`} />)}</div>
        </>
      )}
      {layout === 'left-main-row' && (
        <>
          <div className={`w-[68%] ${b}`} />
          <div className="flex-1 flex flex-col gap-[3px]">{[0, 1, 2, 3].map((i) => <div key={i} className={`flex-1 ${b} opacity-50`} />)}</div>
        </>
      )}
    </div>
  );
};
