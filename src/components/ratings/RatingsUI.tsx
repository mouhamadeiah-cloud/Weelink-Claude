// What visitors see of a page's ratings: the stars under the page's name, the ratings block (the
// «التقييمات» slide), the window with all ratings (average, 5-to-1 bars, sort and filter, the
// owner's replies) and the form to rate with an email code. The page comes from BookingPageContext.
import React, { useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, MessageSquareReply, Star, X } from 'lucide-react';
import { BookingPageContext } from '../../services/bookings';
import { Rating, RatingSummary, ratingErrorText, startRating, useRatingSummary, useRatings, verifyRating } from '../../services/ratings';
import type { CanvasElement } from '../../types';

const fmt1 = (n: number) => n.toLocaleString('ar-SY', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt = (n: number) => n.toLocaleString('ar-SY');
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const ratingDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const Stars: React.FC<{ value: number; size?: number; color?: string; className?: string }> = ({ value, size = 14, color = '#f5a623', className = '' }) => (
  <span className={`inline-flex items-center gap-[1px] ${className}`} dir="ltr" aria-label={`${fmt1(value)} من 5`}>
    {[1, 2, 3, 4, 5].map((i) => {
      const fill = Math.max(0, Math.min(1, value - (i - 1)));
      return (
        <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
          <Star size={size} className="absolute inset-0 text-neutral-300" fill="currentColor" strokeWidth={0} />
          <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
            <Star size={size} style={{ color }} fill="currentColor" strokeWidth={0} />
          </span>
        </span>
      );
    })}
  </span>
);

const Bars: React.FC<{ summary: RatingSummary; active?: number; onPick?: (n: number) => void; accent: string }> = ({ summary, active, onPick, accent }) => (
  <div className="space-y-1 flex-1 min-w-[150px]">
    {[5, 4, 3, 2, 1].map((n) => {
      const c = summary.byStars[n as 1];
      const pct = summary.count ? (c / summary.count) * 100 : 0;
      return (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(active === n ? 0 : n)}
          className={`w-full flex items-center gap-2 text-[11px] font-bold rounded-md px-1 ${onPick ? 'cursor-pointer hover:bg-black/[0.04]' : ''} ${active === n ? 'bg-black/[0.06]' : ''}`}
        >
          <span className="w-3 text-neutral-600">{fmt(n)}</span>
          <span className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden" dir="rtl">
            <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
          </span>
          <span className="w-6 text-left text-neutral-400">{fmt(c)}</span>
        </button>
      );
    })}
  </div>
);

export const RatingItem: React.FC<{ r: Rating; pageName: string; children?: React.ReactNode }> = ({ r, pageName, children }) => (
  <li className="py-3 border-b border-neutral-100 last:border-0 space-y-1.5">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="w-8 h-8 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center text-sm font-black shrink-0">{r.name.charAt(0)}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-black text-[#1d1d1f] truncate">{r.name}</div>
        <div className="flex items-center gap-2"><Stars value={r.stars} size={12} /><span className="text-[10px] text-neutral-400 font-bold">{ratingDate(r.updatedAt || r.createdAt)}</span></div>
      </div>
    </div>
    {r.text && <p className="text-[13px] text-neutral-700 leading-relaxed whitespace-pre-wrap">{r.text}</p>}
    {r.reply?.text && (
      <div className="mr-4 rounded-xl bg-[#f5f5f7] p-2.5 space-y-1">
        <div className="text-[11px] font-black text-[#1d1d1f] flex items-center gap-1"><MessageSquareReply size={12} /> رد {pageName || 'صاحب الصفحة'}</div>
        <p className="text-[12px] text-neutral-700 leading-relaxed whitespace-pre-wrap">{r.reply.text}</p>
      </div>
    )}
    {children}
  </li>
);

const Modal: React.FC<{ onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ onClose, children, wide }) =>
  createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000003] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-3" onMouseDown={onClose}>
      <div
        dir="rtl"
        className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'} max-h-full bg-white rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden text-right font-sans relative`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute top-3 left-3 w-9 h-9 rounded-xl hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer z-10" aria-label="إغلاق">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );

// All the ratings, as Google shows them.
export const RatingsWindow: React.FC<{ onClose: () => void; onRate: () => void; accent?: string }> = ({ onClose, onRate, accent = '#f5a623' }) => {
  const page = useContext(BookingPageContext);
  const summary = useRatingSummary(page?.owner, page?.project);
  const rows = useRatings(page?.owner, page?.project);
  const [sort, setSort] = useState<'new' | 'high' | 'low'>('new');
  const [only, setOnly] = useState(0);
  const list = useMemo(() => {
    const all = Array.isArray(rows) ? rows.filter((r) => !only || r.stars === only) : [];
    if (sort === 'high') return [...all].sort((a, b) => b.stars - a.stars);
    if (sort === 'low') return [...all].sort((a, b) => a.stars - b.stars);
    return all;
  }, [rows, sort, only]);

  return (
    <Modal onClose={onClose} wide>
      <div className="p-5 pb-3 border-b border-neutral-100 space-y-4">
        <div className="text-base font-black text-[#1d1d1f] pl-10">تقييمات {page?.pageName || 'الصفحة'}</div>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="text-center">
            <div className="text-4xl font-black text-[#1d1d1f]">{summary.count ? fmt1(summary.average) : '—'}</div>
            <Stars value={summary.average} size={15} color={accent} />
            <div className="text-[11px] text-neutral-500 font-bold mt-0.5">{fmt(summary.count)} تقييم</div>
          </div>
          <Bars summary={summary} active={only} onPick={setOnly} accent={accent} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {([['new', 'الأحدث'], ['high', 'الأعلى'], ['low', 'الأدنى']] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setSort(id)} className={`h-8 px-3 rounded-full text-xs font-bold border cursor-pointer ${sort === id ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'border-neutral-200 text-neutral-600'}`}>
              {label}
            </button>
          ))}
          {only > 0 && (
            <button type="button" onClick={() => setOnly(0)} className="h-8 px-3 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 cursor-pointer flex items-center gap-1">
              {fmt(only)} نجوم فقط <X size={12} />
            </button>
          )}
          <button type="button" onClick={onRate} className="mr-auto h-8 px-4 rounded-full text-xs font-black text-white cursor-pointer" style={{ backgroundColor: '#0071e3' }}>
            قيّمنا
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5">
        {rows === null ? (
          <Loader2 size={20} className="animate-spin text-neutral-400 my-6 mx-auto" />
        ) : rows === 'error' ? (
          <p className="text-xs text-neutral-500 py-6 text-center">ما قدرنا نقرأ التقييمات هلق.</p>
        ) : list.length === 0 ? (
          <p className="text-xs text-neutral-500 py-6 text-center">{only ? 'ما في تقييمات بهالعدد من النجوم.' : 'ما في تقييمات بعد. كن أول واحد بيقيّم.'}</p>
        ) : (
          <ul>{list.map((r) => <RatingItem key={r.id} r={r} pageName={page?.pageName || ''} />)}</ul>
        )}
      </div>
    </Modal>
  );
};

// Stars, words, name and email; then the code from the email.
export const RateForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const page = useContext(BookingPageContext);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [words, setWords] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'write' | 'code' | 'done'>('write');
  const [id, setId] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const field = 'w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-200 bg-[#f5f5f7] focus:bg-white focus:outline-none focus:border-neutral-400';

  const send = async () => {
    setError('');
    if (!stars) return setError('اختر عدد النجوم.');
    if (!page?.live) return setError('التقييم بيشتغل على صفحتك المنشورة. هون بس معاينة.');
    setBusy(true);
    const out = await startRating({ owner: page.owner, project: page.project, pageName: page.pageName, stars, text: words, name, email });
    setBusy(false);
    if (out.id) {
      setId(out.id);
      setStep('code');
    } else setError(ratingErrorText(out.error, out));
  };
  const confirm = async () => {
    setError('');
    setBusy(true);
    const out = await verifyRating(id, code);
    setBusy(false);
    if (out.ok) setStep('done');
    else setError(ratingErrorText(out.error, out));
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-5 space-y-4 overflow-y-auto">
        <div className="text-base font-black text-[#1d1d1f] pl-10">قيّم {page?.pageName || 'الصفحة'}</div>
        {step === 'write' && (
          <>
            <div className="flex justify-center gap-1" dir="ltr" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onMouseEnter={() => setHover(i)} onClick={() => setStars(i)} className="p-1 cursor-pointer" aria-label={`${i} نجوم`}>
                  <Star size={34} fill="currentColor" strokeWidth={0} className={(hover || stars) >= i ? 'text-[#f5a623]' : 'text-neutral-200'} />
                </button>
              ))}
            </div>
            <textarea className={`${field} resize-none`} rows={3} placeholder="احكِ عن تجربتك (اختياري)" value={words} onChange={(e) => setWords(e.target.value)} maxLength={800} />
            <input className={field} placeholder="اسمك كما بيظهر مع التقييم" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            <input className={`${field} text-left`} dir="ltr" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="text-[11px] text-neutral-500 leading-relaxed">بنبعتلك رمز على إيميلك لنتأكد إنك شخص حقيقي. الإيميل ما بيظهر لحدا، وإذا رد صاحب الصفحة بيوصلك ردّه.</p>
          </>
        )}
        {step === 'code' && (
          <>
            <p className="text-sm text-neutral-600 leading-relaxed">بعتنا رمز من 6 أرقام على <b dir="ltr">{email}</b>. اكتبه هون لينتشر تقييمك.</p>
            <input className={`${field} text-center text-2xl tracking-[0.5em] font-black`} dir="ltr" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
          </>
        )}
        {step === 'done' && (
          <div className="text-center space-y-2 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white text-xl font-black flex items-center justify-center mx-auto">✓</div>
            <div className="text-sm font-black text-[#1d1d1f]">شكراً، انتشر تقييمك.</div>
          </div>
        )}
        {error && <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>}
        {step !== 'done' ? (
          <button
            type="button"
            disabled={busy || (step === 'code' && code.length !== 6)}
            onClick={step === 'write' ? send : confirm}
            className="w-full h-11 rounded-xl bg-[#0071e3] text-white text-sm font-black cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {step === 'write' ? 'ابعت الرمز' : 'انشر التقييم'}
          </button>
        ) : (
          <button type="button" onClick={onClose} className="w-full h-11 rounded-xl bg-[#1d1d1f] text-white text-sm font-black cursor-pointer">تمام</button>
        )}
      </div>
    </Modal>
  );
};

// The window and the form, opened from the stars or from the ratings block.
export const useRatingsDialogs = (accent?: string) => {
  const [open, setOpen] = useState<'list' | 'rate' | null>(null);
  const dialogs =
    open === 'list' ? <RatingsWindow accent={accent} onClose={() => setOpen(null)} onRate={() => setOpen('rate')} />
    : open === 'rate' ? <RateForm onClose={() => setOpen(null)} />
    : null;
  return { openList: () => setOpen('list'), openRate: () => setOpen('rate'), dialogs };
};

// The stars under the page's name in its navbar; nothing until the page has a rating.
export const NavbarStars: React.FC<{ color?: string }> = ({ color }) => {
  const page = useContext(BookingPageContext);
  const summary = useRatingSummary(page?.owner, page?.project);
  const { openList, dialogs } = useRatingsDialogs();
  if (!page || !summary.count) return null;
  return (
    <>
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); openList(); }}
        className="flex items-center gap-1 text-[10.5px] font-bold leading-none cursor-pointer hover:opacity-80"
        style={{ color }}
        title="التقييمات"
      >
        <span>{fmt1(summary.average)}</span>
        <Stars value={summary.average} size={10} />
        <span className="opacity-60">({fmt(summary.count)})</span>
      </button>
      {dialogs}
    </>
  );
};

// The «التقييمات» block on the page: the average, the bars, the latest ratings and the buttons.
export const RatingsWidget: React.FC<{ elem: CanvasElement }> = ({ elem }) => {
  const page = useContext(BookingPageContext);
  const accent = elem.ratingsAccentColor || '#f5a623';
  const summary = useRatingSummary(page?.owner, page?.project);
  const rows = useRatings(page?.owner, page?.project);
  const { openList, openRate, dialogs } = useRatingsDialogs(accent);
  const latest = Array.isArray(rows) ? rows.filter((r) => r.text).slice(0, elem.width >= 700 ? 3 : 2) : [];
  const wide = elem.width >= 700;

  return (
    <div dir="rtl" className="w-full h-full rounded-3xl border border-black/[0.07] p-5 flex flex-col gap-4 overflow-hidden text-right" style={{ backgroundColor: elem.styles.backgroundColor || '#ffffff' }}>
      <div className="flex items-center gap-5 flex-wrap">
        <div className="text-center shrink-0">
          <div className="text-4xl font-black text-[#1d1d1f]">{summary.count ? fmt1(summary.average) : '—'}</div>
          <Stars value={summary.average} size={16} color={accent} />
          <div className="text-[11px] text-neutral-500 font-bold mt-0.5">{summary.count ? `${fmt(summary.count)} تقييم` : 'لا تقييمات بعد'}</div>
        </div>
        <Bars summary={summary} accent={accent} />
        <div className="flex flex-col gap-2 shrink-0">
          <button type="button" onClick={openRate} className="h-10 px-5 rounded-xl text-white text-sm font-black cursor-pointer shadow-sm" style={{ backgroundColor: '#0071e3' }}>قيّمنا</button>
          {summary.count > 0 && <button type="button" onClick={openList} className="h-9 px-4 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] text-xs font-bold cursor-pointer">كل التقييمات</button>}
          {/^https:\/\//i.test(elem.ratingsGoogleUrl || '') && (
            <a href={elem.ratingsGoogleUrl} target="_blank" rel="noreferrer" className="h-9 px-4 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-bold flex items-center justify-center gap-1">
              قيّمنا على جوجل
            </a>
          )}
        </div>
      </div>
      {latest.length > 0 ? (
        <ul className={`grid gap-3 min-h-0 ${wide ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {latest.map((r) => (
            <li key={r.id} className="rounded-2xl bg-[#f5f5f7] p-3 space-y-1.5 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-black text-[#1d1d1f] truncate">{r.name}</span>
                <Stars value={r.stars} size={11} color={accent} />
              </div>
              <p className="text-[12px] text-neutral-600 leading-relaxed line-clamp-3">{r.text}</p>
              {r.reply?.text && <p className="text-[11px] text-neutral-500 line-clamp-1">↩ {r.reply.text}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-neutral-500 leading-relaxed">شاركنا رأيك. تقييمك بيساعد غيرك يعرفنا أكتر.</p>
      )}
      {dialogs}
    </div>
  );
};
