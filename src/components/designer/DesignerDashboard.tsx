// «لوحة المصمم»: the designer's own numbers (Eyad, 14 Oct): what they earn from hired work (still in the
// order, waiting for the office's transfer, or paid out), their orders, their average rating and how far
// they are from the «معتمد من Weelink» badge, and their slides in the gallery with their status, likes
// and uses. Everything is read from the designer's own orders and slides.
import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { BadgeCheck, Heart, Loader2, Star, X } from 'lucide-react';
import { db } from '../../services/firebase';
import { readDesignerStats, type DesignerPublic } from '../../services/designers';
import { subscribeMyOrders, type DesignOrder } from '../../services/designOrders';
import { BADGE } from '../../data/designerBadge';
import { categoryLabel } from '../../data/slideCategories';
import { formatPounds } from '../../data/plans';

interface MySlide { id: string; name: string; kind: string; category: string; status: string; reason: string; likes: number; dislikes: number; uses: number }

const SLIDE_STATUS: Record<string, string> = { pending: 'بانتظار المراجعة', approved: 'ظاهر في المعرض', rejected: 'مرفوض', ready: 'معتمدة للذكاء الاصطناعي' };

const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-card border border-line bg-surface p-3">
    <div className="text-xs text-muted">{label}</div>
    <div className="text-heading font-bold tabular-nums mt-0.5">{value}</div>
    {hint && <div className="text-[11px] text-faint mt-0.5">{hint}</div>}
  </div>
);

export const DesignerDashboard: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const [orders, setOrders] = useState<DesignOrder[] | null>(null);
  const [slides, setSlides] = useState<MySlide[] | null>(null);
  const [stats, setStats] = useState<DesignerPublic | null>(null);

  useEffect(() => subscribeMyOrders(user.uid, (_c, asDesigner) => setOrders(asDesigner)), [user.uid]);
  useEffect(() => {
    let alive = true;
    readDesignerStats(user.uid).then((s) => alive && setStats(s));
    getDocs(query(collection(db, 'gallerySlides'), where('designerUid', '==', user.uid)))
      .then((snap) => alive && setSlides(snap.docs.map((d) => {
        const x: any = d.data();
        return { id: d.id, name: String(x.name || ''), kind: x.kind === 'page' ? 'page' : 'slide', category: String(x.category || ''), status: String(x.status || 'pending'), reason: String(x.reason || ''), likes: Number(x.likes) || 0, dislikes: Number(x.dislikes) || 0, uses: Number(x.uses) || 0 };
      }).sort((a, b) => b.likes - a.likes)))
      .catch(() => alive && setSlides([]));
    return () => {
      alive = false;
    };
  }, [user.uid]);

  const money = useMemo(() => {
    const sum = (list: DesignOrder['status'][]) => (orders || []).filter((o) => list.includes(o.status)).reduce((t, o) => t + o.designerShare, 0);
    return { working: sum(['paid', 'delivered']), waiting: sum(['confirmed']), paidOut: sum(['paid_out']) };
  }, [orders]);
  const count = (list: DesignOrder['status'][]) => (orders || []).filter((o) => list.includes(o.status)).length;
  const totalLikes = (slides || []).filter((s) => s.status === 'approved').reduce((t, s) => t + s.likes, 0);

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl" role="dialog" aria-modal="true" aria-label="لوحة المصمم" onClick={onClose}>
      <div className="w-full sm:max-w-3xl max-h-[94vh] overflow-y-auto rounded-t-card sm:rounded-card bg-surface border border-line" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line sticky top-0 bg-surface z-10">
          <h2 className="text-heading font-bold">لوحة المصمم</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-ctl flex items-center justify-center text-muted hover:text-ink hover:bg-bg cursor-pointer"><X size={18} /></button>
        </div>
        {orders === null || slides === null || !stats ? (
          <div className="flex justify-center py-12 text-faint"><Loader2 size={20} className="animate-spin" /></div>
        ) : (
          <div className="p-5 space-y-6">
            <section className="space-y-2">
              <h3 className="font-bold">الأرباح</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Stat label="قيد العمل" value={formatPounds(money.working)} hint="طلبات مدفوعة لم يؤكدها الزبون بعد" />
                <Stat label="بانتظار تحويل المكتب" value={formatPounds(money.waiting)} hint="الزبون أكّد الاستلام" />
                <Stat label="تم تحويله لك" value={formatPounds(money.paidOut)} />
              </div>
              <p className="text-xs text-faint">المبالغ بعد حصة المنصة.</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold">الطلبات والتقييم</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat label="طلبات جارية" value={count(['awaiting_payment', 'paid', 'delivered'])} />
                <Stat label="طلبات مكتملة" value={stats.completed} />
                <Stat label="متوسط التقييم" value={stats.ratingCount ? <span className="inline-flex items-center gap-1 text-warn"><Star size={16} className="fill-current" />{stats.average.toFixed(1)}</span> : '—'} hint={`${stats.ratingCount} تقييم`} />
                <Stat label="إعجابات تصميماتك" value={<span className="inline-flex items-center gap-1"><Heart size={15} className="fill-current text-brand" />{totalLikes}</span>} />
              </div>
              <div className={`rounded-card border p-3 text-sm leading-relaxed ${stats.verified ? 'border-success/40 bg-success/5' : 'border-line bg-bg'}`}>
                {stats.verified ? (
                  <p className="font-bold text-success inline-flex items-center gap-1.5"><BadgeCheck size={16} /> أنت «معتمد من Weelink»: تظهر شارتك بجانب اسمك في المعرض.</p>
                ) : (
                  <>
                    <p className="font-bold inline-flex items-center gap-1.5"><BadgeCheck size={16} className="text-muted" /> شارة «معتمد من Weelink»</p>
                    <ul className="mt-1 text-muted space-y-0.5 list-disc pr-5">
                      <li>طلبات ناجحة: <b className="tabular-nums">{Math.min(stats.completed, BADGE.minCompleted)}/{BADGE.minCompleted}</b></li>
                      <li>تقييمات: <b className="tabular-nums">{Math.min(stats.ratingCount, BADGE.minRatings)}/{BADGE.minRatings}</b></li>
                      <li>المتوسط {BADGE.minAverage} أو أكثر{stats.ratingCount ? <> (متوسطك {stats.average.toFixed(1)})</> : null}</li>
                    </ul>
                    <p className="text-xs text-faint mt-1">تُسحب الشارة تلقائياً إن نزل المتوسط عن {BADGE.minAverage}.</p>
                  </>
                )}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold">تصميماتك في المعرض</h3>
              {slides.length === 0 ? (
                <p className="text-sm text-muted">لم تصدّر شيئاً للمعرض بعد.</p>
              ) : (
                <ul className="space-y-2">
                  {slides.map((s) => (
                    <li key={s.id} className="rounded-card border border-line p-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm truncate">{s.name || 'بلا اسم'} <span className="text-xs text-faint font-normal">· {s.kind === 'page' ? 'صفحة' : 'شريحة'} · {categoryLabel(s.category)}</span></div>
                        {s.status === 'rejected' && s.reason && <div className="text-xs text-danger mt-0.5">سبب الرفض: {s.reason}</div>}
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.status === 'approved' || s.status === 'ready' ? 'bg-success/10 text-success' : s.status === 'rejected' ? 'bg-danger/10 text-danger' : 'bg-warn/10 text-warn'}`}>{SLIDE_STATUS[s.status] || s.status}</span>
                      {s.status === 'approved' && <span className="text-xs text-muted tabular-nums">👍 {s.likes} · 👎 {s.dislikes} · أُضيفت {s.uses} مرة</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
