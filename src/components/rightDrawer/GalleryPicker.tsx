// «من معرض التصاميم» inside the editor's add panel: the gallery's slides (or pages) drawn live, ten at a time with «عرض المزيد».
// A slide is added to the open page; a page replaces the project's main page and its navbar (the caller asks first).
import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Loader2, Plus } from 'lucide-react';
import { LivePage, LiveSlide } from '../gallery/LiveSlide';
import { GallerySlide, listApprovedSlides } from '../../services/galleryView';

const PAGE_SIZE = 10;
// One load for every opening of the panel for a few minutes (the gallery is the same for everyone).
let cache: { at: number; list: Promise<GallerySlide[]> } | null = null;
export const loadGallery = () => {
  if (!cache || Date.now() - cache.at > 5 * 60_000) {
    const list = listApprovedSlides();
    list.catch(() => { cache = null; });
    cache = { at: Date.now(), list };
  }
  return cache.list;
};

// What goes with a gallery page when it joins the project: the name asked by the editor's usual «اسم الصفحة الجديدة» window (it
// becomes the page's name in the navbar), the project's colours and fonts, and which navbar stays.
export interface AddPageOptions { name: string; fit: boolean; navbar: 'mine' | 'design' }

// One gallery design in a list of the add panel: drawn live, its name and designer, and the button that adds it.
export const GalleryCard: React.FC<{ g: GallerySlide; addLabel: string; onAdd: () => void }> = ({ g, addLabel, onAdd }) => (
  <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
    <div className="pointer-events-none">
      {g.kind === 'page' && g.page ? <LivePage page={g.page} elements={g.elements} maxHeight={260} /> : <LiveSlide slide={g.slide} elements={g.elements} />}
    </div>
    <div className="flex items-center gap-2 border-t border-neutral-100 px-2.5 py-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-bold text-neutral-800">{g.name}</div>
        <div className="flex items-center gap-1 truncate text-xs text-neutral-500">
          {g.designerName || 'مصمم'}{g.official && <BadgeCheck size={12} className="shrink-0 text-brand" />}
        </div>
      </div>
      <button type="button" onClick={onAdd} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-hover">
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  </article>
);

interface Props {
  kind: 'slide' | 'page';
  // «بألوان وخطوط ستايل مشروعي».
  fit: boolean;
  onFit: (v: boolean) => void;
  // A page: «استبدال الشريط بشريط التصميم» (unticked = the project keeps its navbar).
  designNavbar?: boolean;
  onDesignNavbar?: (v: boolean) => void;
  onAdd: (g: GallerySlide, options: AddPageOptions) => void;
}

export const GalleryPicker: React.FC<Props> = ({ kind, fit, onFit, designNavbar, onDesignNavbar, onAdd }) => {
  const [all, setAll] = useState<GallerySlide[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [count, setCount] = useState(PAGE_SIZE);
  useEffect(() => {
    let alive = true;
    loadGallery().then((l) => alive && setAll(l)).catch(() => alive && (setAll([]), setFailed(true)));
    return () => { alive = false; };
  }, []);
  useEffect(() => setCount(PAGE_SIZE), [kind]);

  // A page asks its name in the editor's usual window; a slide goes in at once.
  const addOne = (g: GallerySlide) => {
    if (kind === 'slide') return onAdd(g, { name: '', fit, navbar: 'mine' });
    const name = window.prompt('أدخل اسم الصفحة الجديدة:', g.name.slice(0, 30));
    if (name && name.trim()) onAdd(g, { name: name.trim(), fit, navbar: designNavbar ? 'design' : 'mine' });
  };

  const list = useMemo(() => (all || []).filter((g) => g.kind === kind).sort((a, b) => b.likes - a.likes || b.at - a.at), [all, kind]);

  if (all === null) return <div className="flex justify-center py-8 text-neutral-400"><Loader2 size={18} className="animate-spin" /></div>;
  if (list.length === 0) {
    return <p className="py-6 text-center text-xs text-neutral-500">{failed ? 'تعذّر تحميل المعرض. جرّب مرة ثانية.' : kind === 'page' ? 'لا توجد صفحات في المعرض بعد.' : 'لا توجد شرائح في المعرض بعد.'}</p>;
  }

  return (
    <div className="space-y-3" dir="rtl">
      <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
        <input type="checkbox" checked={fit} onChange={(e) => onFit(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
        بألوان وخطوط ستايل مشروعي
      </label>
      {kind === 'page' && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
          <input type="checkbox" checked={!!designNavbar} onChange={(e) => onDesignNavbar?.(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
          استبدال الشريط بشريط التصميم
        </label>
      )}
      {list.slice(0, count).map((g) => (
        <GalleryCard key={g.id} g={g} addLabel={kind === 'page' ? 'إضافة كصفحة' : 'إضافة'} onAdd={() => addOne(g)} />
      ))}
      {list.length > count && (
        <button type="button" onClick={() => setCount((c) => c + PAGE_SIZE)} className="w-full rounded-xl border border-neutral-200 py-2 text-xs font-bold text-neutral-700 transition hover:border-brand hover:text-brand">
          عرض المزيد ({(list.length - count).toLocaleString('ar-SY')})
        </button>
      )}
    </div>
  );
};
