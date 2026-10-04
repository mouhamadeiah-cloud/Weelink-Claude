// الأوراق والعقود: every sale contract, test drive form and handover record the showroom saved, with
// a new one started from here for any car, and each opened, printed or deleted.
import React, { useMemo, useState } from 'react';
import { Plus, Search, Printer, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { CarDocType, CAR_DOC_TYPES } from '../carTypes';
import { carTitle } from '../carModel';
import { docTypeLabel, isSigned, printDoc } from '../carDocs';
import { Card, EmptyState, Field, inputClass, PrimaryButton, GhostButton, formatDate } from '../../shop/adminUi';
import { matchesSearch } from '../../shop/store/shopSearchStore';
import { CarTabProps } from './CarEditor';

export const CarDocumentsTab: React.FC<CarTabProps> = ({ data, update, onNewDocument, onOpenDocument }) => {
  const [type, setType] = useState<CarDocType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [starting, setStarting] = useState<{ type: CarDocType; carId: string; customerId: string } | null>(null);

  const carOf = (id: string) => data.cars.find((c) => c.id === id);
  const customerOf = (id: string) => data.customers.find((c) => c.id === id);

  const shown = useMemo(
    () =>
      data.documents
        .filter((d) => type === 'all' || d.type === type)
        .filter((d) => {
          const car = carOf(d.carId);
          return matchesSearch([d.number, car ? carTitle(car) : '', car?.stockNumber || '', customerOf(d.customerId)?.name || '', ...Object.values(d.fields)], query);
        })
        .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.documents, data.cars, data.customers, type, query]
  );

  const start = () => {
    if (!starting?.carId) return;
    onNewDocument?.(starting.type, starting.carId, starting.customerId);
    setStarting(null);
  };

  const remove = (id: string, label: string) => {
    if (!window.confirm(`حذف ${label}؟`)) return;
    update((d) => ({ ...d, documents: d.documents.filter((x) => x.id !== id) }));
  };

  return (
    <div className="space-y-4">
      {starting && (
        <Card title="ورقة جديدة">
          <div className="flex flex-wrap gap-1.5">
            {CAR_DOC_TYPES.map((t) => (
              <button key={t.id} type="button" onClick={() => setStarting({ ...starting, type: t.id })}
                className={`h-10 px-3 rounded-xl text-xs font-bold border cursor-pointer ${starting.type === t.id ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="السيارة">
              <select className={inputClass} value={starting.carId} onChange={(e) => {
                const car = carOf(e.target.value);
                setStarting({ ...starting, carId: e.target.value, customerId: car?.sale?.customerId || car?.reservation?.customerId || starting.customerId });
              }}>
                <option value="">اختر سيارة</option>
                {data.cars.map((c) => <option key={c.id} value={c.id}>{carTitle(c)} {c.year || ''} {c.stockNumber ? `(${c.stockNumber})` : ''}</option>)}
              </select>
            </Field>
            <Field label="الزبون">
              <select className={inputClass} value={starting.customerId} onChange={(e) => setStarting({ ...starting, customerId: e.target.value })}>
                <option value="">بدون (يُكتب يدويًا)</option>
                {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={start} disabled={!starting.carId}>فتح الورقة</PrimaryButton>
            <GhostButton onClick={() => setStarting(null)} className="h-10">إلغاء</GhostButton>
          </div>
        </Card>
      )}

      <Card
        title={`الأوراق المحفوظة (${data.documents.length})`}
        actions={<PrimaryButton onClick={() => setStarting({ type: 'contract', carId: '', customerId: '' })} className="h-9 flex items-center gap-1"><Plus size={14} /> ورقة جديدة</PrimaryButton>}
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-neutral-400" />
            <input className={`${inputClass} pr-9`} placeholder="ابحث برقم الورقة، السيارة، الزبون..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1">
            {[{ id: 'all' as const, label: 'الكل' }, ...CAR_DOC_TYPES].map((t) => (
              <button key={t.id} type="button" onClick={() => setType(t.id)}
                className={`h-10 px-3 rounded-xl text-xs font-bold border cursor-pointer ${type === t.id ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'bg-white text-neutral-600 border-neutral-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <EmptyState text={data.documents.length ? 'لا توجد أوراق مطابقة' : 'لا توجد أوراق بعد. ابدأ ورقة من «ورقة جديدة» أو من الملف المالي لأي سيارة.'} />
        ) : (
          <div className="space-y-1.5">
            {shown.map((d) => {
              const car = carOf(d.carId);
              const who = customerOf(d.customerId)?.name || d.fields.buyerName || d.fields.driverName || d.fields.receiverName || '';
              const label = `${docTypeLabel(d.type)} ${d.number}`;
              return (
                <div key={d.id} className="rounded-2xl border border-neutral-200 bg-white p-2.5 flex items-center gap-3">
                  <button type="button" onClick={() => onOpenDocument?.(d.id)} className="flex-1 min-w-0 flex items-center gap-3 text-right cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center shrink-0"><FileText size={16} /></div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[#1d1d1f] truncate">{docTypeLabel(d.type)} <span dir="ltr" className="text-neutral-400 font-bold">{d.number}</span></div>
                      <div className="text-[11px] text-neutral-500 truncate">{[car ? `${carTitle(car)} ${car.year || ''}` : 'سيارة محذوفة', who, formatDate(`${d.date}T12:00:00`)].filter(Boolean).join(' · ')}</div>
                    </div>
                  </button>
                  {isSigned(d)
                    ? <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-[#1e7a34] bg-green-50 rounded-full px-2 h-6"><CheckCircle2 size={12} /> موقّعة</span>
                    : <span className="hidden sm:flex items-center text-[10px] font-bold text-[#b06f00] bg-amber-50 rounded-full px-2 h-6">بانتظار التوقيع</span>}
                  <button type="button" onClick={() => printDoc(d, data, false)} aria-label={`طباعة ${label}`} className="w-8 h-8 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 flex items-center justify-center cursor-pointer"><Printer size={14} /></button>
                  <button type="button" onClick={() => remove(d.id, label)} aria-label={`حذف ${label}`} className="w-8 h-8 rounded-lg border border-neutral-200 text-neutral-400 hover:text-red-500 flex items-center justify-center cursor-pointer"><Trash2 size={14} /></button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
