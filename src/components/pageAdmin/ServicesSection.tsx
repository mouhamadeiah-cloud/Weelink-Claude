// «خدماتي» in the free page's admin (Eyad, 18 Oct): the page's services as items with Weelink's public
// number (V-10001), a price and a picture, shown or kept back. A page that answered Wee AI's questions can
// import the services it typed there.
import React, { useState } from 'react';
import { Eye, EyeOff, Plus, Trash2, Wrench } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { itemNoLabel } from '../../utils/itemNumbers';
import { ImagePicker } from '../restaurant/tabs/shared';
import { MAX_SERVICES, PageAdminData, PageService, emptyService, servicesFromAnswers } from './pageServices';
import { newId } from '../shop/shopTypes';

const inputClass = 'w-full h-9 px-3 rounded-xl border border-neutral-200 bg-white text-sm text-ink outline-none focus:border-brand';

export const ServicesSection: React.FC<{ data: PageAdminData; onChange: (fn: (d: PageAdminData) => PageAdminData) => void }> = ({ data, onChange }) => {
  const [openId, setOpenId] = useState('');
  const [note, setNote] = useState('');
  const list = data.services;
  const patch = (id: string, p: Partial<PageService>) => onChange((d) => ({ ...d, services: d.services.map((s) => (s.id === id ? { ...s, ...p } : s)) }));
  const add = () => {
    if (list.length >= MAX_SERVICES) return;
    const s = { ...emptyService(), id: newId('srv'), name: 'خدمة جديدة', createdAt: new Date().toISOString() };
    onChange((d) => ({ ...d, services: [...d.services, s] }));
    setOpenId(s.id);
  };
  const importFromAnswers = async () => {
    setNote('');
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const snap = await getDoc(doc(db, 'platform_directory', uid));
      const found = servicesFromAnswers((snap.data() as any)?.aiAnswers?.services);
      if (!found.length) return setNote('ما لقينا خدمات بأجوبتك.');
      onChange((d) => ({ ...d, services: [...d.services, ...found].slice(0, MAX_SERVICES) }));
    } catch {
      setNote('ما قدرنا نقرأ أجوبتك هلق. جرّب بعد شوي.');
    }
  };

  return (
    <section className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
        <Wrench size={15} /> خدماتي
        <span className="mr-auto font-normal">الخدمات المعروضة بتطلع بالبحث وبتاخد رقم Weelink</span>
      </div>
      {list.length === 0 && <p className="text-xs text-neutral-500">ما في خدمات لسا. أضف خدماتك لتلاقيك الناس بالبحث.</p>}
      <ul className="space-y-2">
        {list.map((s) => (
          <li key={s.id} className="rounded-xl bg-bg p-3 space-y-2">
            <div className="flex items-center gap-2">
              {s.image && <img src={s.image} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover" />}
              <button type="button" onClick={() => setOpenId(openId === s.id ? '' : s.id)} className="flex-1 min-w-0 text-right cursor-pointer">
                <div className="text-sm font-black text-ink truncate">{s.name}</div>
                <div className="text-xs text-neutral-500 truncate" dir="auto">{[s.publicNo ? itemNoLabel('service', s.publicNo) : '', s.price].filter(Boolean).join(' · ')}</div>
              </button>
              <button type="button" onClick={() => patch(s.id, { published: !s.published })} title={s.published ? 'معروضة بالبحث' : 'مخفية'} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-neutral-500 cursor-pointer">
                {s.published ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button type="button" onClick={() => onChange((d) => ({ ...d, services: d.services.filter((x) => x.id !== s.id) }))} title="حذف" className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-[#E03131] cursor-pointer">
                <Trash2 size={16} />
              </button>
            </div>
            {openId === s.id && (
              <div className="space-y-2">
                <input className={inputClass} placeholder="اسم الخدمة" value={s.name} onChange={(e) => patch(s.id, { name: e.target.value })} />
                <input className={inputClass} placeholder="السعر (مثال: 20$ أو حسب الطلب)" value={s.price} onChange={(e) => patch(s.id, { price: e.target.value })} />
                <textarea className={`${inputClass} h-20 py-2`} placeholder="وصف قصير" value={s.description} onChange={(e) => patch(s.id, { description: e.target.value })} />
                <ImagePicker value={s.image} onChange={(image) => patch(s.id, { image })} />
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={add} disabled={list.length >= MAX_SERVICES} className="h-9 px-3 rounded-xl bg-ink text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40">
          <Plus size={14} /> إضافة خدمة
        </button>
        {list.length === 0 && (
          <button type="button" onClick={importFromAnswers} className="h-9 px-3 rounded-xl border border-neutral-200 text-xs font-bold text-ink cursor-pointer">جيب خدماتي من أجوبتي</button>
        )}
        {note && <span className="text-xs text-neutral-500">{note}</span>}
      </div>
    </section>
  );
};
