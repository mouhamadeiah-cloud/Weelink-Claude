// The free page's admin (Eyad, 13 Oct): every page has one now, opened from «الإدارة» in the page's
// navbar while its owner looks at it, or from «إدارة» in the editor's column. It lists the page's
// appointments and its team («فريق العمل»). It shows how many people opened the published page and how
// many tapped its WhatsApp, call or email links, the services that can be added, and the way back
// to the editor («تعديل الصفحة»).
import React, { useContext, useEffect, useState } from 'react';
import { BarChart3, CalendarDays, Globe2, Loader2, MessageCircle, PencilLine, Sparkles, Star, Users, X } from 'lucide-react';
import { DayStats, readStats } from '../../services/siteStats';
import type { ProjectKey } from '../../utils/projectKeys';
import { BookingsSection } from './BookingsSection';
import { PageCustomersList } from '../customers/PageCustomersList';
import { InquiriesSection } from './InquiriesSection';
import { RatingsSection } from './RatingsSection';
import { watchBookings } from '../../services/bookings';
import { ServicesSection } from './ServicesSection';
import { TeamSection } from './TeamSection';
import { BookingSettingsSection } from './BookingSettingsSection';
import { PageAccountsSection } from './PageAccountsSection';
import { BookingSettingsFocusContext } from '../../services/bookingSettings';
import type { PageAdminData } from './pageServices';
import { AdminIntroButton } from '../introVideos/AdminIntroButton';

interface PageAdminPanelProps {
  open: boolean;
  onClose: () => void;
  owner: string;
  project: ProjectKey;
  pageName: string;
  published: boolean;
  // Bookings and accounts belong to the packages above the free page (src/utils/planLimits.ts).
  bookingsOn?: boolean;
  // The page's services as items («خدماتي»); left out where the panel has no store for them.
  pageAdmin?: PageAdminData;
  onPageAdmin?: (fn: (d: PageAdminData) => PageAdminData) => void;
  // «تعديل الصفحة»: when the admin was opened from the page's navbar; the editor's own door leaves it out.
  onEditPage?: () => void;
  onPublish?: () => void;
  // Where the numbers and the bookings come from (Firebase).
  loadStats?: typeof readStats;
  watchBookings?: typeof watchBookings;
}

const sum = (rows: DayStats[], key: 'visits' | 'contacts', last: number) => rows.slice(-last).reduce((n, r) => n + r[key], 0);
const fmt = (n: number) => n.toLocaleString('ar-SY');

// Services the page can grow with.
const SERVICES = [
  { icon: CalendarDays, title: 'حجز المواعيد', line: 'أضف «حجز مواعيد» من «إضافة»: زبائنك بيحجزوا من صفحتك، وبيوصل إلك وإلهم إيميل وتذكير قبل الموعد بيوم.', soon: false },
  { icon: Star, title: 'التقييمات', line: 'نجوم تحت اسمك بأول الصفحة، وتقييمات زبائنك مع ردودك عليها.', soon: false },
  { icon: Globe2, title: 'دومين خاص', line: 'صفحتك على اسمك أنت بدل رابط Weelink، من نافذة «نشر».', soon: false },
];

export const PageAdminPanel: React.FC<PageAdminPanelProps> = ({ open, onClose, owner, project, pageName, published, bookingsOn = true, pageAdmin, onPageAdmin, onEditPage, onPublish, loadStats = readStats, watchBookings: watch }) => {
  const [stats, setStats] = useState<DayStats[] | null | 'error'>(null);
  const bookingFocus = useContext(BookingSettingsFocusContext);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setStats(null);
    loadStats(owner, project, 30)
      .then((rows) => alive && setStats(rows))
      .catch(() => alive && setStats('error'));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, owner, project]);

  if (!open) return null;
  const rows = Array.isArray(stats) ? stats : [];
  const max = Math.max(1, ...rows.map((r) => r.visits));

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000001] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-6" onMouseDown={onClose}>
      <div dir="rtl" className="w-full max-w-4xl max-h-full bg-bg rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden text-right font-sans" onMouseDown={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-3 px-4 sm:px-6 h-16 bg-white border-b border-neutral-200 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center"><BarChart3 size={18} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-ink truncate">إدارة الصفحة{pageName ? ` · ${pageName}` : ''}</div>
            <div className="text-xs text-neutral-400 font-bold">Weelink</div>
          </div>
          {onEditPage && (
            <button type="button" onClick={() => { onClose(); onEditPage(); }} className="h-9 px-3 rounded-xl bg-ink text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <PencilLine size={14} /> تعديل الصفحة
            </button>
          )}
          <AdminIntroButton kind="page" />
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer" aria-label="إغلاق">
            <X size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          {!published && (
            <div className="rounded-2xl bg-[#fff8e6] border border-[#f5d48a] p-4 flex flex-wrap items-center gap-3 text-xs font-bold text-[#7a5a00]">
              <span className="flex-1 min-w-[200px]">صفحتك لسا مش منشورة. الزوار والتواصل بيبلشوا ينعدّوا من بعد ما تنشرها.</span>
              {onPublish && <button type="button" onClick={() => { onClose(); onPublish(); }} className="h-9 px-4 rounded-xl bg-ink text-white cursor-pointer">نشر الصفحة</button>}
            </div>
          )}

          {pageAdmin && onPageAdmin && <ServicesSection data={pageAdmin} onChange={onPageAdmin} />}

          {bookingsOn ? (
            <>
              <BookingsSection owner={owner} project={project} watch={watch} />

              <BookingSettingsSection owner={owner} project={project} focus={bookingFocus} />

              <PageAccountsSection owner={owner} project={project} pageName={pageName} />
            </>
          ) : (
            <section className="rounded-2xl bg-white border border-neutral-200 p-4 text-xs font-bold text-neutral-600 leading-relaxed">
              الحجوزات والحسابات متوفرة بباقة برو. رقّي باقتك من «نشر» أو من «حسابي».
            </section>
          )}

          <TeamSection owner={owner} asSection />

          <InquiriesSection owner={owner} project={project} />

          <PageCustomersList ownerUid={owner} isOwner />

          <RatingsSection owner={owner} project={project} pageName={pageName} />

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { key: 'visits', title: 'الزوار', icon: Users },
              { key: 'contacts', title: 'التواصل (واتساب، اتصال، إيميل)', icon: MessageCircle },
            ] as const).map((c) => (
              <div key={c.key} className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-500"><c.icon size={15} /> {c.title}</div>
                {stats === null ? (
                  <Loader2 size={20} className="animate-spin text-neutral-400" />
                ) : stats === 'error' ? (
                  <div className="text-xs text-neutral-500">ما قدرنا نقرأ الأرقام هلق. جرّب بعد شوي.</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[['اليوم', 1], ['آخر 7 أيام', 7], ['آخر 30 يوم', 30]].map(([label, n]) => (
                      <div key={label as string} className="rounded-xl bg-bg py-2.5">
                        <div className="text-xl font-black text-ink">{fmt(sum(rows, c.key, n as number))}</div>
                        <div className="text-xs font-bold text-neutral-500">{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>

          {rows.length > 0 && (
            <section className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-3">
              <div className="text-xs font-bold text-neutral-500">الزوار بآخر 30 يوم</div>
              <div className="h-28 flex items-end gap-[3px]" dir="ltr">
                {rows.map((r) => (
                  <div key={r.day} title={`${r.day}: ${r.visits}`} className="flex-1 rounded-t bg-brand" style={{ height: `${Math.max(2, (r.visits / max) * 100)}%`, opacity: r.visits ? 1 : 0.15 }} />
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-500"><Sparkles size={15} /> خدمات بتقدر تضيفها لصفحتك</div>
            <ul className="grid sm:grid-cols-3 gap-2">
              {SERVICES.map((s) => (
                <li key={s.title} className="rounded-xl bg-bg p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-black text-ink">
                    <s.icon size={16} className="text-brand" /> {s.title}
                    {s.soon && <span className="mr-auto text-xs font-bold text-brand bg-white rounded-full px-2 py-0.5">قريباً</span>}
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-600">{s.line}</p>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
};
