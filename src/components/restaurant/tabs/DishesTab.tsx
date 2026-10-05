// الأطباق: the dish list (search, filter by catalog, «متوفر اليوم» and «ظاهر في الموقع» switches,
// edit, delete) and the dish editor: name, catalog, description, price and old price, photo, badge,
// featured, and the options the guest gets, which come from the sub-catalogs linked to the dish's
// catalog unless the dish picks its own; single items can be left out for this dish.
import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Pencil, ImageOff, Star } from 'lucide-react';
import { Dish, DISH_BADGES, emptyDish } from '../restaurantTypes';
import { newId } from '../../shop/shopTypes';
import { Card, Field, inputClass, inputFitClass, textareaClass, PrimaryButton, GhostButton, Toggle, EmptyState, formatMoney } from '../../shop/adminUi';
import { RestaurantTabProps, ImagePicker, MultiChips, parseAmount } from './shared';

const DishEditor: React.FC<RestaurantTabProps & { dish: Dish; onDone: () => void }> = ({ data, update, onGoTo, dish, onDone }) => {
  const [d, setD] = useState<Dish>(dish);
  const [price, setPrice] = useState(dish.price ? String(dish.price) : '');
  const [oldPrice, setOldPrice] = useState(dish.oldPrice ? String(dish.oldPrice) : '');
  const currency = data.settings.currency;
  const linked = data.subCatalogs.filter((s) => s.categoryIds.includes(d.categoryId));
  const custom = d.subCatalogIds !== null;
  const active = custom ? data.subCatalogs.filter((s) => d.subCatalogIds!.includes(s.id)) : linked;
  const canSave = d.name.trim() && d.categoryId;

  const save = () => {
    if (!canSave) return;
    const clean: Dish = { ...d, name: d.name.trim(), description: d.description.trim(), price: parseAmount(price), oldPrice: parseAmount(oldPrice) };
    update((x) =>
      clean.id
        ? { ...x, dishes: x.dishes.map((y) => (y.id === clean.id ? clean : y)) }
        : { ...x, dishes: [{ ...clean, id: newId('dish'), createdAt: new Date().toISOString() }, ...x.dishes] }
    );
    onDone();
  };

  return (
    <div className="space-y-4">
      <Card title="الطبق">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="اسم الطبق"><input className={inputClass} placeholder="مثلاً: شيش طاووق" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
          <Field label="القسم">
            {data.categories.length === 0 ? (
              <button type="button" onClick={() => onGoTo('categories')} className="h-10 text-xs font-bold text-[#0071e3] cursor-pointer">أضف قسمًا أولًا</button>
            ) : (
              <select className={inputClass} value={d.categoryId} onChange={(e) => setD({ ...d, categoryId: e.target.value })}>
                <option value="">اختر القسم</option>
                {data.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            )}
          </Field>
        </div>
        <Field label="الوصف"><textarea className={textareaClass} placeholder="ماذا يحتوي الطبق؟" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></Field>
        <div className="flex flex-wrap gap-3">
          <Field label={`السعر (${currency})`}><input className={`${inputFitClass} w-40`} inputMode="decimal" dir="ltr" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
          <Field label="السعر قبل العرض (اختياري)"><input className={`${inputFitClass} w-40`} inputMode="decimal" dir="ltr" placeholder="0" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} /></Field>
        </div>
        <Field label="الصورة"><ImagePicker value={d.image} onChange={(image) => setD({ ...d, image })} /></Field>
        <Field label="شارة على الطبق">
          <div className="flex flex-wrap gap-1.5">
            {DISH_BADGES.map((b) => (
              <button key={b.id || 'none'} type="button" onClick={() => setD({ ...d, badge: b.id })}
                className={`h-8 px-3 rounded-full text-xs font-bold border cursor-pointer ${d.badge === b.id ? 'text-white border-transparent' : 'bg-white border-neutral-200 text-neutral-600'}`}
                style={d.badge === b.id ? { backgroundColor: b.color || '#1d1d1f' } : undefined}>{b.label}</button>
            ))}
          </div>
        </Field>
        {/* Each switch in its own box, so a label never reads as belonging to the next switch. */}
        <div className="grid sm:grid-cols-3 gap-2">
          {[
            { label: 'طبق مميز', hint: 'يظهر في شرائح الأطباق المميزة', checked: d.featured, set: (featured: boolean) => setD({ ...d, featured }) },
            { label: 'متوفر اليوم', hint: 'غير المتوفر يظهر بلا زر طلب', checked: d.available, set: (available: boolean) => setD({ ...d, available }) },
            { label: 'ظاهر في الموقع', hint: 'المخفي لا يراه الزبائن', checked: d.published, set: (published: boolean) => setD({ ...d, published }) },
          ].map((t) => (
            <div key={t.label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5">
              <Toggle label={t.label} checked={t.checked} onChange={t.set} />
              <div className="text-[10px] text-neutral-400 pb-0.5">{t.hint}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="خيارات الزبون">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setD({ ...d, subCatalogIds: null })} className={`h-9 px-3 rounded-xl text-xs font-bold border cursor-pointer ${!custom ? 'bg-[#0071e3] border-[#0071e3] text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}>حسب القسم</button>
          <button type="button" onClick={() => setD({ ...d, subCatalogIds: linked.map((s) => s.id) })} className={`h-9 px-3 rounded-xl text-xs font-bold border cursor-pointer ${custom ? 'bg-[#0071e3] border-[#0071e3] text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}>اختيار خاص بهذا الطبق</button>
        </div>
        {custom ? (
          <Field label="الكاتالوكات الفرعية لهذا الطبق">
            <MultiChips options={data.subCatalogs.map((s) => ({ id: s.id, label: s.name }))} value={d.subCatalogIds || []} onChange={(ids) => setD({ ...d, subCatalogIds: ids })} empty="لا توجد كاتالوكات فرعية بعد." />
          </Field>
        ) : (
          <p className="text-[11px] text-neutral-500 leading-relaxed">{d.categoryId ? (linked.length ? `يعرض ما رُبط بقسمه: ${linked.map((s) => s.name).join('، ')}.` : 'لا كاتالوك فرعي مربوط بقسم هذا الطبق بعد.') : 'اختر قسم الطبق أولًا.'}</p>
        )}
        {active.map((s) => (
          <Field key={s.id} label={`${s.name} · اضغط عنصرًا لإخفائه من هذا الطبق`}>
            <div className="flex flex-wrap gap-1.5">
              {s.items.map((i) => {
                const hidden = d.hiddenItemIds.includes(i.id);
                return (
                  <button key={i.id} type="button" aria-pressed={!hidden}
                    onClick={() => setD({ ...d, hiddenItemIds: hidden ? d.hiddenItemIds.filter((x) => x !== i.id) : [...d.hiddenItemIds, i.id] })}
                    className={`h-7 px-2.5 rounded-full text-[11px] font-bold border cursor-pointer ${hidden ? 'bg-white border-neutral-200 text-neutral-400 line-through' : 'bg-neutral-100 border-neutral-100 text-neutral-700'}`}>
                    {i.name}{s.type === 'extras' && i.price > 0 ? ` +${formatMoney(i.price, currency)}` : ''}
                  </button>
                );
              })}
            </div>
          </Field>
        ))}
        <button type="button" onClick={() => onGoTo('subcatalogs')} className="text-[11px] font-bold text-[#0071e3] cursor-pointer">إدارة الكاتالوكات الفرعية</button>
      </Card>

      <div className="flex gap-2 justify-end">
        <GhostButton onClick={onDone} className="h-10">إلغاء</GhostButton>
        <PrimaryButton onClick={save} disabled={!canSave}>{d.id ? 'حفظ التعديل' : 'أضف الطبق'}</PrimaryButton>
      </div>
    </div>
  );
};

export const DishesTab: React.FC<RestaurantTabProps> = (props) => {
  const { data, update } = props;
  const [editing, setEditing] = useState<Dish | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const currency = data.settings.currency;

  const list = useMemo(() => {
    const s = q.trim();
    return data.dishes.filter((d) => (!cat || d.categoryId === cat) && (!s || d.name.includes(s) || d.description.includes(s)));
  }, [data.dishes, q, cat]);

  if (editing) return <DishEditor {...props} dish={editing} onDone={() => setEditing(null)} />;

  const patch = (id: string, p: Partial<Dish>) => update((x) => ({ ...x, dishes: x.dishes.map((d) => (d.id === id ? { ...d, ...p } : d)) }));
  const remove = (id: string) => {
    if (!window.confirm('حذف هذا الطبق؟')) return;
    update((x) => ({ ...x, dishes: x.dishes.filter((d) => d.id !== id) }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input className={`${inputClass} pr-9`} placeholder="ابحث عن طبق" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputFitClass} w-44`} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="القسم">
          <option value="">كل الأقسام</option>
          {data.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <PrimaryButton onClick={() => setEditing(emptyDish(cat || data.categories[0]?.id || ''))}><span className="inline-flex items-center gap-1"><Plus size={14} /> طبق جديد</span></PrimaryButton>
      </div>

      {list.length === 0 ? (
        <EmptyState text={data.dishes.length ? 'لا أطباق تطابق البحث.' : 'لا توجد أطباق بعد. أضف أول طبق.'} />
      ) : (
        <Card>
          <div className="divide-y divide-neutral-100 -my-2">
            {list.map((d) => {
              const c = data.categories.find((x) => x.id === d.categoryId);
              const badge = DISH_BADGES.find((b) => b.id === d.badge && b.id);
              return (
                <div key={d.id} className="py-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center text-neutral-300">
                    {d.image ? <img src={d.image} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <ImageOff size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-black truncate">{d.name || 'طبق بدون اسم'}</span>
                      {d.featured && <Star size={13} className="text-[#F59F00] fill-[#F59F00]" />}
                      {badge && <span className="h-5 px-1.5 rounded-full text-[10px] font-bold text-white inline-flex items-center" style={{ backgroundColor: badge.color }}>{badge.label}</span>}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-bold">{c ? `${c.icon} ${c.name}` : 'بدون قسم'} · {formatMoney(d.price, currency)}</div>
                  </div>
                  <label className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 cursor-pointer">
                    <input type="checkbox" checked={d.available} onChange={(e) => patch(d.id, { available: e.target.checked })} className="w-4 h-4 accent-[#34c759]" /> متوفر
                  </label>
                  <label className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 cursor-pointer">
                    <input type="checkbox" checked={d.published} onChange={(e) => patch(d.id, { published: e.target.checked })} className="w-4 h-4 accent-[#0071e3]" /> ظاهر
                  </label>
                  <button type="button" aria-label="تعديل" onClick={() => setEditing(d)} className="w-9 h-9 rounded-xl text-neutral-500 hover:bg-neutral-100 flex items-center justify-center cursor-pointer"><Pencil size={16} /></button>
                  <button type="button" aria-label="حذف" onClick={() => remove(d.id)} className="w-9 h-9 rounded-xl text-[#E03131] hover:bg-red-50 flex items-center justify-center cursor-pointer"><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
