// المشاريع: every project of the company with how far its funding got. From here the owner changes a
// project's status, shows or hides it on the site, marks it as featured, opens it to edit, or deletes it.
import React, { useMemo, useState } from 'react';
import { Pencil, Trash2, Eye, EyeOff, Star, Search, ImageOff, Plus } from 'lucide-react';
import { InvestProject, InvestStatus, INVEST_STATUSES, projectRaised, projectInvestorCount, fundedPercent } from '../investTypes';
import { Card, EmptyState, inputClass, PrimaryButton, formatMoney } from '../../shop/adminUi';
import { matchesSearch } from '../../shop/store/shopSearchStore';
import { InvestTabProps } from './ProjectEditor';

const Stat: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="bg-white border border-neutral-200 rounded-2xl p-3">
    <div className="text-[10px] font-bold text-neutral-400">{label}</div>
    <div className="text-lg font-black" style={{ color }}>{value}</div>
  </div>
);

export const ProjectsTab: React.FC<InvestTabProps> = ({ data, update, onEdit }) => {
  const [filter, setFilter] = useState<InvestStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const currency = data.settings.currency;

  const setProject = (id: string, changes: Partial<InvestProject>) =>
    update((d) => ({ ...d, projects: d.projects.map((p) => (p.id === id ? { ...p, ...changes } : p)) }));
  const remove = (p: InvestProject) => {
    if (!window.confirm(`حذف مشروع «${p.title}» نهائيًا؟ تبقى مشاركات المستثمرين فيه مسجّلة عندهم.`)) return;
    update((d) => ({ ...d, projects: d.projects.filter((x) => x.id !== p.id) }));
  };

  const shown = useMemo(
    () => data.projects.filter((p) => (filter === 'all' || p.status === filter) && matchesSearch([p.title, p.sector, p.location], query)),
    [data.projects, filter, query]
  );
  // Totals in the company's own currency only; projects in other currencies are left out of the sums.
  const same = data.projects.filter((p) => p.currency === currency);
  const totalTarget = same.filter((p) => p.status === 'open').reduce((s, p) => s + p.target, 0);
  const totalRaised = same.reduce((s, p) => s + projectRaised(data, p), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="كل المشاريع" value={String(data.projects.length)} />
        <Stat label="مفتوحة للاستثمار" value={String(data.projects.filter((p) => p.status === 'open').length)} color="#1e7a34" />
        <Stat label="المطلوب في المفتوحة" value={formatMoney(totalTarget, currency)} />
        <Stat label="مجموع ما جُمع" value={formatMoney(totalRaised, currency)} color="#0071e3" />
      </div>

      <Card
        title={`المشاريع (${data.projects.length})`}
        actions={<PrimaryButton onClick={() => onEdit('')} className="h-9 flex items-center gap-1"><Plus size={14} /> إضافة مشروع</PrimaryButton>}
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-neutral-400" />
            <input className={`${inputClass} pr-9`} placeholder="ابحث بالاسم أو القطاع أو المكان..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1">
            {[{ id: 'all' as const, label: 'الكل' }, ...INVEST_STATUSES].map((s) => (
              <button key={s.id} type="button" onClick={() => setFilter(s.id)}
                className={`h-10 px-3 rounded-xl text-xs font-bold border cursor-pointer ${filter === s.id ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <EmptyState text={data.projects.length ? 'لا توجد مشاريع بهذا البحث' : 'لا توجد مشاريع بعد. اضغط «إضافة مشروع».'} />
        ) : (
          <div className="space-y-2">
            {shown.map((p) => {
              const raised = projectRaised(data, p);
              const pct = fundedPercent(raised, p.target);
              const investors = projectInvestorCount(data, p);
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-2.5">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-300">
                    {p.images[0] ? <img src={p.images[0]} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <ImageOff size={20} />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-[#1d1d1f] truncate">{p.title || 'مشروع بلا اسم'}</span>
                      {p.featured && <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />}
                      {!p.published && <span className="text-[10px] font-bold text-neutral-400 shrink-0">(مخفي)</span>}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">{[p.sector, p.location, investors ? `${investors} مستثمر` : ''].filter(Boolean).join(' · ')}</div>
                    {p.target > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden"><div className="h-full bg-[#0F6B4F]" style={{ width: `${pct}%` }} /></div>
                        <span className="text-[10px] font-bold text-neutral-500 shrink-0" dir="ltr">{formatMoney(raised, p.currency)} / {formatMoney(p.target, p.currency)}</span>
                      </div>
                    )}
                  </div>
                  <select
                    value={p.status}
                    onChange={(e) => setProject(p.id, { status: e.target.value as InvestStatus })}
                    className="hidden sm:block h-9 px-2 rounded-xl border border-neutral-200 bg-white text-xs font-bold cursor-pointer"
                    aria-label="حالة المشروع"
                  >
                    {INVEST_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button type="button" onClick={() => setProject(p.id, { featured: !p.featured })} title={p.featured ? 'إلغاء التمييز' : 'تمييز'} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center cursor-pointer text-neutral-500"><Star size={15} className={p.featured ? 'text-amber-500 fill-amber-500' : ''} /></button>
                    <button type="button" onClick={() => setProject(p.id, { published: !p.published })} title={p.published ? 'إخفاء من الموقع' : 'إظهار في الموقع'} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center cursor-pointer text-neutral-500">{p.published ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                    <button type="button" onClick={() => onEdit(p.id)} title="تعديل" className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center cursor-pointer text-neutral-500"><Pencil size={15} /></button>
                    <button type="button" onClick={() => remove(p)} title="حذف" className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center cursor-pointer text-red-500"><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
