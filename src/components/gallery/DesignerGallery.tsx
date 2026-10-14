// «تصميمات مصممينا»: the approved slides and pages of the designers' gallery, under the start page's cards
// (Eyad, 14 Oct). Each is the live slide (LiveSlide: videos, text motion and effects play); clicking one opens it large. Filter by the kind of
// slide, sort by likes or by newest, and see more of one designer. A signed-in visitor likes or
// dislikes a slide (once per slide, changeable); the counters come from api/gallery.ts, and the likes
// beside a designer's name are the total over their slides. Contact with the designer and «أضف
// لصفحتي مجاناً» are shown and wait for their own phases. The section stays out of the way when
// the gallery has nothing yet.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { Heart, Loader2, MessageCircle, Plus, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { LivePage, LiveSlide } from './LiveSlide';
import { PAGE_CATEGORIES, PAGE_SLIDES, SLIDE_CATEGORIES, categoryLabel, type DesignKind } from '../../data/slideCategories';
import { GallerySlide, isNewSlide, listApprovedSlides, readMyVotes, voteErrorText, voteOnSlide } from '../../services/galleryView';

type Sort = 'likes' | 'new';
const nf = (n: number) => n.toLocaleString('ar-SY');

// A page is drawn whole with its navbar; on a card a long page is cut (the large view shows it all).
const CARD_PAGE_HEIGHT = 380;
const preview = (s: GallerySlide, card = false) =>
  s.kind === 'page' && s.page ? <LivePage page={s.page} elements={s.elements} maxHeight={card ? CARD_PAGE_HEIGHT : undefined} /> : <LiveSlide slide={s.slide} elements={s.elements} />;

interface VoteButtonsProps {
  slide: GallerySlide;
  mine: number;
  own: boolean;
  onVote: (slide: GallerySlide, value: 1 | -1) => void;
  large?: boolean;
}

const VoteButtons: React.FC<VoteButtonsProps> = ({ slide, mine, own, onVote, large }) => {
  const base = `inline-flex items-center gap-1.5 rounded-ctl border font-bold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${large ? 'h-10 px-4 text-sm' : 'h-8 px-2.5 text-xs'}`;
  return (
    <span className="inline-flex items-center gap-1.5">
      <button type="button" disabled={own} onClick={(e) => { e.stopPropagation(); onVote(slide, 1); }} aria-pressed={mine === 1} aria-label="إعجاب" title={own ? 'هذا تصميمك' : 'إعجاب'} className={`${base} ${mine === 1 ? 'bg-brand text-white border-brand' : 'bg-surface text-ink border-line hover:border-brand/40'}`}>
        <ThumbsUp size={large ? 16 : 13} /> <span className="tabular-nums">{nf(slide.likes)}</span>
      </button>
      <button type="button" disabled={own} onClick={(e) => { e.stopPropagation(); onVote(slide, -1); }} aria-pressed={mine === -1} aria-label="عدم إعجاب" title={own ? 'هذا تصميمك' : 'عدم إعجاب'} className={`${base} ${mine === -1 ? 'bg-ink text-white border-ink' : 'bg-surface text-ink border-line hover:border-ink/40'}`}>
        <ThumbsDown size={large ? 16 : 13} /> <span className="tabular-nums">{nf(slide.dislikes)}</span>
      </button>
    </span>
  );
};

const DesignerLine: React.FC<{ slide: GallerySlide; total: number }> = ({ slide, total }) => (
  <span className="inline-flex items-center gap-1.5 min-w-0 text-xs text-muted">
    <span className="font-bold text-ink truncate">{slide.designerName || 'مصمم'}</span>
    <span className="inline-flex items-center gap-0.5 text-brand font-bold shrink-0" title="مجموع إعجابات المصمم"><Heart size={12} className="fill-current" /> <span className="tabular-nums">{nf(total)}</span></span>
  </span>
);

export const DesignerGallery: React.FC<{ user: User | null }> = ({ user }) => {
  const signedIn = !!user && !user.isAnonymous;
  const [slides, setSlides] = useState<GallerySlide[] | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [sort, setSort] = useState<Sort>('likes');
  const [kind, setKind] = useState<'all' | DesignKind>('all');
  const [category, setCategory] = useState('all');
  const [designer, setDesigner] = useState<{ uid: string; name: string } | null>(null);
  const [openId, setOpenId] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let alive = true;
    // A slow or unreachable cloud must not leave a spinner on the start page for long.
    Promise.race([listApprovedSlides(), new Promise<GallerySlide[]>((_, reject) => window.setTimeout(() => reject(new Error('timeout')), 8000))])
      .then((rows) => alive && setSlides(rows))
      .catch((e) => {
        console.warn('Could not load the designers gallery:', e);
        if (alive) setSlides([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setVotes({});
    if (!signedIn || !user) return;
    let alive = true;
    readMyVotes(user.uid)
      .then((v) => alive && setVotes(v))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [signedIn, user?.uid]);

  // The likes beside a designer's name: the total over their slides in the gallery.
  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const s of slides || []) t[s.designerUid] = (t[s.designerUid] || 0) + s.likes;
    return t;
  }, [slides]);

  const present = useMemo(() => new Set((slides || []).map((s) => s.category)), [slides]);
  const shown = useMemo(() => {
    const rows = (slides || []).filter((s) => (kind === 'all' || s.kind === kind) && (category === 'all' || s.category === category) && (!designer || s.designerUid === designer.uid));
    return [...rows].sort((a, b) => (sort === 'new' ? b.at - a.at || b.likes - a.likes : b.likes - a.likes || b.at - a.at));
  }, [slides, kind, category, designer, sort]);
  const open = (slides || []).find((s) => s.id === openId) || null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenId('');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const vote = useCallback(async (slide: GallerySlide, value: 1 | -1) => {
    if (!signedIn || !user) {
      setNotice('سجّل دخولك لتصوّت على التصاميم.');
      return;
    }
    setNotice('');
    const old = votes[slide.id] || 0;
    const next = old === value ? 0 : value;
    const patch = (s: GallerySlide): GallerySlide => s.id !== slide.id ? s : {
      ...s,
      likes: Math.max(0, s.likes + (next === 1 ? 1 : 0) - (old === 1 ? 1 : 0)),
      dislikes: Math.max(0, s.dislikes + (next === -1 ? 1 : 0) - (old === -1 ? 1 : 0)),
    };
    // Shown at once, then replaced by the server's numbers; put back when the vote did not go through.
    setSlides((rows) => rows && rows.map(patch));
    setVotes((v) => { const n = { ...v }; if (next) n[slide.id] = next; else delete n[slide.id]; return n; });
    try {
      const r = await voteOnSlide(user, slide.id, next as 1 | -1 | 0);
      setSlides((rows) => rows && rows.map((s) => (s.id === slide.id ? { ...s, likes: r.likes, dislikes: r.dislikes } : s)));
    } catch (e) {
      setSlides((rows) => rows && rows.map((s) => (s.id === slide.id ? slide : s)));
      setVotes((v) => { const n = { ...v }; if (old) n[slide.id] = old; else delete n[slide.id]; return n; });
      setNotice(voteErrorText(e));
    }
  }, [signedIn, user, votes]);

  if (slides === null) return <div className="flex justify-center py-6 text-faint"><Loader2 size={18} className="animate-spin" /></div>;
  if (slides.length === 0) return null;

  const chip = (active: boolean) => `shrink-0 h-9 px-3.5 rounded-full border text-xs font-bold transition cursor-pointer ${active ? 'bg-ink text-white border-ink' : 'bg-surface text-ink border-line hover:border-ink/40'}`;

  return (
    <section aria-labelledby="designers-gallery-title" className="space-y-4 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="designers-gallery-title" className="text-heading sm:text-title font-bold">تصميمات مصممينا</h2>
          <p className="text-sm text-muted">شرائح وصفحات جاهزة بتصميم مصممين على Weelink. اضغط على أي تصميم لتشوفه كبيراً.</p>
        </div>
        <div className="inline-flex rounded-ctl border border-line bg-surface p-0.5" role="group" aria-label="الترتيب">
          {([['likes', 'الأكثر إعجاباً'], ['new', 'الأحدث']] as [Sort, string][]).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setSort(id)} aria-pressed={sort === id} className={`h-8 px-3 rounded-[10px] text-xs font-bold cursor-pointer transition ${sort === id ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="شرائح أو صفحات">
        {([['all', 'الكل'], ['slide', 'شرائح'], ['page', 'صفحات كاملة']] as ['all' | DesignKind, string][]).map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setKind(id); setCategory('all'); }} aria-pressed={kind === id} className={`shrink-0 h-9 px-3.5 rounded-full border text-xs font-bold transition cursor-pointer ${kind === id ? 'bg-brand text-white border-brand' : 'bg-surface text-ink border-line hover:border-brand/40'}`}>{label}</button>
        ))}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="النوع">
        <button type="button" onClick={() => setCategory('all')} aria-pressed={category === 'all'} className={chip(category === 'all')}>كل الأنواع</button>
        {[...(kind === 'page' ? [] : SLIDE_CATEGORIES), ...(kind === 'slide' ? [] : PAGE_CATEGORIES)].filter((c) => present.has(c.id) && (slides || []).some((s) => s.category === c.id && (kind === 'all' || s.kind === kind))).map((c) => (
          <button key={c.id} type="button" onClick={() => setCategory(c.id)} aria-pressed={category === c.id} className={chip(category === c.id)}>{c.label}</button>
        ))}
      </div>

      {designer && (
        <button type="button" onClick={() => setDesigner(null)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-brand/10 text-brand text-xs font-bold cursor-pointer">
          تصميمات {designer.name} فقط <X size={13} />
        </button>
      )}
      {notice && <p role="status" className="text-sm font-bold text-danger">{notice}</p>}

      {shown.length === 0 ? (
        <p className="text-sm text-muted py-6 text-center">ما في تصاميم بهالنوع بعد.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-start">
          {shown.map((s) => (
            <article key={s.id} className="rounded-card bg-surface border border-line overflow-hidden flex flex-col">
              <button type="button" onClick={() => setOpenId(s.id)} aria-label={`افتح ${s.name}`} className="block w-full text-right cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40">
                {preview(s, true)}
              </button>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold truncate flex-1">{s.name}</h3>
                  {isNewSlide(s) && <span className="shrink-0 rounded-full bg-success/10 text-success text-xs font-bold px-2 py-0.5">جديد</span>}
                  <span className="shrink-0 text-xs text-faint">{s.kind === 'page' ? `صفحة · ${categoryLabel(s.category)}` : categoryLabel(s.category)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <DesignerLine slide={s} total={totals[s.designerUid] || 0} />
                  <VoteButtons slide={s} mine={votes[s.id] || 0} own={!!user && user.uid === s.designerUid} onVote={vote} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={open.name} onClick={() => setOpenId('')}>
          <div className="w-full sm:max-w-4xl max-h-[94vh] overflow-y-auto rounded-t-card sm:rounded-card bg-surface" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-line">
              <div className="min-w-0 space-y-0.5">
                <h3 className="text-heading font-bold truncate">{open.name}</h3>
                <div className="flex items-center gap-2"><DesignerLine slide={open} total={totals[open.designerUid] || 0} /><span className="text-xs text-faint">· {open.kind === 'page' ? `صفحة من ${PAGE_SLIDES} شرائح · ` : ''}{categoryLabel(open.category)}</span></div>
              </div>
              <button type="button" onClick={() => setOpenId('')} aria-label="إغلاق" className="shrink-0 w-9 h-9 rounded-ctl flex items-center justify-center text-muted hover:text-ink hover:bg-bg cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-5">{preview(open)}</div>
            <div className="px-5 pb-5 flex flex-wrap items-center gap-2">
              <VoteButtons slide={open} mine={votes[open.id] || 0} own={!!user && user.uid === open.designerUid} onVote={vote} large />
              <button type="button" disabled title="يفتح الاتصال بالمصمم بعد الدفع: قريباً" className="h-10 px-4 rounded-ctl border border-line text-faint text-sm font-bold inline-flex items-center gap-1.5 cursor-not-allowed"><MessageCircle size={16} /> اتصل بالمصمم · قريباً</button>
              <button type="button" disabled title="نسخ الشريحة لصفحتك بألوانك: قريباً" className="h-10 px-4 rounded-ctl border border-line text-faint text-sm font-bold inline-flex items-center gap-1.5 cursor-not-allowed"><Plus size={16} /> أضف الشريحة لصفحتي مجاناً · قريباً</button>
              <button type="button" onClick={() => { setDesigner({ uid: open.designerUid, name: open.designerName || 'المصمم' }); setKind('all'); setCategory('all'); setOpenId(''); }} className="h-10 px-4 rounded-ctl bg-brand/10 text-brand text-sm font-bold cursor-pointer mr-auto">المزيد من {open.designerName || 'المصمم'}</button>
            </div>
            {notice && <p role="status" className="px-5 pb-4 text-sm font-bold text-danger">{notice}</p>}
          </div>
        </div>
      )}
    </section>
  );
};
