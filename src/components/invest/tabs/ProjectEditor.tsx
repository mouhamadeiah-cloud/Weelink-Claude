// إضافة مشروع: the project entry on one page (the project, the numbers, why invest, photos and how
// it shows on the site), with the project's card beside it as visitors will see it.
import React, { useEffect, useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { InvestAdminData, InvestProject, emptyProject, INVEST_CURRENCIES, INVEST_SECTORS, INVEST_STATUSES, projectRaised } from '../investTypes';
import { Card, Field, inputClass, textareaClass, PrimaryButton, GhostButton, Toggle } from '../../shop/adminUi';
import { CarImages } from '../../cars/tabs/CarImages';
import { ProjectCard, DEFAULT_PROJECT_LOOK } from '../store/ProjectCard';

export interface InvestTabProps {
  data: InvestAdminData;
  update: (fn: (d: InvestAdminData) => InvestAdminData) => void;
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onSaved: () => void;
}

const num = (v: string) => {
  const n = parseFloat(v.replace(/,/g, ''));
  return isFinite(n) && n > 0 ? n : 0;
};

const MoneyInput: React.FC<{ value: number; onChange: (n: number) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
  <input className={inputClass} dir="ltr" inputMode="decimal" value={value ? value.toLocaleString('en-US') : ''} placeholder={placeholder || '0'} onChange={(e) => onChange(num(e.target.value))} />
);

export const ProjectEditor: React.FC<InvestTabProps> = ({ data, update, editingId, onSaved }) => {
  const existing = editingId ? data.projects.find((p) => p.id === editingId) : undefined;
  const [p, setP] = useState<InvestProject>(() => existing || emptyProject(data.settings.currency));
  const [highlight, setHighlight] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setP(existing || emptyProject(data.settings.currency));
    setError('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);
  const set = (changes: Partial<InvestProject>) => setP((prev) => ({ ...prev, ...changes }));

  const addHighlight = () => {
    const h = highlight.trim();
    if (!h) return;
    set({ highlights: [...p.highlights, h] });
    setHighlight('');
  };

  const save = () => {
    if (!p.title.trim()) return setError('اكتب اسم المشروع.');
    setError('');
    const saved = { ...p, title: p.title.trim() };
    update((d) => ({
      ...d,
      projects: d.projects.some((x) => x.id === saved.id) ? d.projects.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...d.projects],
    }));
    onSaved();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
      <div className="space-y-4 min-w-0">
        <Card title="المشروع">
          <Field label="اسم المشروع"><input className={inputClass} value={p.title} placeholder="مثال: مجمّع سكني في ريف دمشق" onChange={(e) => set({ title: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="القطاع">
              <input className={inputClass} list="invest-sectors" value={p.sector} placeholder="اختر أو اكتب" onChange={(e) => set({ sector: e.target.value })} />
              <datalist id="invest-sectors">{INVEST_SECTORS.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="المكان"><input className={inputClass} value={p.location} placeholder="المدينة، المنطقة" onChange={(e) => set({ location: e.target.value })} /></Field>
          </div>
          <Field label="وصف قصير" hint="سطر أو سطران يظهران على بطاقة المشروع">
            <textarea className={`${textareaClass} min-h-[64px]`} value={p.summary} onChange={(e) => set({ summary: e.target.value })} />
          </Field>
          <Field label="تفاصيل المشروع" hint="تظهر في صفحة المشروع: الفكرة، طريقة العمل، كيف تُوزَّع الأرباح">
            <textarea className={`${textareaClass} min-h-[130px]`} value={p.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
        </Card>

        <Card title="الأرقام">
          <Field label="العملة">
            <div className="flex gap-1.5">
              {INVEST_CURRENCIES.map((c) => (
                <button key={c} type="button" onClick={() => set({ currency: c })} className={`h-10 min-w-[56px] px-3 rounded-xl border text-sm font-bold cursor-pointer ${p.currency === c ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-neutral-200 bg-white text-neutral-600'}`}>{c}</button>
              ))}
            </div>
          </Field>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="رأس المال المطلوب"><MoneyInput value={p.target} onChange={(target) => set({ target })} /></Field>
            <Field label="جُمع قبل الموقع" hint="يُضاف إليه ما تسجّله في «المستثمرون»"><MoneyInput value={p.raisedBefore} onChange={(raisedBefore) => set({ raisedBefore })} /></Field>
            <Field label="أقل مشاركة"><MoneyInput value={p.minInvestment} onChange={(minInvestment) => set({ minInvestment })} /></Field>
            <Field label="العائد المتوقع"><input className={inputClass} value={p.expectedReturn} placeholder="مثال: 18% سنويًا" onChange={(e) => set({ expectedReturn: e.target.value })} /></Field>
            <Field label="مدة المشروع"><input className={inputClass} value={p.duration} placeholder="مثال: 24 شهرًا" onChange={(e) => set({ duration: e.target.value })} /></Field>
            <Field label="تاريخ البدء"><input type="date" className={inputClass} value={p.startDate} onChange={(e) => set({ startDate: e.target.value })} /></Field>
          </div>
          <Field label="حالة المشروع">
            <div className="flex flex-wrap gap-1.5">
              {INVEST_STATUSES.map((s) => (
                <button key={s.id} type="button" onClick={() => set({ status: s.id })} className={`h-9 px-3 rounded-xl border text-xs font-bold cursor-pointer ${p.status === s.id ? 'text-white' : 'border-neutral-200 bg-white text-neutral-600'}`} style={p.status === s.id ? { backgroundColor: s.color, borderColor: s.color } : undefined}>{s.label}</button>
              ))}
            </div>
          </Field>
        </Card>

        <Card title="لماذا تستثمر في هذا المشروع؟">
          <div className="flex gap-2">
            <input className={inputClass} value={highlight} placeholder="مثال: أرض مملوكة ومرخّصة" onChange={(e) => setHighlight(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(); } }} />
            <GhostButton onClick={addHighlight} className="h-10 flex items-center gap-1 shrink-0"><Plus size={14} /> إضافة</GhostButton>
          </div>
          {p.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {p.highlights.map((h, i) => (
                <span key={h + i} className="flex items-center gap-1 h-8 pr-3 pl-1.5 rounded-full bg-neutral-100 text-xs font-bold text-neutral-700">
                  {h}
                  <button type="button" onClick={() => set({ highlights: p.highlights.filter((_, k) => k !== i) })} className="w-5 h-5 rounded-full hover:bg-white flex items-center justify-center cursor-pointer" aria-label={`حذف ${h}`}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card title="الصور">
          <CarImages images={p.images} onChange={(images) => set({ images })} />
        </Card>

        <Card title="العرض في الموقع">
          <div className="rounded-xl border border-neutral-200 px-3 py-1.5 space-y-1">
            <Toggle checked={p.published} onChange={(published) => set({ published })} label="يظهر في الموقع" />
            <Toggle checked={p.featured} onChange={(featured) => set({ featured })} label="مشروع مميز (يظهر في الصفحة الرئيسية)" />
          </div>
        </Card>

        {error && <div className="text-xs font-bold text-red-600">{error}</div>}
        <PrimaryButton onClick={save} className="h-11 px-6 flex items-center gap-1.5"><Save size={15} /> {existing ? 'حفظ التعديلات' : 'حفظ المشروع'}</PrimaryButton>
      </div>

      <div className="lg:sticky lg:top-0 space-y-2">
        <div className="text-[11px] font-bold text-neutral-400">هكذا تظهر البطاقة في الموقع</div>
        <ProjectCard project={p} raised={projectRaised(data, p)} look={DEFAULT_PROJECT_LOOK} />
      </div>
    </div>
  );
};
