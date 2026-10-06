// طلبات الاستثمار: what visitors sent from a project's page («أرغب بالاستثمار»): who, which project
// and how much. From here the company calls them back, marks the request handled and adds the visitor
// to its investors once they agree.
import React, { useState } from 'react';
import { Phone, MessageCircle, Trash2, UserPlus, Info, HandCoins } from 'lucide-react';
import { InvestRequest, InvestRequestStatus, whatsappHref } from '../investTypes';
import { newId } from '../../shop/shopTypes';
import { Card, EmptyState, formatMoney } from '../../shop/adminUi';
import { InvestTabProps } from './ProjectEditor';

export const INVEST_REQUEST_STATUSES: { id: InvestRequestStatus; label: string; color: string }[] = [
  { id: 'new', label: 'جديد', color: '#0071e3' },
  { id: 'contacted', label: 'تم التواصل', color: '#b06f00' },
  { id: 'done', label: 'منتهٍ', color: '#1e7a34' },
];

const when = (v: string) => {
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('ar-SY-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const InvestRequestsTab: React.FC<InvestTabProps> = ({ data, update }) => {
  const [filter, setFilter] = useState<InvestRequestStatus | 'all'>('all');
  const shown = data.requests.filter((r) => filter === 'all' || r.status === filter);
  const currency = (r: InvestRequest) => data.projects.find((p) => p.id === r.projectId)?.currency || data.settings.currency;

  const setRequest = (id: string, changes: Partial<InvestRequest>) => update((d) => ({ ...d, requests: d.requests.map((r) => (r.id === id ? { ...r, ...changes } : r)) }));
  const addInvestor = (r: InvestRequest) =>
    update((d) => {
      const same = d.investors.find((i) => i.phone.replace(/\D/g, '') === r.phone.replace(/\D/g, '') && r.phone.replace(/\D/g, ''));
      const investorId = same?.id || newId('inv');
      const investors = same
        ? d.investors
        : [{ id: investorId, name: r.name, phone: r.phone, notes: `طلب من الموقع: ${r.projectTitle}`, investments: [], createdAt: new Date().toISOString() }, ...d.investors];
      return { ...d, investors, requests: d.requests.map((x) => (x.id === r.id ? { ...x, investorId, status: x.status === 'new' ? 'contacted' : x.status } : x)) };
    });
  const remove = (r: InvestRequest) => {
    if (!window.confirm(`حذف طلب ${r.name}؟`)) return;
    update((d) => ({ ...d, requests: d.requests.filter((x) => x.id !== r.id) }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 flex gap-2 text-[11px] text-[#0b4f9c] leading-relaxed">
        <Info size={15} className="shrink-0 mt-0.5" />
        <span>
          يظهر في صفحة كل مشروع مفتوح زرّ «أرغب بالاستثمار». يُضاف كل طلب هنا وتصلك رسالة واتساب أيضًا.
          حاليًا يصل الطلب إلى هذه القائمة من المعاينة على جهازك؛ أما طلبات زوار الموقع المنشور فتحتاج خدمة النشر في المنصة، وحتى ذلك الحين تصلك عبر واتساب.
        </span>
      </div>

      <Card title={`طلبات الاستثمار (${data.requests.length})`}>
        <div className="flex flex-wrap gap-1">
          {[{ id: 'all' as const, label: 'الكل' }, ...INVEST_REQUEST_STATUSES].map((s) => {
            const count = s.id === 'all' ? data.requests.length : data.requests.filter((r) => r.status === s.id).length;
            return (
              <button key={s.id} type="button" onClick={() => setFilter(s.id)}
                className={`h-9 px-3 rounded-xl text-xs font-bold border cursor-pointer ${filter === s.id ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        {shown.length === 0 ? (
          <EmptyState text={data.requests.length ? 'لا توجد طلبات بهذه الحالة' : 'لا توجد طلبات بعد. تصل هنا عندما يضغط زائر «أرغب بالاستثمار» في صفحة مشروع.'} />
        ) : (
          <div className="grid md:grid-cols-2 gap-2">
            {shown.map((r) => {
              const wa = r.phone.replace(/\D/g, '');
              const investor = data.investors.find((i) => i.id === r.investorId);
              return (
                <div key={r.id} className={`rounded-2xl border p-3 space-y-2 bg-white ${r.status === 'new' ? 'border-[#0071e3]/40' : 'border-neutral-200'}`}>
                  <div className="flex items-start gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-[#0F6B4F]"><HandCoins size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-[#1d1d1f]">{r.name}{r.amount > 0 ? ` · ${formatMoney(r.amount, currency(r))}` : ''}</div>
                      <div className="text-[11px] text-neutral-500 truncate">{r.projectTitle}</div>
                      <div className="text-[10px] text-neutral-400">{when(r.createdAt)}</div>
                    </div>
                    <select value={r.status} onChange={(e) => setRequest(r.id, { status: e.target.value as InvestRequestStatus })} className="h-8 px-2 rounded-lg border border-neutral-200 bg-white text-[11px] font-bold cursor-pointer" aria-label="حالة الطلب">
                      {INVEST_REQUEST_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  {r.message && <p className="text-xs text-neutral-600 bg-neutral-50 rounded-xl p-2 leading-relaxed whitespace-pre-line">{r.message}</p>}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} className="h-8 px-2.5 rounded-lg border border-neutral-200 text-[11px] font-bold flex items-center gap-1 text-neutral-700" dir="ltr"><Phone size={13} /> {r.phone}</a>
                    {wa && <a href={whatsappHref(wa, `مرحبًا ${r.name}، بخصوص طلبك للاستثمار في ${r.projectTitle}`)} target="_blank" rel="noopener noreferrer" className="h-8 px-2.5 rounded-lg bg-[#25d366] text-white text-[11px] font-bold flex items-center gap-1"><MessageCircle size={13} /> واتساب</a>}
                    {investor ? (
                      <span className="h-8 px-2.5 rounded-lg bg-emerald-50 text-[#0F6B4F] text-[11px] font-bold flex items-center">في المستثمرين</span>
                    ) : (
                      <button type="button" onClick={() => addInvestor(r)} className="h-8 px-2.5 rounded-lg border border-neutral-200 text-[11px] font-bold flex items-center gap-1 text-neutral-700 cursor-pointer hover:bg-neutral-50"><UserPlus size={13} /> أضفه إلى المستثمرين</button>
                    )}
                    <button type="button" onClick={() => remove(r)} className="mr-auto w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center cursor-pointer" aria-label="حذف الطلب"><Trash2 size={14} /></button>
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
