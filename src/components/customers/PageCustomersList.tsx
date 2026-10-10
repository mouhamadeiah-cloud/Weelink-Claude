// «زبائن الموقع» in a page's admin window: the visitors who joined the page with their Weelink
// account, with their details and whether they agreed to receive its offers by email.
import React, { useState } from 'react';
import { Copy, Mail, Trash2 } from 'lucide-react';
import { PageCustomer, removePageCustomer, usePageCustomers } from '../../services/pageCustomers';
import { Card, EmptyState, GhostButton, formatDate, inputClass } from '../shop/adminUi';

export const PageCustomersList: React.FC<{ ownerUid: string; isOwner: boolean; siteUrl?: string }> = ({ ownerUid, isOwner, siteUrl }) => {
  const { items, ready, error } = usePageCustomers(ownerUid);
  const [search, setSearch] = useState('');
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [copied, setCopied] = useState(false);

  const q = search.trim().toLowerCase();
  const shown = items.filter(
    (c) => (!onlyOffers || c.marketing) && (!q || [c.name, c.email, c.phone, c.address].some((v) => v.toLowerCase().includes(q)))
  );
  const offerEmails = items.filter((c) => c.marketing).map((c) => c.email);

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(offerEmails.join(', '));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('انسخ العناوين:', offerEmails.join(', '));
    }
  };

  const remove = (c: PageCustomer) => {
    if (!window.confirm(`حذف ${c.name || c.email} من زبائن الموقع؟ يبقى حسابه في Weelink ويستطيع الاشتراك من جديد.`)) return;
    removePageCustomer(ownerUid, c.uid).catch(() => window.alert('تعذر الحذف. حاول مرة أخرى.'));
  };

  return (
    <div className="space-y-4">
      <Card title={`زبائن الموقع (${items.length})`}>
        <p className="text-xs text-neutral-500 leading-relaxed">
          يشترك الزائر من زر «سجّل كزبون» في أعلى موقعك، بحساب Weelink أو Google بعد تأكيد بريده. يرى هنا طلباته ويحفظ بياناته فلا يكتبها في كل طلب.
          {siteUrl ? <> رابط موقعك: <a href={siteUrl} target="_blank" rel="noreferrer" dir="ltr" className="text-[#0071e3] font-bold">{siteUrl}</a></> : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${inputClass} flex-1 min-w-[180px]`} placeholder="بحث بالاسم أو البريد أو الهاتف" value={search} onChange={(e) => setSearch(e.target.value)} />
          <GhostButton onClick={() => setOnlyOffers(!onlyOffers)} className={onlyOffers ? '!border-[#0071e3] !text-[#0071e3]' : ''}>
            <span className="inline-flex items-center gap-1.5"><Mail size={14} /> الموافقون على العروض ({offerEmails.length})</span>
          </GhostButton>
          <GhostButton onClick={copyEmails} disabled={!offerEmails.length}>
            <span className="inline-flex items-center gap-1.5"><Copy size={14} /> {copied ? 'تم النسخ' : 'نسخ بريد الموافقين'}</span>
          </GhostButton>
        </div>
        {error ? (
          <p className="text-xs font-bold text-[#A34A00]">
            {error.includes('permission') ? 'قائمة الزبائن غير مفعّلة بعد: يجب نشر قواعد Firebase الجديدة (firestore.rules) مرة واحدة.' : 'تعذر الاتصال بقاعدة البيانات. تحقق من الإنترنت.'}
          </p>
        ) : !ready ? null : shown.length === 0 ? (
          <EmptyState text={items.length ? 'لا نتائج.' : 'لم يشترك أحد بعد.'} />
        ) : (
          <div className="divide-y divide-neutral-100">
            {shown.map((c) => (
              <div key={c.uid} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5 text-xs">
                  <div className="text-sm font-black text-[#1d1d1f] flex items-center gap-2">
                    {c.name || 'بدون اسم'}
                    {c.marketing && <span className="px-2 h-5 rounded-full bg-[#34c759]/15 text-[#248A3D] text-[10px] font-bold inline-flex items-center">يقبل العروض</span>}
                  </div>
                  <div className="text-neutral-500" dir="ltr" style={{ textAlign: 'right' }}>{c.email}</div>
                  <div className="text-neutral-500">{[c.phone, c.address].filter(Boolean).join(' · ')}</div>
                  <div className="text-neutral-400">اشترك {formatDate(c.joinedAt)}</div>
                </div>
                {isOwner && (
                  <button type="button" onClick={() => remove(c)} className="w-8 h-8 shrink-0 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer" aria-label="حذف">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
