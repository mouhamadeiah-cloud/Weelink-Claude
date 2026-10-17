// The page's ratings in its admin: the average, every rating with the owner's reply (one per rating,
// it can be changed; the rater gets an email the first time), and «إبلاغ» to tell Weelink about a
// rating that breaks the rules. A rating can't be deleted from here.
import React, { useContext, useState } from 'react';
import { Flag, Loader2, MessageSquareReply, Plus, Star } from 'lucide-react';
import { Rating, RatingsSlideContext, replyToRating, reportRating, useRatingSummary, useRatings } from '../../services/ratings';
import { RatingItem, Stars } from '../ratings/RatingsUI';
import type { ProjectKey } from '../../utils/projectKeys';

const fmt1 = (n: number) => n.toLocaleString('ar-SY', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const RatingActions: React.FC<{ owner: string; r: Rating; reply: typeof replyToRating; report: typeof reportRating }> = ({ owner, r, reply, report }) => {
  const [mode, setMode] = useState<'' | 'reply' | 'report'>('');
  const [words, setWords] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setBusy(true);
    setError('');
    const out = await (mode === 'reply' ? reply : report)(owner, r.id, words);
    setBusy(false);
    if (out?.error) setError('ما زبط. تأكد من الإنترنت وجرّب مرة ثانية.');
    else setMode('');
  };

  if (!mode) {
    return (
      <div className="flex gap-1.5 pt-1">
        <button type="button" onClick={() => { setWords(r.reply?.text || ''); setMode('reply'); }} className="h-8 px-3 rounded-lg bg-brand/10 text-brand text-xs font-bold flex items-center gap-1 cursor-pointer">
          <MessageSquareReply size={13} /> {r.reply?.text ? 'تعديل الرد' : 'رد'}
        </button>
        {r.reported ? (
          <span className="h-8 px-3 rounded-lg bg-neutral-100 text-neutral-500 text-xs font-bold flex items-center gap-1"><Flag size={13} /> وصل إبلاغك</span>
        ) : (
          <button type="button" onClick={() => { setWords(''); setMode('report'); }} className="h-8 px-3 rounded-lg bg-neutral-100 text-neutral-600 text-xs font-bold flex items-center gap-1 cursor-pointer">
            <Flag size={13} /> إبلاغ
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-2 pt-1">
      <textarea
        value={words}
        onChange={(e) => setWords(e.target.value)}
        rows={2}
        maxLength={800}
        autoFocus
        placeholder={mode === 'reply' ? 'اكتب ردّك. بيظهر تحت التقييم، وبيوصل لصاحبه بالإيميل.' : 'ليش هذا التقييم مخالف؟ (مسيء، كاذب، مش زبون...) فريق Weelink بيراجعه.'}
        className="w-full text-sm px-3 py-2 rounded-xl border border-neutral-200 bg-bg focus:bg-white focus:outline-none focus:border-neutral-400 resize-none"
      />
      {error && <div className="text-xs font-bold text-red-600">{error}</div>}
      <div className="flex gap-1.5">
        <button type="button" disabled={busy || (mode === 'report' && !words.trim())} onClick={save} className="h-8 px-3 rounded-lg bg-ink text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50">
          {busy && <Loader2 size={13} className="animate-spin" />}
          {mode === 'reply' ? (words.trim() ? 'نشر الرد' : 'حذف الرد') : 'إرسال الإبلاغ'}
        </button>
        <button type="button" onClick={() => setMode('')} className="h-8 px-3 rounded-lg text-neutral-500 text-xs font-bold cursor-pointer">إلغاء</button>
      </div>
    </div>
  );
};

interface RatingsSectionProps {
  owner: string;
  project: ProjectKey;
  pageName: string;
  // Where the ratings come from and go to (Firebase and /api/rating).
  reply?: typeof replyToRating;
  report?: typeof reportRating;
}

export const RatingsSection: React.FC<RatingsSectionProps> = ({ owner, project, pageName, reply = replyToRating, report = reportRating }) => {
  const summary = useRatingSummary(owner, project);
  const rows = useRatings(owner, project);
  const slide = useContext(RatingsSlideContext);
  const unanswered = Array.isArray(rows) ? rows.filter((r) => !r.reply?.text).length : 0;

  return (
    <section className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 ml-auto"><Star size={15} /> التقييمات</div>
        {summary.count > 0 && (
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            {fmt1(summary.average)} <Stars value={summary.average} size={13} />
            <span className="text-xs font-bold text-neutral-400">({summary.count.toLocaleString('ar-SY')})</span>
          </div>
        )}
        {unanswered > 0 && <span className="text-xs font-bold text-brand bg-brand/10 rounded-full px-2 py-0.5">{unanswered.toLocaleString('ar-SY')} بدون رد</span>}
      </div>

      {slide && !slide.has && (
        <div className="rounded-xl bg-[#fff8e6] border border-[#f5d48a] p-3 flex flex-wrap items-center gap-3 text-xs font-bold text-[#7a5a00]">
          <span className="flex-1 min-w-[200px]">صفحتك ما فيها شريحة التقييمات. زبائنك ما بيقدروا يقيّموك بدونها.</span>
          <button type="button" onClick={slide.add} className="h-9 px-3 rounded-xl bg-ink text-white flex items-center gap-1 cursor-pointer"><Plus size={14} /> أضف شريحة التقييمات</button>
        </div>
      )}

      {rows === null ? (
        <Loader2 size={20} className="animate-spin text-neutral-400" />
      ) : rows === 'error' ? (
        <div className="text-xs text-neutral-500">ما قدرنا نقرأ التقييمات هلق. جرّب بعد شوي.</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl bg-bg p-4 text-xs text-neutral-500 leading-relaxed">ما في تقييمات بعد. بس يقيّمك حدا بيوصلك إيميل، وفيك ترد عليه من هون.</div>
      ) : (
        <ul className="max-h-[420px] overflow-y-auto">
          {rows.map((r) => (
            <RatingItem key={r.id} r={r} pageName={pageName}>
              <RatingActions owner={owner} r={r} reply={reply} report={report} />
            </RatingItem>
          ))}
        </ul>
      )}
    </section>
  );
};
