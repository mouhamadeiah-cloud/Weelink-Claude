// «من معرض التصاميم» inside the editor's add panel: the gallery's slides (or pages) drawn live, ten at a time with «عرض المزيد».
// A slide is added to the open page; a page replaces the project's main page and its navbar (the caller asks first).
import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Loader2, Plus } from 'lucide-react';
import { LivePage, LiveSlide } from '../gallery/LiveSlide';
import { GallerySlide, listApprovedSlides } from '../../services/galleryView';

const PAGE_SIZE = 10;
// One load for every opening of the panel for a few minutes (the gallery is the same for everyone).
let cache: { at: number; list: Promise<GallerySlide[]> } | null = null;
const loadGallery = () => {
  if (!cache || Date.now() - cache.at > 5 * 60_000) {
    const list = listApprovedSlides();
    list.catch(() => { cache = null; });
    cache = { at: Date.now(), list };
  }
  return cache.list;
};

// What the person chooses when a gallery page joins their project: its name (it becomes a page name in the navbar), its colours
// and fonts, and which navbar the project keeps.
export interface AddPageOptions { name: string; fit: boolean; navbar: 'mine' | 'design' }

interface Props {
  kind: 'slide' | 'page';
  // «بألوان وخطوط ستايل صفحتي».
  fit: boolean;
  onFit: (v: boolean) => void;
  // A slide is added at once; a page asks its name and options first.
  onAdd: (g: GallerySlide, options: AddPageOptions) => void;
}

const AddPageDialog: React.FC<{ g: GallerySlide; fit: boolean; onCancel: () => void; onAdd: (o: AddPageOptions) => void }> = ({ g, fit: fit0, onCancel, onAdd }) => {
  const [name, setName] = useState(g.name.slice(0, 30));
  const [fit, setFit] = useState(fit0);
  const [navbar, setNavbar] = useState<'mine' | 'design'>('mine');
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onCancel]);
  const ok = name.trim().length >= 1;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="إضافة صفحة" onClick={onCancel}>
      <form dir="rtl" onSubmit={(e) => { e.preventDefault(); if (ok) onAdd({ name: name.trim(), fit, navbar }); }} className="w-full max-w-sm space-y-3.5 rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-neutral-900">إضافة «{g.name}» كصفحة في مشروعك</h3>
        <label className="block space-y-1 text-xs font-bold text-neutral-700">
          اسم الصفحة (يظهر في الشريط، والنقر عليه ينقل إليها)
          <input autoFocus value={name} maxLength={30} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal outline-none focus:border-brand" />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
          <input type="checkbox" checked={fit} onChange={(e) => setFit(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
          بألوان وخطوط ستايل صفحتي
        </label>
        <fieldset className="space-y-1.5 text-xs text-neutral-700">
          <legend className="mb-1 font-bold">الشريط العلوي</legend>
          {([['mine', 'شريط صفحتي (يبقى كما هو)'], ['design', 'شريط التصميم (شكله وألوانه، مع اسمك وروابطك)']] as const).map(([id, label]) => (
            <label key={id} className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="navbar" checked={navbar === id} onChange={() => setNavbar(id)} className="accent-[var(--color-brand)]" />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={!ok} className="flex-1 rounded-lg bg-brand py-2 text-xs font-bold text-white transition hover:bg-brand-hover disabled:opacity-50">إضافة الصفحة</button>
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100">إلغاء</button>
        </div>
      </form>
    </div>
  );
};

export const GalleryPicker: React.FC<Props> = ({ kind, fit, onFit, onAdd }) => {
  const [asking, setAsking] = useState<GallerySlide | null>(null);
  const [all, setAll] = useState<GallerySlide[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [count, setCount] = useState(PAGE_SIZE);
  useEffect(() => {
    let alive = true;
    loadGallery().then((l) => alive && setAll(l)).catch(() => alive && (setAll([]), setFailed(true)));
    return () => { alive = false; };
  }, []);
  useEffect(() => setCount(PAGE_SIZE), [kind]);

  const list = useMemo(() => (all || []).filter((g) => g.kind === kind).sort((a, b) => b.likes - a.likes || b.at - a.at), [all, kind]);

  if (all === null) return <div className="flex justify-center py-8 text-neutral-400"><Loader2 size={18} className="animate-spin" /></div>;
  if (list.length === 0) {
    return <p className="py-6 text-center text-xs text-neutral-500">{failed ? 'تعذّر تحميل المعرض. جرّب مرة ثانية.' : kind === 'page' ? 'لا توجد صفحات في المعرض بعد.' : 'لا توجد شرائح في المعرض بعد.'}</p>;
  }

  return (
    <div className="space-y-3" dir="rtl">
      {kind === 'slide' && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
          <input type="checkbox" checked={fit} onChange={(e) => onFit(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
          بألوان وخطوط ستايل صفحتي
        </label>
      )}
      {kind === 'page' && <p className="text-xs leading-relaxed text-neutral-500">تُضاف الصفحة إلى مشروعك باسم تختاره، فيظهر اسمها في الشريط وتعدّل عليها كما تشاء.</p>}
      {list.slice(0, count).map((g) => (
        <article key={g.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
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
            <button type="button" onClick={() => (kind === 'page' ? setAsking(g) : onAdd(g, { name: '', fit, navbar: 'mine' }))} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-hover">
              <Plus size={13} /> {kind === 'page' ? 'إضافة كصفحة' : 'إضافة'}
            </button>
          </div>
        </article>
      ))}
      {list.length > count && (
        <button type="button" onClick={() => setCount((c) => c + PAGE_SIZE)} className="w-full rounded-xl border border-neutral-200 py-2 text-xs font-bold text-neutral-700 transition hover:border-brand hover:text-brand">
          عرض المزيد ({(list.length - count).toLocaleString('ar-SY')})
        </button>
      )}
      {asking && <AddPageDialog g={asking} fit={fit} onCancel={() => setAsking(null)} onAdd={(o) => { onAdd(asking, o); setAsking(null); }} />}
    </div>
  );
};
