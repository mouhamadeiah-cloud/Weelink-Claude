// The product fields, shared by "إضافة منتج" and the warehouse's edit form.
import React from 'react';
import { ShopCatalog } from '../shopTypes';
import { Field, inputClass, textareaClass, ImagesPicker } from '../adminUi';

export interface ProductDraft {
  name: string;
  description: string;
  price: string;
  cost: string;
  stock: string;
  sku: string;
  images: string[];
  catalogIds: string[];
}

export const emptyProductDraft: ProductDraft = {
  name: '', description: '', price: '', cost: '', stock: '', sku: '', images: [], catalogIds: [],
};

export const CatalogChecklist: React.FC<{
  catalogs: ShopCatalog[];
  selected: string[];
  onChange: (ids: string[]) => void;
}> = ({ catalogs, selected, onChange }) => {
  if (catalogs.length === 0) {
    return <p className="text-[11px] text-neutral-400">لا توجد كاتالوكات بعد. أنشئها من قسم الكاتالوكات.</p>;
  }
  const ordered = [
    ...catalogs.filter((c) => !c.parentId).flatMap((c) => [c, ...catalogs.filter((s) => s.parentId === c.id)]),
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {ordered.map((c) => {
        const on = selected.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(on ? selected.filter((id) => id !== c.id) : [...selected, c.id])}
            className={`px-3 h-8 rounded-full text-[11px] font-bold border transition cursor-pointer ${
              on ? 'bg-[#0071e3] border-[#0071e3] text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            {c.parentId ? '↳ ' : ''}{c.name}
          </button>
        );
      })}
    </div>
  );
};

export const ProductForm: React.FC<{
  draft: ProductDraft;
  onChange: (d: ProductDraft) => void;
  catalogs: ShopCatalog[];
  currency: string;
  stockLabel?: string;
}> = ({ draft, onChange, catalogs, currency, stockLabel = 'الكمية في المستودع' }) => {
  const set = (patch: Partial<ProductDraft>) => onChange({ ...draft, ...patch });
  return (
    <div className="space-y-4">
      <Field label="اسم المنتج">
        <input className={inputClass} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="مثال: قميص قطني أزرق" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`سعر البيع (${currency})`}>
          <input className={inputClass} type="number" min="0" inputMode="decimal" value={draft.price} onChange={(e) => set({ price: e.target.value })} />
        </Field>
        <Field label={`سعر الشراء (${currency})`}>
          <input className={inputClass} type="number" min="0" inputMode="decimal" value={draft.cost} onChange={(e) => set({ cost: e.target.value })} />
        </Field>
        <Field label={stockLabel}>
          <input className={inputClass} type="number" min="0" inputMode="numeric" value={draft.stock} onChange={(e) => set({ stock: e.target.value })} />
        </Field>
        <Field label="رمز المنتج (اختياري)">
          <input className={inputClass} value={draft.sku} onChange={(e) => set({ sku: e.target.value })} dir="ltr" />
        </Field>
      </div>
      <Field label="الوصف">
        <textarea className={textareaClass} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      <Field label="صور المنتج">
        <ImagesPicker images={draft.images} onChange={(images) => set({ images })} />
      </Field>
      <Field label="الكاتالوكات">
        <CatalogChecklist catalogs={catalogs} selected={draft.catalogIds} onChange={(catalogIds) => set({ catalogIds })} />
      </Field>
    </div>
  );
};

export const toNumber = (v: string) => {
  const n = parseFloat(v);
  return isFinite(n) && n > 0 ? n : 0;
};
