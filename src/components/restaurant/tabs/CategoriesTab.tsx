// أقسام المنيو (the main catalogs): add, rename, give an emoji and a photo (shown on the site's menu and the cashier's tabs), hide from the website,
// reorder and delete. A catalog with dishes cannot be deleted until its dishes move elsewhere. Each
// catalog lists the sub-catalogs linked to it.
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { MenuCategory } from '../restaurantTypes';
import { newId } from '../../shop/shopTypes';
import { Card, Field, inputClass, PrimaryButton, GhostButton, EmptyState } from '../../shop/adminUi';
import { RestaurantTabProps, ImagePicker } from './shared';

const ICONS = ['🔥', '🍔', '🌯', '🍕', '🥗', '🍝', '🍗', '🥩', '🐟', '🍟', '🥙', '🍰', '🍨', '🥤', '☕', '🧃', '🍳', '🥐'];

export const CategoriesTab: React.FC<RestaurantTabProps> = ({ data, update, onGoTo }) => {
  const [draft, setDraft] = useState({ name: '', icon: '🔥', image: '' });
  const [openId, setOpenId] = useState<string | null>(null);

  const add = () => {
    const name = draft.name.trim();
    if (!name) return;
    update((d) => ({ ...d, categories: [...d.categories, { id: newId('cat'), name, icon: draft.icon, image: draft.image, hidden: false, stationId: d.stations[0]?.id || '' }] }));
    setDraft({ name: '', icon: draft.icon, image: '' });
  };
  const patch = (id: string, p: Partial<MenuCategory>) => update((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  const move = (i: number, dir: number) =>
    update((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.categories.length) return d;
      const next = [...d.categories];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...d, categories: next };
    });
  const remove = (id: string) => {
    if (data.dishes.some((x) => x.categoryId === id)) return;
    if (!window.confirm('حذف هذا القسم؟')) return;
    update((d) => ({
      ...d,
      categories: d.categories.filter((c) => c.id !== id),
      subCatalogs: d.subCatalogs.map((s) => ({ ...s, categoryIds: s.categoryIds.filter((x) => x !== id) })),
    }));
  };

  return (
    <div className="space-y-4">
      <Card title="قسم جديد">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[180px]">
            <Field label="اسم القسم"><input className={inputClass} placeholder="مثلاً: مشاوي" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} /></Field>
          </div>
          <PrimaryButton onClick={add} disabled={!draft.name.trim()}><span className="inline-flex items-center gap-1"><Plus size={14} /> أضف القسم</span></PrimaryButton>
        </div>
        <Field label="صورة القسم (اختيارية، تظهر في المنيو وعلى تابلت الكاشير)"><ImagePicker value={draft.image} onChange={(image) => setDraft({ ...draft, image })} /></Field>
        <div className="flex flex-wrap gap-1">
          {ICONS.map((ic) => (
            <button key={ic} type="button" onClick={() => setDraft({ ...draft, icon: ic })} className={`w-9 h-9 rounded-xl text-lg cursor-pointer ${draft.icon === ic ? 'bg-[#0071e3]/10 ring-2 ring-[#0071e3]' : 'hover:bg-neutral-100'}`}>{ic}</button>
          ))}
        </div>
      </Card>

      <Card title={`أقسام المنيو (${data.categories.length})`}>
        {data.categories.length === 0 ? (
          <EmptyState text="لا توجد أقسام بعد. أضف أول قسم من الأعلى." />
        ) : (
          <div className="divide-y divide-neutral-100">
            {data.categories.map((c, i) => {
              const count = data.dishes.filter((x) => x.categoryId === c.id).length;
              const subs = data.subCatalogs.filter((s) => s.categoryIds.includes(c.id));
              const open = openId === c.id;
              return (
                <div key={c.id} className="py-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button type="button" aria-label="لأعلى" disabled={i === 0} onClick={() => move(i, -1)} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30 cursor-pointer"><ChevronUp size={16} /></button>
                      <button type="button" aria-label="لأسفل" disabled={i === data.categories.length - 1} onClick={() => move(i, 1)} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30 cursor-pointer"><ChevronDown size={16} /></button>
                    </div>
                    <button type="button" title="صورة القسم" onClick={() => setOpenId(c.id)} className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-neutral-100 flex items-center justify-center text-2xl cursor-pointer">
                      {c.image ? <img src={c.image} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <span>{c.icon || '🍽️'}</span>}
                    </button>
                    <input className={`${inputClass} flex-1 font-bold`} value={c.name} onChange={(e) => patch(c.id, { name: e.target.value })} aria-label="اسم القسم" />
                    <span className="text-[11px] text-neutral-400 font-bold shrink-0 hidden sm:inline">{count} طبق</span>
                    <button type="button" title={c.hidden ? 'مخفي من الموقع' : 'ظاهر في الموقع'} onClick={() => patch(c.id, { hidden: !c.hidden })} className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer ${c.hidden ? 'text-neutral-400 bg-neutral-100' : 'text-[#2F9E44] hover:bg-neutral-100'}`}>{c.hidden ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    <GhostButton onClick={() => setOpenId(open ? null : c.id)}>{open ? 'إغلاق' : 'تفاصيل'}</GhostButton>
                    <button type="button" title={count ? 'انقل أطباقه أولًا' : 'حذف'} disabled={count > 0} onClick={() => remove(c.id)} className="w-9 h-9 rounded-xl text-[#E03131] hover:bg-red-50 flex items-center justify-center cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"><Trash2 size={16} /></button>
                  </div>
                  {open && (
                    <div className="mr-11 p-3 rounded-2xl bg-neutral-50 space-y-3">
                      <Field label="الرمز">
                        <div className="flex flex-wrap gap-1">
                          {ICONS.map((ic) => (
                            <button key={ic} type="button" onClick={() => patch(c.id, { icon: ic })} className={`w-8 h-8 rounded-lg cursor-pointer ${c.icon === ic ? 'bg-[#0071e3]/10 ring-2 ring-[#0071e3]' : 'hover:bg-white'}`}>{ic}</button>
                          ))}
                        </div>
                      </Field>
                      <Field label="صورة القسم (اختيارية)"><ImagePicker value={c.image} onChange={(image) => patch(c.id, { image })} /></Field>
                      <Field label="مجموعات المكونات المربوطة بهذا القسم">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {subs.length === 0 && <span className="text-[11px] text-neutral-400 font-bold">لا شيء بعد.</span>}
                          {subs.map((s) => <span key={s.id} className="h-7 px-2.5 rounded-full bg-white border border-neutral-200 text-[11px] font-bold inline-flex items-center">{s.name}</span>)}
                          <button type="button" onClick={() => onGoTo('subcatalogs')} className="text-[11px] font-bold text-[#0071e3] cursor-pointer">إدارة مجموعات المكونات</button>
                        </div>
                      </Field>
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
