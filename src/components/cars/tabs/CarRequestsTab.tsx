// طلبات الزوار: what visitors asked for from a car's page («احجز تجربة قيادة» or «اطلب السيارة»).
// Each visitor is already among the customers as «مهتم»; from here the showroom calls them back, marks
// the request handled and opens a test drive form filled with the visitor and the car.
import React, { useState } from 'react';
import { Phone, MessageCircle, Trash2, KeyRound, ShoppingBag, UserPlus, FileText, Info } from 'lucide-react';
import { CarRequest, CarRequestStatus } from '../carTypes';
import { emptyCustomer, saveCustomer } from '../carMoney';
import { Card, EmptyState, formatDate } from '../../shop/adminUi';
import { CarTabProps } from './CarEditor';
import { customerWhatsapp } from './moneyUi';

export const REQUEST_STATUSES: { id: CarRequestStatus; label: string; color: string }[] = [
  { id: 'new', label: 'جديد', color: '#0071e3' },
  { id: 'contacted', label: 'تم التواصل', color: '#b06f00' },
  { id: 'done', label: 'منتهٍ', color: '#1e7a34' },
];

const when = (v: string) => {
  if (!v) return '';
  const d = new Date(v.length <= 10 ? `${v}T12:00:00` : v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString('ar-SY-u-nu-latn', v.length <= 10 ? { year: 'numeric', month: 'short', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const CarRequestsTab: React.FC<CarTabProps> = ({ data, update, onNewDocument }) => {
  const [filter, setFilter] = useState<CarRequestStatus | 'all'>('all');
  const shown = data.requests.filter((r) => filter === 'all' || r.status === filter);

  const setRequest = (id: string, changes: Partial<CarRequest>) => update((d) => ({ ...d, requests: d.requests.map((r) => (r.id === id ? { ...r, ...changes } : r)) }));
  const addCustomer = (r: CarRequest) =>
    update((d) => {
      const saved = saveCustomer(d, { ...emptyCustomer(), name: r.name, phone: r.phone, roles: ['interested'], notes: `طلب من الموقع: ${r.carLabel}` });
      return { ...saved.data, requests: saved.data.requests.map((x) => (x.id === r.id ? { ...x, customerId: saved.id } : x)) };
    });
  const remove = (r: CarRequest) => {
    if (!window.confirm(`حذف طلب ${r.name}؟ يبقى في الزبائن.`)) return;
    update((d) => ({ ...d, requests: d.requests.filter((x) => x.id !== r.id) }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 flex gap-2 text-[11px] text-[#0b4f9c] leading-relaxed">
        <Info size={15} className="shrink-0 mt-0.5" />
        <span>
          يظهر في صفحة كل سيارة زرّا «احجز تجربة قيادة» و«اطلب السيارة». يُضاف كل طلب هنا ويُضاف صاحبه إلى الزبائن كـ«مهتم»، وتصلك رسالة واتساب أيضًا.
          حاليًا يصل الطلب إلى هذه القائمة من المعاينة على جهازك؛ أما طلبات زوار الموقع المنشور فتحتاج خدمة النشر في المنصة، وحتى ذلك الحين تصلك عبر واتساب.
        </span>
      </div>

      <Card title={`طلبات الزوار (${data.requests.length})`}>
        <div className="flex flex-wrap gap-1">
          {[{ id: 'all' as const, label: 'الكل' }, ...REQUEST_STATUSES].map((s) => {
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
          <EmptyState text={data.requests.length ? 'لا توجد طلبات بهذه الحالة' : 'لا توجد طلبات بعد. تصل هنا عندما يضغط زائر «احجز تجربة قيادة» أو «اطلب السيارة» في صفحة سيارة.'} />
        ) : (
          <div className="grid md:grid-cols-2 gap-2">
            {shown.map((r) => {
              const customer = data.customers.find((c) => c.id === r.customerId);
              const wa = customerWhatsapp({ phone: r.phone });
              const carExists = data.cars.some((c) => c.id === r.carId);
              const status = REQUEST_STATUSES.find((s) => s.id === r.status)!;
              return (
                <div key={r.id} className={`rounded-2xl border p-3 space-y-2 bg-white ${r.status === 'new' ? 'border-[#0071e3]/40' : 'border-neutral-200'}`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.type === 'testDrive' ? 'bg-amber-50 text-[#b06f00]' : 'bg-blue-50 text-[#0071e3]'}`}>
                      {r.type === 'testDrive' ? <KeyRound size={16} /> : <ShoppingBag size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-[#1d1d1f]">{r.type === 'testDrive' ? 'تجربة قيادة' : 'طلب السيارة'} · {r.name}</div>
                      <div className="text-[11px] text-neutral-500 truncate">{r.carLabel}</div>
                    </div>
                    <select aria-label="حالة الطلب" value={r.status} onChange={(e) => setRequest(r.id, { status: e.target.value as CarRequestStatus })}
                      className="h-8 px-2 rounded-lg border border-neutral-200 bg-white text-[11px] font-bold cursor-pointer" style={{ color: status.color }}>
                      {REQUEST_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="text-[11px] text-neutral-600 space-y-0.5">
                    <div><span className="text-neutral-400">الهاتف: </span><span dir="ltr">{r.phone}</span></div>
                    {r.preferredDate && <div><span className="text-neutral-400">الموعد المطلوب: </span>{when(r.preferredDate)}</div>}
                    {r.message && <div className="leading-relaxed">{r.message}</div>}
                    <div className="text-[10px] text-neutral-400">وصل {formatDate(r.createdAt)}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {wa && <a href={`${wa}?text=${encodeURIComponent(`مرحبًا ${r.name}، بخصوص طلبك للسيارة ${r.carLabel}`)}`} target="_blank" rel="noopener noreferrer" className="h-8 px-2.5 rounded-lg border border-neutral-200 text-[#25d366] hover:bg-green-50 text-[11px] font-bold flex items-center gap-1"><MessageCircle size={13} /> واتساب</a>}
                    <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} className="h-8 px-2.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-[11px] font-bold flex items-center gap-1"><Phone size={13} /> اتصال</a>
                    {r.type === 'testDrive' && carExists && onNewDocument && (
                      <button type="button" onClick={() => onNewDocument('testDrive', r.carId, r.customerId || undefined)} className="h-8 px-2.5 rounded-lg border border-neutral-200 text-[#0071e3] hover:bg-blue-50 text-[11px] font-bold flex items-center gap-1 cursor-pointer"><FileText size={13} /> نموذج تجربة قيادة</button>
                    )}
                    {!customer && (
                      <button type="button" onClick={() => addCustomer(r)} className="h-8 px-2.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-[11px] font-bold flex items-center gap-1 cursor-pointer"><UserPlus size={13} /> إضافة إلى الزبائن</button>
                    )}
                    <button type="button" onClick={() => remove(r)} aria-label="حذف الطلب" className="h-8 w-8 mr-auto rounded-lg border border-neutral-200 text-neutral-400 hover:text-red-500 flex items-center justify-center cursor-pointer"><Trash2 size={13} /></button>
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
