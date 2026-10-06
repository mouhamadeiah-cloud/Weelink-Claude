// The 'investProjects' canvas element: the company's projects, filled live from the admin window
// (ترس الإدارة ← إضافة مشروع). Clicking a project in preview / on the live site opens its full page
// floating over the site. investLayout picks grid cards or wide rows, investSource which projects
// (all, featured, open for investment, completed), investLimit how many fit on one page, and
// investFilters adds a sector / status bar. On the live page the slide grows to fit its cards (onGrow).
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CanvasElement } from '../../../types';
import { useInvestData } from './InvestDataContext';
import { ProjectCard, ProjectLook, DEFAULT_PROJECT_LOOK } from './ProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { InvestStatus, INVEST_STATUSES, projectRaised } from '../investTypes';

const MAX_PER_PAGE = 30;
const STATUS_ORDER: Record<InvestStatus, number> = { open: 0, funded: 1, running: 2, completed: 3 };

interface ProjectListingsViewProps {
  elem: CanvasElement;
  isPreviewActive: boolean;
  onGrow?: (extra: number) => void;
  boxHeight?: number;
}

export const projectLookOf = (elem: CanvasElement): ProjectLook => ({
  accent: elem.styles.color || DEFAULT_PROJECT_LOOK.accent,
  cardBg: elem.investCardBg || DEFAULT_PROJECT_LOOK.cardBg,
  text: elem.investCardText || DEFAULT_PROJECT_LOOK.text,
  radius: elem.investCardRadius ?? DEFAULT_PROJECT_LOOK.radius,
  font: `${elem.styles.fontFamily ? `${elem.styles.fontFamily}, ` : ''}${DEFAULT_PROJECT_LOOK.font}`,
});

export const ProjectListingsView: React.FC<ProjectListingsViewProps> = ({ elem, isPreviewActive, onGrow, boxHeight }) => {
  const admin = useInvestData();
  const look = projectLookOf(elem);
  const wide = elem.investLayout === 'wide';
  const source = elem.investSource || 'all';
  const [openId, setOpenId] = useState<string | null>(null);
  const [sector, setSector] = useState('');
  const [status, setStatus] = useState<InvestStatus | ''>('');

  const projects = useMemo(() => {
    const list = (admin?.projects || []).filter((p) => {
      if (!p.published) return false;
      if (source === 'completed') return p.status === 'completed';
      if (p.status === 'completed' && !admin?.settings.showCompleted) return false;
      if (source === 'featured') return p.featured;
      if (source === 'open') return p.status === 'open';
      return true;
    });
    return [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [admin, source]);
  const sectors = useMemo(() => [...new Set(projects.map((p) => p.sector).filter(Boolean))], [projects]);
  const statuses = INVEST_STATUSES.filter((s) => projects.some((p) => p.status === s.id));
  const filtered = projects.filter((p) => (!sector || p.sector === sector) && (!status || p.status === status));

  const pageSize = Math.min(MAX_PER_PAGE, elem.investLimit && elem.investLimit > 0 ? elem.investLimit : 9);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const list = filtered.slice(current * pageSize, current * pageSize + pageSize);
  useEffect(() => setPage(0), [sector, status]);

  const showFilters = !!elem.investFilters && projects.length > 0 && (sectors.length > 1 || statuses.length > 1);
  const open = (admin?.projects || []).find((p) => p.id === openId && p.published);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  // Live page: the cards are laid out at their natural height and the slide grows to fit them.
  const grows = isPreviewActive;
  const box = boxHeight ?? elem.height;
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!onGrow) return;
    const node = contentRef.current;
    if (!grows || !node) {
      onGrow(0);
      return;
    }
    const measure = () => onGrow(Math.max(0, Math.ceil(node.offsetHeight - box)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [grows, onGrow, box]);
  useEffect(() => () => onGrow?.(0), [onGrow]);

  const goTo = (n: number) => {
    setPage(n);
    window.requestAnimationFrame(() => {
      const slide = contentRef.current?.closest('[id^="slide-container-"]');
      if (slide && slide.getBoundingClientRect().top < 0) slide.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const selectClass = 'h-10 px-3 rounded-full border border-black/10 bg-white text-sm font-semibold text-[#1d1d1f] outline-none cursor-pointer';
  const emptyText = source === 'featured' ? 'لا توجد مشاريع مميزة بعد' : source === 'open' ? 'لا توجد مشاريع مفتوحة للاستثمار الآن' : source === 'completed' ? 'لا توجد مشاريع منجزة بعد' : 'لا توجد مشاريع معروضة بعد';

  return (
    <div
      dir="rtl"
      className={`w-full h-full ${grows ? '' : 'overflow-hidden'}`}
      style={{ pointerEvents: isPreviewActive ? 'auto' : 'none', fontFamily: look.font }}
      onClick={stop}
    >
      <div ref={contentRef} className="w-full flex flex-col gap-4" style={grows ? { minHeight: box } : { height: '100%' }}>
        {showFilters && (
          <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
            {sectors.length > 1 && (
              <select className={selectClass} value={sector} onChange={(e) => setSector(e.target.value)} aria-label="القطاع">
                <option value="">كل القطاعات</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {statuses.length > 1 && (
              <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as InvestStatus | '')} aria-label="الحالة">
                <option value="">كل الحالات</option>
                {statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            )}
            <span className="text-sm font-bold opacity-60 px-2">{filtered.length} مشروع</span>
          </div>
        )}

        {list.length === 0 ? (
          <div className={`flex-1 flex items-center justify-center gap-2 text-center rounded-3xl border-2 border-dashed border-current/20 px-6 text-[#5a5a5f] ${elem.height < 200 ? 'text-sm' : 'flex-col py-10'}`}>
            <Briefcase size={elem.height < 200 ? 20 : 44} className="opacity-40 shrink-0" />
            <span className="font-bold">{emptyText}</span>
            {elem.height >= 200 && (
              <span className="text-sm opacity-70 max-w-md">
                {source === 'featured' ? 'فعّل «مشروع مميز» عند إدخال المشروع ليظهر هنا.' : 'افتح ترس الإدارة في أسفل الصفحة، ثم «إضافة مشروع»، ليظهر المشروع هنا.'}
              </span>
            )}
          </div>
        ) : (
          <div className={grows ? 'pb-2 pt-2' : 'flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-2 pt-2'}>
            <div className={wide ? 'flex flex-col gap-5 max-w-[980px] mx-auto' : 'flex flex-wrap justify-center items-stretch gap-5'}>
              {list.map((p) => (
                <div key={p.id} title={p.title} className="flex" style={wide ? { minHeight: 220 } : { width: 330, maxWidth: '100%' }}>
                  <ProjectCard project={p} raised={admin ? projectRaised(admin, p) : p.raisedBefore} look={look} wide={wide} onOpen={() => setOpenId(p.id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-3 shrink-0 pb-1">
            <button type="button" aria-label="الصفحة السابقة" disabled={current === 0} onClick={() => goTo(current - 1)} className="w-10 h-10 rounded-full border border-black/10 bg-white flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-default" style={{ color: look.accent }}>
              <ChevronRight size={20} />
            </button>
            <span className="text-sm font-bold">صفحة {current + 1} من {pageCount}</span>
            <button type="button" aria-label="الصفحة التالية" disabled={current >= pageCount - 1} onClick={() => goTo(current + 1)} className="w-10 h-10 rounded-full border border-black/10 bg-white flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-default" style={{ color: look.accent }}>
              <ChevronLeft size={20} />
            </button>
          </div>
        )}
      </div>

      {open && admin && isPreviewActive && (
        <ProjectDetailModal key={open.id} project={open} raised={projectRaised(admin, open)} settings={admin.settings} accent={look.accent} font={look.font} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
};
