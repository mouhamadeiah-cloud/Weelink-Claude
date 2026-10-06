// A wide side panel for browsing Unsplash photos: search, categories and a large grid that
// loads more as you scroll. It opens beside the control panel (like the ready slides panel),
// or over the whole screen when there is no room beside it (phones).
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Plus, RefreshCw, Search, X } from 'lucide-react';
import { GALLERY_CATEGORIES, GalleryImageItem } from '../data/graphicsPresets';
import { fetchUnsplashPhotos } from '../services/unsplashService';

const PER_PAGE = 24;
const PANEL_WIDTH = 440;

interface PhotoBrowserPanelProps {
  anchor: HTMLElement | null;
  initialQuery: string;
  initialCategory: string;
  pickingId: string | null;
  onPick: (photo: GalleryImageItem) => void;
  onClose: () => void;
}

const notLiveMessage = (error?: string) =>
  error === 'rate_limited'
    ? 'وصلنا للحد المسموح من طلبات Unsplash لهذه الساعة. هذه صور مختارة حتى يتجدد الحد.'
    : error === 'offline'
      ? 'ما في اتصال بالخادم. هذه صور مختارة محفوظة بالتطبيق.'
      : 'مكتبة Unsplash الكاملة غير مفعّلة بعد على الخادم، فهذه صور مختارة فقط.';

// Where the panel goes: beside the control panel when it fits, else over the screen.
const usePlacement = (anchor: HTMLElement | null) => {
  const [style, setStyle] = useState<React.CSSProperties>({ inset: 0 });
  useLayoutEffect(() => {
    const place = () => {
      const r = anchor?.closest('aside')?.getBoundingClientRect();
      // The editor's column of buttons sits beside the control panel; the panel opens past it.
      const columns = [...document.querySelectorAll('nav[aria-label="أدوات التعديل"]')]
        .map((n) => n.getBoundingClientRect())
        .filter((c) => c.width > 0 && c.height > c.width);
      const left = Math.min(r?.left ?? 0, ...columns.map((c) => c.left));
      if (r && left >= 360 && window.innerWidth >= 1024) {
        setStyle({ top: r.top, height: r.height, right: window.innerWidth - left, width: Math.min(PANEL_WIDTH, left - 12) });
      } else {
        setStyle({ inset: 0 });
      }
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [anchor]);
  return style;
};

export const PhotoBrowserPanel: React.FC<PhotoBrowserPanelProps> = ({ anchor, initialQuery, initialCategory, pickingId, onPick, onClose }) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [photos, setPhotos] = useState<GalleryImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [live, setLive] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const gridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const style = usePlacement(anchor);
  const overlay = 'inset' in style;

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // First page for each search or category.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      const result = await fetchUnsplashPhotos({ query, category, page: 1, perPage: PER_PAGE });
      if (!alive) return;
      setPhotos(result.items);
      setPage(1);
      setTotalPages(result.totalPages);
      setLive(result.isLive);
      setError(result.error);
      setLoading(false);
      gridRef.current?.scrollTo({ top: 0 });
    }, query ? 450 : 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, category]);

  const loadMore = async () => {
    if (loading || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    const result = await fetchUnsplashPhotos({ query, category, page: page + 1, perPage: PER_PAGE });
    setPhotos((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...result.items.filter((p) => !seen.has(p.id))];
    });
    setPage(page + 1);
    setTotalPages(result.items.length ? result.totalPages : page);
    setLoadingMore(false);
  };

  // More photos when the end of the grid scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), { root: gridRef.current, rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  });

  const hasMore = page < totalPages;

  return createPortal(
    <>
      {overlay && <div className="fixed inset-0 z-[1000000] bg-black/40" onClick={onClose} />}
      <section
        role="dialog"
        aria-label="صور Unsplash"
        dir="rtl"
        className={`fixed z-[1000001] flex flex-col overflow-hidden bg-[#fbfbfd] text-right font-sans shadow-[-12px_0_30px_rgba(0,0,0,0.18)] ${
          overlay ? 'm-2 rounded-2xl sm:m-6' : 'rounded-l-2xl border-y-2 border-l-2 border-neutral-300'
        }`}
        style={style}
      >
        <header className="shrink-0 space-y-2.5 border-b border-neutral-200 bg-[#f5f5f7] p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-neutral-900">صور Unsplash</span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-black"
              title="إغلاق"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          </div>
          <div className="relative">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث: قهوة، بيتزا، بحر، مكتب…"
              className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 pr-9 pl-3 text-[13px] placeholder:text-neutral-400 focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] focus:outline-none"
            />
            <Search size={16} className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GALLERY_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`cursor-pointer rounded-full px-3 py-1 text-[11.5px] font-bold transition-colors ${
                  category === c.id ? 'bg-[#0071e3] text-white' : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {!live && !loading && <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800">{notLiveMessage(error)}</p>}
        </header>

        <div ref={gridRef} className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-neutral-200/70" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <p className="p-8 text-center text-sm text-neutral-500">ما لقينا صور لهالبحث. جرّب كلمة ثانية.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => onPick(photo)}
                  disabled={!!pickingId}
                  className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border border-neutral-200 transition-all hover:border-[#0071e3] hover:shadow-md disabled:cursor-wait"
                  style={{ backgroundColor: photo.color || '#e5e5ea' }}
                  title={photo.title}
                >
                  <img src={photo.thumbUrl} alt={photo.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  {pickingId === photo.id ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                      <RefreshCw size={18} className="animate-spin" />
                    </span>
                  ) : (
                    <span className="absolute inset-0 flex flex-col items-center justify-between bg-black/40 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <span />
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0071e3] shadow-sm">
                        <Plus size={15} strokeWidth={3} />
                      </span>
                      <span className="w-full truncate text-[10px] font-medium">{photo.photographer}</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />
          {!loading && hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white py-2.5 text-xs font-bold text-neutral-800 hover:border-[#0071e3] hover:text-[#0071e3] disabled:opacity-60"
            >
              {loadingMore ? <RefreshCw size={13} className="animate-spin" /> : null}
              {loadingMore ? 'جاري التحميل…' : 'صور أكثر'}
            </button>
          )}
        </div>

        <footer className="shrink-0 border-t border-neutral-200 px-3 py-2 text-center text-[10.5px] text-neutral-500">
          الصور من{' '}
          <a href="https://unsplash.com?utm_source=weelink&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-neutral-700 hover:text-[#0071e3]">
            Unsplash <ExternalLink size={10} />
          </a>
          ، اضغط على صورة لإضافتها
        </footer>
      </section>
    </>,
    document.body
  );
};
