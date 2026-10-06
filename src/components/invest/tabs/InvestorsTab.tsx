// المستثمرون: the company's investors and what each put into which project. Every recorded
// investment counts toward the project's funding bar on the site, and its share of the project
// (amount of the capital needed) is shown beside it.
import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Phone, UserPlus, Search } from 'lucide-react';
import { Investor, InvestmentEntry } from '../investTypes';
import { newId } from '../../shop/shopTypes';
import { Card, EmptyState, Field, inputClass, PrimaryButton, GhostButton, formatMoney, formatDate } from '../../shop/adminUi';
import { matchesSearch } from '../../shop/store/shopSearchStore';
import { InvestTabProps } from './ProjectEditor';

const today = () => new Date().toISOString().slice(0, 10);
const num = (v: string) => {
  const n = parseFloat(v.replace(/,/g, ''));
  return isFinite(n) && n > 0 ? n : 0;
};

// Starts on the project and amount of the investor's request from the site, when there is one.
const EntryForm: React.FC<{ projects: InvestTabProps['data']['projects']; initial?: { projectId: string; amount: number }; onAdd: (e: InvestmentEntry) => void }> = ({ projects, initial, onAdd }) => {
  const [projectId, setProjectId] = useState(projects.some((p) => p.id === initial?.projectId) ? initial!.projectId : projects[0]?.id || '');
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const add = () => {
    if (!projectId || num(amount) <= 0) return;
    onAdd({ id: newId('ent'), projectId, amount: num(amount), date, note: note.trim() });
    setAmount('');
    setNote('');
  };
  if (!projects.length) return <p className="text-[11px] text-neutral-400">أضف مشروعًا أولًا لتسجّل فيه مشاركة.</p>;
  return (
    <div className="grid sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-2 items-end">
      <Field label="المشروع">
        <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title || 'مشروع بلا اسم'}</option>)}
        </select>
      </Field>
      <Field label="المبلغ"><input className={inputClass} dir="ltr" inputMode="decimal" value={amount} placeholder="0" onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="التاريخ"><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <PrimaryButton onClick={add} className="flex items-center gap-1"><Plus size={14} /> تسجيل</PrimaryButton>
      <input className={`${inputClass} sm:col-span-4`} value={note} placeholder="ملاحظة (اختياري): رقم العقد، طريقة الدفع..." onChange={(e) => setNote(e.target.value)} />
    </div>
  );
};

export const InvestorsTab: React.FC<InvestTabProps> = ({ data, update }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', phone: '', notes: '' });
  const [query, setQuery] = useState('');

  const setInvestor = (id: string, fn: (i: Investor) => Investor) => update((d) => ({ ...d, investors: d.investors.map((i) => (i.id === id ? fn(i) : i)) }));
  const addInvestor = () => {
    if (!draft.name.trim()) return;
    const id = newId('inv');
    update((d) => ({ ...d, investors: [{ id, name: draft.name.trim(), phone: draft.phone.trim(), notes: draft.notes.trim(), investments: [], createdAt: new Date().toISOString() }, ...d.investors] }));
    setDraft({ name: '', phone: '', notes: '' });
    setAdding(false);
    setOpenId(id);
  };
  const remove = (inv: Investor) => {
    if (!window.confirm(`حذف ${inv.name} وكل مشاركاته؟ تنقص مشاركاته من تمويل المشاريع.`)) return;
    update((d) => ({ ...d, investors: d.investors.filter((i) => i.id !== inv.id) }));
  };
  const projectOf = (id: string) => data.projects.find((p) => p.id === id);
  const shown = data.investors.filter((i) => matchesSearch([i.name, i.phone, i.notes], query));

  return (
    <div className="space-y-4">
      <Card
        title={`المستثمرون (${data.investors.length})`}
        actions={<PrimaryButton onClick={() => setAdding((v) => !v)} className="h-9 flex items-center gap-1"><UserPlus size={14} /> مستثمر جديد</PrimaryButton>}
      >
        {adding && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label="الاسم"><input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="الهاتف"><input className={inputClass} dir="ltr" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
            </div>
            <input className={inputClass} value={draft.notes} placeholder="ملاحظات (اختياري)" onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            <div className="flex gap-2">
              <PrimaryButton onClick={addInvestor} disabled={!draft.name.trim()}>إضافة</PrimaryButton>
              <GhostButton onClick={() => setAdding(false)} className="h-10">إلغاء</GhostButton>
            </div>
          </div>
        )}

        {data.investors.length > 3 && (
          <div className="relative">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-neutral-400" />
            <input className={`${inputClass} pr-9`} placeholder="ابحث بالاسم أو الهاتف..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        )}

        {shown.length === 0 ? (
          <EmptyState text={data.investors.length ? 'لا يوجد مستثمر بهذا البحث' : 'لا يوجد مستثمرون بعد. أضف مستثمرًا وسجّل مشاركاته، أو أضفه من «طلبات الاستثمار».'} />
        ) : (
          <div className="space-y-2">
            {shown.map((inv) => {
              const open = openId === inv.id;
              const byCurrency = inv.investments.reduce<Record<string, number>>((acc, e) => {
                const c = projectOf(e.projectId)?.currency || data.settings.currency;
                acc[c] = (acc[c] || 0) + e.amount;
                return acc;
              }, {});
              const request = inv.investments.length ? undefined : data.requests.find((r) => r.investorId === inv.id);
              const total = Object.entries(byCurrency).map(([c, a]) => formatMoney(a, c)).join(' + ');
              return (
                <div key={inv.id} className="rounded-2xl border border-neutral-200 bg-white">
                  <button type="button" onClick={() => setOpenId(open ? null : inv.id)} className="w-full flex items-center gap-3 p-3 text-right cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#0F6B4F] flex items-center justify-center text-sm font-black shrink-0">{inv.name.trim().charAt(0) || '؟'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-[#1d1d1f] truncate">{inv.name}</div>
                      <div className="text-[11px] text-neutral-500 truncate">{inv.investments.length} مشاركة{total ? ` · ${total}` : ''}</div>
                    </div>
                    {open ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
                  </button>
                  {open && (
                    <div className="border-t border-neutral-100 p-3 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {inv.phone && <a href={`tel:${inv.phone.replace(/[^\d+]/g, '')}`} className="h-8 px-2.5 rounded-lg border border-neutral-200 font-bold flex items-center gap-1 text-neutral-700" dir="ltr"><Phone size={13} /> {inv.phone}</a>}
                        {inv.notes && <span className="text-neutral-500">{inv.notes}</span>}
                        <button type="button" onClick={() => remove(inv)} className="mr-auto h-8 px-2.5 rounded-lg hover:bg-red-50 text-red-500 font-bold flex items-center gap-1 cursor-pointer"><Trash2 size={13} /> حذف المستثمر</button>
                      </div>
                      {inv.investments.length > 0 && (
                        <div className="rounded-xl border border-neutral-100 overflow-hidden">
                          {inv.investments.map((e, k) => {
                            const p = projectOf(e.projectId);
                            const share = p && p.target > 0 ? Math.round((e.amount / p.target) * 1000) / 10 : 0;
                            return (
                              <div key={e.id} className={`flex items-center gap-2 px-3 h-11 text-xs ${k % 2 ? 'bg-white' : 'bg-neutral-50'}`}>
                                <span className="flex-1 min-w-0 truncate font-bold">{p?.title || 'مشروع محذوف'}{e.note ? <span className="font-normal text-neutral-400"> · {e.note}</span> : null}</span>
                                <span className="text-neutral-400 shrink-0">{formatDate(e.date)}</span>
                                {share > 0 && <span className="text-[#0F6B4F] font-bold shrink-0">{share}%</span>}
                                <span className="font-black shrink-0" dir="ltr">{formatMoney(e.amount, p?.currency || data.settings.currency)}</span>
                                <button type="button" onClick={() => setInvestor(inv.id, (i) => ({ ...i, investments: i.investments.filter((x) => x.id !== e.id) }))} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center cursor-pointer shrink-0" aria-label="حذف المشاركة"><Trash2 size={13} /></button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="text-[11px] font-bold text-neutral-600">تسجيل مشاركة</div>
                      <EntryForm projects={data.projects} initial={request ? { projectId: request.projectId, amount: request.amount } : undefined} onAdd={(e) => setInvestor(inv.id, (i) => ({ ...i, investments: [...i.investments, e] }))} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
