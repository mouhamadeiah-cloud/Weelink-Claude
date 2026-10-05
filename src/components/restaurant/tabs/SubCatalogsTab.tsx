// الكاتالوكات الفرعية: groups of ingredients the guest may take out of a dish (free, picked by
// default) or of paid extras the guest may add. Each sub-catalog is linked to one or more main
// catalogs (أقسام المنيو), and every dish of those catalogs then offers it; a dish can still pick its
// own sub-catalogs or leave single items out in its editor.
import React, { useState } from 'react';
import { Plus, Trash2, X, Leaf, CirclePlus } from 'lucide-react';
import { SubCatalog, SubCatalogType } from '../restaurantTypes';
import { newId } from '../../shop/shopTypes';
import { Card, Field, inputClass, inputFitClass, PrimaryButton, GhostButton, EmptyState, formatMoney } from '../../shop/adminUi';
import { RestaurantTabProps, MultiChips, parseAmount } from './shared';

const TYPES: { id: SubCatalogType; label: string; hint: string; icon: React.ElementType }[] = [
  { id: 'ingredients', label: 'مكونات قابلة للإزالة', hint: 'تظهر محددة، والزبون يزيل ما لا يريده (مجانًا).', icon: Leaf },
  { id: 'extras', label: 'إضافات مدفوعة', hint: 'الزبون يختار ما يريد، ويُضاف سعرها إلى الطبق.', icon: CirclePlus },
];

const blank = (): SubCatalog => ({ id: '', name: '', type: 'ingredients', items: [], categoryIds: [] });

export const SubCatalogsTab: React.FC<RestaurantTabProps> = ({ data, update, onGoTo }) => {
  const [form, setForm] = useState<SubCatalog | null>(null);
  const [item, setItem] = useState({ name: '', price: '' });
  const currency = data.settings.currency;
  const catOptions = data.categories.filter((c) => c.name.trim()).map((c) => ({ id: c.id, label: `${c.icon} ${c.name}`.trim() }));

  const addItem = () => {
    if (!form || !item.name.trim()) return;
    setForm({ ...form, items: [...form.items, { id: newId('itm'), name: item.name.trim(), price: form.type === 'extras' ? parseAmount(item.price) : 0 }] });
    setItem({ name: '', price: '' });
  };
  const save = () => {
    if (!form || !form.name.trim()) return;
    const clean = { ...form, name: form.name.trim(), items: form.items.filter((i) => i.name.trim()).map((i) => (form.type === 'extras' ? i : { ...i, price: 0 })) };
    update((d) =>
      clean.id
        ? { ...d, subCatalogs: d.subCatalogs.map((s) => (s.id === clean.id ? clean : s)) }
        : { ...d, subCatalogs: [...d.subCatalogs, { ...clean, id: newId('sub') }] }
    );
    setForm(null);
  };
  const remove = (id: string) => {
    if (!window.confirm('حذف هذا الكاتالوك الفرعي؟ سيختفي من كل الأطباق.')) return;
    update((d) => ({
      ...d,
      subCatalogs: d.subCatalogs.filter((s) => s.id !== id),
      dishes: d.dishes.map((x) => (x.subCatalogIds ? { ...x, subCatalogIds: x.subCatalogIds.filter((s) => s !== id) } : x)),
    }));
  };

  if (form) {
    return (
      <div className="space-y-4">
        <Card title={form.id ? 'تعديل الكاتالوك الفرعي' : 'كاتالوك فرعي جديد'}>
          <Field label="الاسم"><input className={inputClass} placeholder="مثلاً: مكونات السندويش" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="النوع">
            <div className="grid sm:grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button key={t.id} type="button" onClick={() => setForm({ ...form, type: t.id })}
                  className={`text-right p-3 rounded-2xl border-2 cursor-pointer transition ${form.type === t.id ? 'border-[#0071e3] bg-[#0071e3]/5' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                  <div className="flex items-center gap-2 text-sm font-black"><t.icon size={16} className={form.type === t.id ? 'text-[#0071e3]' : 'text-neutral-400'} />{t.label}</div>
                  <div className="text-[11px] text-neutral-500 mt-1 leading-relaxed">{t.hint}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="اربطه بالأقسام الأساسية" hint="كل طبق في هذه الأقسام سيعرض هذا الكاتالوك للزبون.">
            <MultiChips options={catOptions} value={form.categoryIds} onChange={(categoryIds) => setForm({ ...form, categoryIds })} empty="أضف أقسام المنيو أولًا." />
          </Field>
        </Card>

        <Card title={form.type === 'extras' ? 'الإضافات' : 'المكونات'}>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[160px]"><Field label="الاسم"><input className={inputClass} placeholder={form.type === 'extras' ? 'مثلاً: جبنة إضافية' : 'مثلاً: بصل'} value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addItem()} /></Field></div>
            {form.type === 'extras' && <Field label={`السعر (${currency})`}><input className={`${inputFitClass} w-32`} inputMode="decimal" dir="ltr" placeholder="0" value={item.price} onChange={(e) => setItem({ ...item, price: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addItem()} /></Field>}
            <GhostButton onClick={addItem} disabled={!item.name.trim()} className="h-10"><span className="inline-flex items-center gap-1"><Plus size={14} /> أضف</span></GhostButton>
          </div>
          {form.items.length === 0 ? (
            <EmptyState text="لا عناصر بعد." />
          ) : (
            <div className="space-y-2">
              {form.items.map((i) => (
                <div key={i.id} className="flex items-center gap-2">
                  <input className={`${inputClass} flex-1`} value={i.name} onChange={(e) => setForm({ ...form, items: form.items.map((x) => (x.id === i.id ? { ...x, name: e.target.value } : x)) })} aria-label="الاسم" />
                  {form.type === 'extras' && (
                    <input className={`${inputFitClass} w-32`} inputMode="decimal" dir="ltr" value={i.price || ''} placeholder="0" onChange={(e) => setForm({ ...form, items: form.items.map((x) => (x.id === i.id ? { ...x, price: parseAmount(e.target.value) } : x)) })} aria-label="السعر" />
                  )}
                  <button type="button" aria-label="حذف" onClick={() => setForm({ ...form, items: form.items.filter((x) => x.id !== i.id) })} className="w-9 h-9 rounded-xl text-neutral-400 hover:text-[#E03131] hover:bg-red-50 flex items-center justify-center cursor-pointer"><X size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex gap-2 justify-end">
          <GhostButton onClick={() => setForm(null)} className="h-10">إلغاء</GhostButton>
          <PrimaryButton onClick={save} disabled={!form.name.trim()}>حفظ</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-neutral-500 leading-relaxed max-w-xl">الكاتالوك الفرعي مجموعة مكونات أو إضافات تربطها بقسم أو أكثر من أقسام المنيو، فتظهر في نافذة كل طبق من هذه الأقسام.</p>
        <PrimaryButton onClick={() => { setForm(blank()); setItem({ name: '', price: '' }); }}><span className="inline-flex items-center gap-1"><Plus size={14} /> كاتالوك فرعي</span></PrimaryButton>
      </div>
      {data.subCatalogs.length === 0 ? (
        <EmptyState text="لا توجد كاتالوكات فرعية بعد." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.subCatalogs.map((s) => {
            const t = TYPES.find((x) => x.id === s.type)!;
            const cats = data.categories.filter((c) => s.categoryIds.includes(c.id));
            return (
              <div key={s.id} className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <t.icon size={18} className="text-[#0071e3] mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black truncate">{s.name}</div>
                    <div className="text-[11px] text-neutral-400 font-bold">{t.label} · {s.items.length} عنصر</div>
                  </div>
                  <GhostButton onClick={() => { setForm(s); setItem({ name: '', price: '' }); }}>تعديل</GhostButton>
                  <button type="button" aria-label="حذف" onClick={() => remove(s.id)} className="w-9 h-9 rounded-xl text-[#E03131] hover:bg-red-50 flex items-center justify-center cursor-pointer"><Trash2 size={16} /></button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.items.map((i) => (
                    <span key={i.id} className="h-6 px-2 rounded-full bg-neutral-100 text-[11px] font-bold inline-flex items-center">{i.name}{s.type === 'extras' && i.price > 0 ? ` +${formatMoney(i.price, currency)}` : ''}</span>
                  ))}
                </div>
                <div className="text-[11px] font-bold text-neutral-500 flex flex-wrap items-center gap-1">
                  <span>مربوط بـ:</span>
                  {cats.length ? cats.map((c) => <span key={c.id} className="h-6 px-2 rounded-full bg-[#0071e3]/10 text-[#0071e3] inline-flex items-center">{c.icon} {c.name}</span>) : <span className="text-[#E8590C]">لا قسم بعد</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {data.categories.length === 0 && (
        <button type="button" onClick={() => onGoTo('categories')} className="text-xs font-bold text-[#0071e3] cursor-pointer">أضف أقسام المنيو أولًا</button>
      )}
    </div>
  );
};
