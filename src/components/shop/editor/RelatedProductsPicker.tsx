// منتجات مرتبطة: up to MAX_RELATED products shown at the bottom of this product's floating card.
// Added by product number, or by catalog → sub catalog → product. Only products shown in the
// store can be added.
import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ShopProduct, ShopCatalog, MAX_RELATED } from '../shopTypes';
import { Field, inputClass, inputFitClass, GhostButton } from '../adminUi';

interface RelatedProductsPickerProps {
  productId: string;
  selected: string[];
  products: ShopProduct[];
  catalogs: ShopCatalog[];
  onChange: (ids: string[]) => void;
}

export const RelatedProductsPicker: React.FC<RelatedProductsPickerProps> = ({ productId, selected, products, catalogs, onChange }) => {
  const [number, setNumber] = useState('');
  const [mainId, setMainId] = useState('');
  const [subId, setSubId] = useState('');
  const [pick, setPick] = useState('');
  const [error, setError] = useState('');

  const eligible = useMemo(
    () => products.filter((p) => p.published && p.id !== productId && !selected.includes(p.id)),
    [products, productId, selected]
  );
  const mains = catalogs.filter((c) => !c.parentId);
  const subs = catalogs.filter((c) => c.parentId === mainId);
  const filtered = eligible.filter((p) => (!mainId || p.catalogIds.includes(mainId)) && (!subId || p.catalogIds.includes(subId)));
  const full = selected.length >= MAX_RELATED;

  const add = (id: string) => {
    if (!id || full || selected.includes(id)) return;
    onChange([...selected, id]);
    setPick('');
    setError('');
  };

  const addByNumber = () => {
    const n = number.trim();
    if (!n) return;
    const p = products.find((x) => x.sku === n);
    if (!p) return setError(`لا يوجد منتج بالرقم ${n}.`);
    if (p.id === productId) return setError('لا يمكن ربط المنتج بنفسه.');
    if (!p.published) return setError(`"${p.name}" غير معروض في المتجر، فلا يمكن ربطه.`);
    add(p.id);
    setNumber('');
  };

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const p = products.find((x) => x.id === id);
            if (!p) return null;
            return (
              <span key={id} className="inline-flex items-center gap-2 h-10 pr-1 pl-2 rounded-xl border border-neutral-200 bg-white text-xs font-bold">
                <span className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-100">{p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}</span>
                <span className="max-w-[140px] truncate">{p.name}</span>
                {p.sku && <span className="text-neutral-400 font-normal">#{p.sku}</span>}
                <button type="button" onClick={() => onChange(selected.filter((x) => x !== id))} className="w-6 h-6 rounded-full hover:bg-neutral-100 flex items-center justify-center cursor-pointer" aria-label={`إزالة ${p.name}`}>
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {full ? (
        <p className="text-[11px] text-neutral-400">وصلت إلى الحد الأقصى ({MAX_RELATED} منتجات).</p>
      ) : (
        <>
          <Field label="بالرقم">
            <div className="flex gap-2">
              <input
                className={`${inputFitClass} w-32`}
                placeholder="رقم المنتج"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addByNumber(); } }}
                dir="ltr"
                inputMode="numeric"
              />
              <GhostButton onClick={addByNumber} className="h-10 flex items-center gap-1"><Plus size={13} /> ربط</GhostButton>
            </div>
          </Field>
          <Field label="أو بالكاتالوك">
            <div className="grid sm:grid-cols-3 gap-2">
              <select className={inputClass} value={mainId} onChange={(e) => { setMainId(e.target.value); setSubId(''); }} aria-label="الكاتالوك">
                <option value="">كل الكاتالوكات</option>
                {mains.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className={inputClass} value={subId} onChange={(e) => setSubId(e.target.value)} disabled={!mainId} aria-label="الكاتالوك الفرعي">
                <option value="">كل الفرعية</option>
                {subs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className={inputClass} value={pick} onChange={(e) => add(e.target.value)} aria-label="المنتج المرتبط">
                <option value="">{filtered.length ? '— اختر منتجاً —' : 'لا منتجات معروضة هنا'}</option>
                {filtered.map((p) => <option key={p.id} value={p.id}>{p.sku ? `#${p.sku} · ` : ''}{p.name}</option>)}
              </select>
            </div>
          </Field>
        </>
      )}
      {error && <p className="text-[11px] font-bold text-red-500">{error}</p>}
    </div>
  );
};
