// تنزيل المنتج: the product editor, one section after the other: the product (catalog and name
// from artikel.json), images (slots, gallery layout, badge), price (prices, quantity tiers,
// delivery), specs and stock, description, related products; the last step shows the three export
// buttons (store and warehouse, store only, warehouse only).
// A live preview of the store card, or slide, stays beside every step.
import React, { useMemo, useState } from 'react';
import { Store, Warehouse, ArrowLeft, ArrowRight, Plus, Trash2, Percent, LayoutGrid, GalleryHorizontal } from 'lucide-react';
import {
  ShopAdminData, ShopProduct, ShopCatalog, ShopMovement, PRODUCT_BADGES, ProductBadge, CURRENCIES,
  MAX_PRICE_TIERS, ProductDisplay, newId,
} from '../shopTypes';
import { buildVariants, discountPercent, nextSku, sanitizeHtml, totalStock, variantLabel } from '../productModel';
import { suggestedPresets } from '../artikel';
import { Card, Field, inputClass, inputFitClass, PrimaryButton, GhostButton, Toggle } from '../adminUi';
import { CatalogPicker, PickerPath, emptyPickerPath } from './CatalogPicker';
import { ImageSlots, toSlots } from './ImageSlots';
import { OptionsEditor } from './OptionsEditor';
import { RichTextEditor } from './RichTextEditor';
import { RelatedProductsPicker } from './RelatedProductsPicker';
import { ProductCard, ProductSlide } from '../store/ProductCard';
import { GALLERY_LAYOUTS, GalleryLayoutIcon } from '../store/ProductGallery';

export const newProductDraft = (currency: string): ShopProduct => ({
  id: '',
  name: '',
  description: '',
  shortDescription: '',
  showShortDescription: true,
  price: 0,
  oldPrice: 0,
  currency,
  cost: 0,
  stock: 0,
  sku: '',
  images: [],
  galleryLayout: 'top-main',
  display: 'card',
  badge: '',
  tiers: [],
  deliveryPrice: null,
  options: [],
  variants: [],
  catalogIds: [],
  published: true,
  inWarehouse: true,
  relatedIds: [],
  createdAt: '',
});

// The catalog path of a saved product, by name (the picker resolves the keys).
const pathOf = (product: ShopProduct | undefined, catalogs: ShopCatalog[]): PickerPath => {
  if (!product) return emptyPickerPath;
  const own = catalogs.filter((c) => product.catalogIds.includes(c.id));
  const sub = own.find((c) => c.parentId && own.some((m) => m.id === c.parentId));
  const main = sub ? catalogs.find((c) => c.id === sub.parentId) : own.find((c) => !c.parentId);
  return main ? { ...emptyPickerPath, mainName: main.name, subName: sub?.name || '' } : emptyPickerPath;
};

type ExportTarget = 'store' | 'warehouse' | 'both';

const STEPS = ['المنتج', 'الصور', 'السعر', 'المواصفات والمخزون', 'الشرح', 'منتجات مرتبطة'];
const LAST_STEP = STEPS.length;

const DISPLAYS: { id: ProductDisplay; label: string; icon: React.ElementType }[] = [
  { id: 'card', label: 'بطاقة', icon: LayoutGrid },
  { id: 'slide', label: 'شريحة', icon: GalleryHorizontal },
];

const num = (v: string) => {
  const n = parseFloat(v);
  return isFinite(n) && n > 0 ? n : 0;
};

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Finds the store catalog with this name under parentId, or creates it.
const ensureCatalog = (catalogs: ShopCatalog[], name: string, parentId: string | null): [ShopCatalog[], string] => {
  const found = catalogs.find((c) => (c.parentId || null) === parentId && sameName(c.name, name));
  if (found) return [catalogs, found.id];
  const created: ShopCatalog = { id: newId('cat'), name: name.trim(), parentId, images: [], createdAt: new Date().toISOString() };
  return [[...catalogs, created], created.id];
};

interface ProductEditorProps {
  data: ShopAdminData;
  update: (fn: (d: ShopAdminData) => ShopAdminData) => void;
  initial?: ShopProduct; // editing a product that is already in the warehouse
  onDone: (message: string) => void;
  onCancel?: () => void;
}

export const ProductEditor: React.FC<ProductEditorProps> = ({ data, update, initial, onDone, onCancel }) => {
  const [p, setP] = useState<ShopProduct>(() =>
    initial ? { ...initial } : { ...newProductDraft(data.settings.currency), sku: nextSku(data.products) }
  );
  const [slots, setSlots] = useState<string[]>(() => toSlots(initial?.images || []));
  const [path, setPath] = useState<PickerPath>(() => pathOf(initial, data.catalogs));
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const set = (patch: Partial<ShopProduct>) => setP((prev) => ({ ...prev, ...patch }));
  const isEdit = !!initial;

  const preview: ShopProduct = useMemo(() => ({
    ...p,
    images: slots.filter(Boolean),
    stock: p.variants.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock,
  }), [p, slots]);

  const suggested = useMemo(() => suggestedPresets(path.mainSlug, path.subSlug), [path.mainSlug, path.subSlug]);
  const pct = discountPercent(p);

  // "غير ذلك" + the green button: a catalog for this store only.
  const addCatalog = (name: string, parentName: string | null) =>
    update((d) => {
      let catalogs = d.catalogs;
      let parentId: string | null = null;
      if (parentName) [catalogs, parentId] = ensureCatalog(catalogs, parentName, null);
      [catalogs] = ensureCatalog(catalogs, name, parentId);
      return { ...d, catalogs };
    });

  const save = (target: ExportTarget) => {
    const published = target !== 'warehouse';
    const inWarehouse = target !== 'store';
    const name = p.name.trim();
    if (!name) {
      setStep(1);
      setError('اكتب اسم المنتج أولاً.');
      return;
    }
    setError('');
    const now = new Date().toISOString();
    const variants = buildVariants(p.options, p.variants);
    const product: ShopProduct = {
      ...p,
      id: p.id || newId('prd'),
      name,
      description: sanitizeHtml(p.description),
      shortDescription: p.shortDescription.trim(),
      images: slots.filter(Boolean),
      tiers: p.tiers.filter((t) => t.minQty > 1 && t.price > 0).sort((a, b) => a.minQty - b.minQty),
      options: p.options.filter((o) => o.name.trim()).map((o) => ({ ...o, name: o.name.trim() })),
      variants,
      stock: totalStock({ stock: p.stock, variants }),
      published,
      inWarehouse,
      relatedIds: p.relatedIds.slice(0, 5),
      createdAt: p.createdAt || now,
    };

    update((d) => {
      // Catalogs picked from artikel.json are created in the store when missing.
      let catalogs = d.catalogs;
      const pathChosen = path.mainName.trim() && path.mainKey !== 'other';
      const catalogIds = new Set(pathChosen ? [] : product.catalogIds);
      if (pathChosen) {
        let mainId: string;
        [catalogs, mainId] = ensureCatalog(catalogs, path.mainName, null);
        catalogIds.add(mainId);
        if (path.subName.trim() && path.subKey !== 'other') {
          let subId: string;
          [catalogs, subId] = ensureCatalog(catalogs, path.subName, mainId);
          catalogIds.add(subId);
        }
      }
      const saved = { ...product, catalogIds: Array.from(catalogIds) };

      // New stock is recorded as a purchase, per combination, for the accounts page.
      const before = d.products.find((x) => x.id === saved.id);
      const added: { qty: number; variant?: string }[] = [];
      if (!saved.inWarehouse) {
        // Sold from the store only: no stock, nothing to record.
      } else if (saved.variants.length) {
        for (const v of saved.variants) {
          const label = variantLabel(v.values);
          const old = before?.variants.find((x) => variantLabel(x.values) === label)?.stock ?? 0;
          if (v.stock > old) added.push({ qty: v.stock - old, variant: label });
        }
      } else {
        const old = before && !before.variants.length ? before.stock : 0;
        if (saved.stock > old) added.push({ qty: saved.stock - old });
      }
      const movements: ShopMovement[] = added.map((a) => ({
        id: newId('mov'), type: 'purchase', productId: saved.id,
        name: a.variant ? `${saved.name} (${a.variant})` : saved.name,
        qty: a.qty, unitAmount: saved.cost, createdAt: now,
      }));

      return {
        ...d,
        catalogs,
        products: before ? d.products.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...d.products],
        movements: [...movements, ...d.movements],
      };
    });
    onDone(
      target === 'store' ? `تم تصدير "${name}" إلى المتجر.`
        : target === 'warehouse' ? `تم حفظ "${name}" في المستودع.`
          : `تم تصدير "${name}" إلى المتجر والمستودع.`
    );
  };

  const setTier = (i: number, patch: Partial<{ minQty: number; price: number }>) =>
    set({ tiers: p.tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) });

  // The product needs a name before moving on from the first step.
  const goTo = (n: number) => {
    if (n > 1 && !p.name.trim()) {
      setStep(1);
      setError('اكتب اسم المنتج أولاً.');
      return;
    }
    setError('');
    setStep(n);
  };

  const nav = (
    <div className="flex items-center gap-2">
      {step > 1 && (
        <GhostButton onClick={() => goTo(step - 1)} className="h-11 flex items-center gap-1"><ArrowRight size={13} /> رجوع</GhostButton>
      )}
      {step < LAST_STEP && (
        <PrimaryButton onClick={() => goTo(step + 1)} className="flex-1 h-11 flex items-center justify-center gap-1.5">
          التالي: {STEPS[step]} <ArrowLeft size={14} />
        </PrimaryButton>
      )}
    </div>
  );

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_250px] gap-4 items-start">
      <div className="space-y-4 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <ArrowLeft size={12} className="text-neutral-300" />}
              <button
                type="button"
                onClick={() => goTo(i + 1)}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-bold transition cursor-pointer ${step === i + 1 ? 'bg-[#1d1d1f] text-white' : step > i + 1 ? 'bg-white text-[#1d1d1f] border border-neutral-200' : 'bg-white text-neutral-400 border border-neutral-200'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === i + 1 ? 'bg-white text-[#1d1d1f]' : 'bg-neutral-100'}`}>{i + 1}</span>
                {label}
              </button>
            </React.Fragment>
          ))}
          {onCancel && <GhostButton onClick={onCancel} className="mr-auto">إلغاء</GhostButton>}
        </div>
        {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold">{error}</div>}

        {step === 1 && (
          <Card title="المنتج">
            <CatalogPicker
              path={path}
              onChange={setPath}
              productName={p.name}
              onProductName={(name) => set({ name })}
              storeCatalogs={data.catalogs}
              onAddCatalog={addCatalog}
            />
          </Card>
        )}

        {step === 2 && (
          <Card title="الصور">
            <ImageSlots slots={slots} onChange={setSlots} />
            <Field label="طريقة عرض الصور">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GALLERY_LAYOUTS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => set({ galleryLayout: g.id })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition cursor-pointer ${p.galleryLayout === g.id ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-neutral-200 text-neutral-400 hover:border-neutral-300'}`}
                  >
                    <GalleryLayoutIcon layout={g.id} />
                    <span className="text-[10px] font-bold text-center leading-tight">{g.label}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="وسم على الصورة">
              <select className={inputClass} value={p.badge} onChange={(e) => set({ badge: e.target.value as ProductBadge })}>
                {PRODUCT_BADGES.map((b) => <option key={b.id || 'none'} value={b.id}>{b.label}</option>)}
              </select>
            </Field>
          </Card>
        )}

        {step === 3 && (
          <Card title="السعر">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="السعر">
                <input className={inputClass} type="number" min="0" inputMode="decimal" value={p.price || ''} onChange={(e) => set({ price: num(e.target.value) })} />
              </Field>
              <Field label="السعر الأصلي (مشطوب)">
                <input className={inputClass} type="number" min="0" inputMode="decimal" value={p.oldPrice || ''} onChange={(e) => set({ oldPrice: num(e.target.value) })} />
              </Field>
              <Field label="العملة">
                <select className={inputClass} value={p.currency} onChange={(e) => set({ currency: e.target.value })}>
                  {Array.from(new Set([p.currency, ...CURRENCIES])).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="سعر الشراء" hint="لحساب الأرباح، لا يظهر للزبون.">
                <input className={inputClass} type="number" min="0" inputMode="decimal" value={p.cost || ''} onChange={(e) => set({ cost: num(e.target.value) })} />
              </Field>
            </div>
            {pct > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#ff3b30]"><Percent size={12} /> خصم {pct}% عن السعر الأصلي</div>
            )}

            <Field label="سعر خاص عند شراء كمية أكبر">
              <div className="space-y-2">
                {p.tiers.map((t, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 text-xs font-bold text-neutral-600">
                    <span>عند شراء</span>
                    <input className={`${inputFitClass} h-9 w-20`} type="number" min="2" value={t.minQty || ''} onChange={(e) => setTier(i, { minQty: Math.floor(num(e.target.value)) })} aria-label="الكمية" />
                    <span>أو أكثر: سعر القطعة</span>
                    <input className={`${inputFitClass} h-9 w-28`} type="number" min="0" value={t.price || ''} onChange={(e) => setTier(i, { price: num(e.target.value) })} aria-label="سعر القطعة" />
                    <span>{p.currency}</span>
                    <button type="button" onClick={() => set({ tiers: p.tiers.filter((_, idx) => idx !== i) })} className="w-8 h-8 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer" aria-label="حذف المستوى">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {p.tiers.length < MAX_PRICE_TIERS && (
                  <GhostButton
                    onClick={() => set({ tiers: [...p.tiers, { minQty: (p.tiers[p.tiers.length - 1]?.minQty || 1) + 1, price: 0 }] })}
                    className="flex items-center gap-1"
                  >
                    <Plus size={13} /> إضافة مستوى ({p.tiers.length}/{MAX_PRICE_TIERS})
                  </GhostButton>
                )}
              </div>
            </Field>

            <Field label="سعر التوصيل لهذا المنتج" hint={`اتركه فارغاً لاستعمال رسم التوصيل العام للمتجر (${data.settings.delivery.deliveryFee || 0} ${data.settings.currency}).`}>
              <input
                className={`${inputFitClass} w-40`}
                type="number"
                min="0"
                value={p.deliveryPrice ?? ''}
                onChange={(e) => set({ deliveryPrice: e.target.value === '' ? null : Math.max(0, parseFloat(e.target.value) || 0) })}
              />
            </Field>
          </Card>
        )}

        {step === 4 && (
          <Card title="المواصفات والمخزون" actions={isEdit ? <span className="text-[10px] text-neutral-400">مرتبط بالمستودع</span> : undefined}>
            <OptionsEditor
              options={p.options}
              variants={p.variants}
              stock={p.stock}
              suggested={suggested}
              linkedToWarehouse={isEdit}
              currency={p.currency}
              onChange={(patch) => set(patch)}
            />
            <Field label="رقم المنتج" hint="يُعطى تلقائياً بالتسلسل بدءاً من 0، ويمكنك تغييره. يُستعمل لربط المنتجات المرتبطة.">
              <input className={`${inputFitClass} w-48`} value={p.sku} onChange={(e) => set({ sku: e.target.value })} dir="ltr" />
            </Field>
          </Card>
        )}

        {step === 5 && (
          <Card title="شرح المنتج">
            <RichTextEditor value={p.description} onChange={(description) => set({ description })} placeholder="اكتب وصفاً كاملاً للمنتج: المزايا، طريقة الاستعمال، المحتويات…" />
            <Field label="شرح قصير تحت الاسم">
              <input className={inputClass} value={p.shortDescription} maxLength={120} onChange={(e) => set({ shortDescription: e.target.value })} placeholder="مثال: قطن 100%، مريح للاستعمال اليومي" />
            </Field>
            <Toggle checked={p.showShortDescription} onChange={(showShortDescription) => set({ showShortDescription })} label="إظهار الشرح القصير في صفحة المتجر" />
          </Card>
        )}

        {step === 6 && (
          <>
            <Card title="منتجات مرتبطة" actions={<span className="text-[10px] text-neutral-400">تظهر أسفل البطاقة العائمة، حتى 5</span>}>
              <RelatedProductsPicker
                productId={p.id}
                selected={p.relatedIds}
                products={data.products}
                catalogs={data.catalogs}
                onChange={(relatedIds) => set({ relatedIds })}
              />
            </Card>

            <div className="grid sm:grid-cols-2 gap-2">
              <PrimaryButton onClick={() => save('both')} className="sm:col-span-2 h-12 flex items-center justify-center gap-1.5 text-sm">
                <Store size={16} /> <Warehouse size={16} /> تصدير إلى المتجر والمستودع معاً
              </PrimaryButton>
              <GhostButton onClick={() => save('store')} className="h-11 flex items-center justify-center gap-1.5 text-sm">
                <Store size={16} /> المتجر فقط
              </GhostButton>
              <GhostButton onClick={() => save('warehouse')} className="h-11 flex items-center justify-center gap-1.5 text-sm">
                <Warehouse size={16} /> المستودع فقط
              </GhostButton>
            </div>
            <ul className="text-[11px] text-neutral-400 leading-relaxed list-disc pr-4 space-y-0.5">
              <li><b>معاً:</b> يظهر في صفحة المتجر وتُحسب كميته في المستودع، ويُخصم منها عند كل طلب.</li>
              <li><b>المتجر فقط:</b> يظهر في المتجر دون حساب كمية، مناسب لما يُصنع حسب الطلب.</li>
              <li><b>المستودع فقط:</b> يُحفظ دون أن يظهر للزبائن، ويمكنك عرضه لاحقاً من المستودع.</li>
            </ul>
          </>
        )}

        {nav}
      </div>

      <aside className="lg:sticky lg:top-0 space-y-2">
        <div className="text-[11px] font-bold text-neutral-400">هكذا يظهر في المتجر</div>
        {p.display === 'slide' ? <ProductSlide product={preview} /> : <ProductCard product={preview} />}
        <div>
          <div className="text-[11px] font-bold text-neutral-500 mb-1">طريقة الإدراج في المتجر</div>
          <div className="grid grid-cols-2 gap-1.5">
            {DISPLAYS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => set({ display: d.id })}
                className={`h-9 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${p.display === d.id ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}
              >
                <d.icon size={14} /> {d.label}
              </button>
            ))}
          </div>
          {p.display === 'slide' && (
            <p className="mt-1 text-[10px] text-neutral-400 leading-relaxed">يظهر المنتج بعرض الصف كاملاً: الصورة الأساسية خلفية، والاسم والسعر والزر في شريط أسفلها.</p>
          )}
        </div>
        {preview.options.some((o) => o.values.length) && (
          <div className="text-[10px] text-neutral-400 leading-relaxed">
            {preview.options.filter((o) => o.values.length).map((o) => `${o.name}: ${o.values.map((v) => v.label).join('، ')}`).join(' · ')}
          </div>
        )}
      </aside>
    </div>
  );
};
