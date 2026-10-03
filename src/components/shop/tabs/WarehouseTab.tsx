// المستودع: every product with its stock (per combination for products with stock options);
// edit, restock (recorded as a purchase), show on / hide from the store, or delete. The list can
// be searched, filtered by catalog, store status, stock and badge, and sorted.
import React, { useState } from 'react';
import { Search, Pencil, Trash2, PackagePlus, AlertTriangle, Eye, EyeOff, X } from 'lucide-react';
import { ShopProduct, PRODUCT_BADGES, newId } from '../shopTypes';
import { Card, inputClass, inputFitClass, PrimaryButton, GhostButton, EmptyState, formatMoney } from '../adminUi';
import { AdminTabProps } from './tabProps';
import { ProductEditor } from '../editor/ProductEditor';
import { changeStock, tracksStock, unitPriceFor, variantLabel } from '../productModel';

const LOW_STOCK = 3;

type StatusFilter = '' | 'published' | 'hidden' | 'store-only';
type StockFilter = '' | 'available' | 'low' | 'out';
type SortBy = 'newest' | 'oldest' | 'name' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'sku';

interface Filters {
  catalog: string;
  status: StatusFilter;
  stock: StockFilter;
  badge: string;
  sort: SortBy;
}

const NO_FILTERS: Filters = { catalog: '', status: '', stock: '', badge: '', sort: 'newest' };

const SORTS: { id: SortBy; label: string }[] = [
  { id: 'newest', label: 'الأحدث' },
  { id: 'oldest', label: 'الأقدم' },
  { id: 'name', label: 'الاسم' },
  { id: 'sku', label: 'رقم المنتج' },
  { id: 'price-asc', label: 'الأرخص' },
  { id: 'price-desc', label: 'الأغلى' },
  { id: 'stock-asc', label: 'الأقل كمية' },
  { id: 'stock-desc', label: 'الأكثر كمية' },
];

// Store-only products have no stock: they sort after every counted product.
const stockKey = (p: ShopProduct) => (tracksStock(p) ? p.stock : Infinity);
const skuKey = (p: ShopProduct) => (/^\d+$/.test(p.sku) ? Number(p.sku) : Infinity);

const compare = (sort: SortBy) => (a: ShopProduct, b: ShopProduct): number => {
  switch (sort) {
    case 'oldest': return a.createdAt.localeCompare(b.createdAt);
    case 'name': return a.name.localeCompare(b.name, 'ar');
    case 'sku': return skuKey(a) - skuKey(b) || a.sku.localeCompare(b.sku);
    case 'price-asc': return unitPriceFor(a, 1) - unitPriceFor(b, 1);
    case 'price-desc': return unitPriceFor(b, 1) - unitPriceFor(a, 1);
    case 'stock-asc': return stockKey(a) - stockKey(b);
    case 'stock-desc': return (tracksStock(b) ? b.stock : -1) - (tracksStock(a) ? a.stock : -1);
    default: return b.createdAt.localeCompare(a.createdAt);
  }
};

const toNumber = (v: string) => {
  const n = parseFloat(v);
  return isFinite(n) && n > 0 ? n : 0;
};

export const WarehouseTab: React.FC<AdminTabProps> = ({ data, update }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [restock, setRestock] = useState<{ id: string; qty: string; cost: string; variant: string } | null>(null);
  const currency = data.settings.currency;

  const catalogName = (id: string) => data.catalogs.find((c) => c.id === id)?.name;
  const q = query.trim().toLowerCase();
  const setFilter = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const mains = data.catalogs.filter((c) => !c.parentId);
  // A main catalog also matches the products in its sub catalogs.
  const catalogIds = filters.catalog
    ? [filters.catalog, ...data.catalogs.filter((c) => c.parentId === filters.catalog).map((c) => c.id)]
    : [];
  const filtering = q !== '' || filters.catalog !== '' || filters.status !== '' || filters.stock !== '' || filters.badge !== '';
  const list = data.products
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    .filter((p) => !catalogIds.length || p.catalogIds.some((id) => catalogIds.includes(id)))
    .filter((p) =>
      filters.status === 'published' ? p.published
        : filters.status === 'hidden' ? !p.published
          : filters.status === 'store-only' ? !tracksStock(p)
            : true)
    .filter((p) =>
      !filters.stock ? true
        : !tracksStock(p) ? false
          : filters.stock === 'out' ? p.stock <= 0
            : filters.stock === 'low' ? p.stock > 0 && p.stock <= LOW_STOCK
              : p.stock > 0)
    .filter((p) => !filters.badge || p.badge === filters.badge)
    .sort(compare(filters.sort));
  const stockValue = data.products.filter(tracksStock).reduce((s, p) => s + p.stock * p.cost, 0);

  const saveRestock = () => {
    if (!restock) return;
    const qty = Math.floor(toNumber(restock.qty));
    if (qty <= 0) return;
    const product = data.products.find((p) => p.id === restock.id);
    if (!product) return;
    if (product.variants.length && !restock.variant) return;
    const unitCost = restock.cost.trim() ? toNumber(restock.cost) : product.cost;
    const name = restock.variant ? `${product.name} (${restock.variant})` : product.name;
    update((d) => ({
      ...d,
      products: d.products.map((p) => (p.id === product.id ? { ...changeStock(p, qty, restock.variant || undefined), cost: unitCost } : p)),
      movements: [
        { id: newId('mov'), type: 'purchase', productId: product.id, name, qty, unitAmount: unitCost, createdAt: new Date().toISOString() },
        ...d.movements,
      ],
    }));
    setRestock(null);
  };

  const remove = (p: ShopProduct) => {
    if (!window.confirm(`حذف "${p.name}" من المستودع وكل الكاتالوكات؟`)) return;
    update((d) => ({ ...d, products: d.products.filter((x) => x.id !== p.id) }));
  };

  const togglePublished = (p: ShopProduct) =>
    update((d) => ({ ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, published: !x.published } : x)) }));

  if (editing) {
    return <ProductEditor key={editing.id} data={data} update={update} initial={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'عدد المنتجات', value: String(data.products.length) },
          { label: 'إجمالي القطع', value: String(data.products.filter(tracksStock).reduce((s, p) => s + p.stock, 0)) },
          { label: 'قيمة المخزون', value: formatMoney(stockValue, currency) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-neutral-200 rounded-2xl p-3">
            <div className="text-[10px] font-bold text-neutral-400">{s.label}</div>
            <div className="text-base sm:text-lg font-black text-[#1d1d1f] mt-1 truncate">{s.value}</div>
          </div>
        ))}
      </div>

      <Card
        title="المنتجات"
        actions={
          <div className="relative w-48 sm:w-64">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input className={`${inputClass} h-9 pr-8`} placeholder="بحث بالاسم أو الرمز" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        }
      >
        {data.products.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <select className={`${inputClass} h-9 text-xs`} value={filters.catalog} onChange={(e) => setFilter({ catalog: e.target.value })} aria-label="فلترة بالكاتالوك">
                <option value="">كل الكاتالوكات</option>
                {mains.map((m) => (
                  <React.Fragment key={m.id}>
                    <option value={m.id}>{m.name}</option>
                    {data.catalogs.filter((c) => c.parentId === m.id).map((c) => <option key={c.id} value={c.id}>— {c.name}</option>)}
                  </React.Fragment>
                ))}
              </select>
              <select className={`${inputClass} h-9 text-xs`} value={filters.status} onChange={(e) => setFilter({ status: e.target.value as StatusFilter })} aria-label="فلترة بالحالة">
                <option value="">كل الحالات</option>
                <option value="published">معروض في المتجر</option>
                <option value="hidden">مخفي (المستودع فقط)</option>
                <option value="store-only">بدون مخزون (المتجر فقط)</option>
              </select>
              <select className={`${inputClass} h-9 text-xs`} value={filters.stock} onChange={(e) => setFilter({ stock: e.target.value as StockFilter })} aria-label="فلترة بالمخزون">
                <option value="">كل الكميات</option>
                <option value="available">متوفر</option>
                <option value="low">كمية قليلة ({LOW_STOCK} أو أقل)</option>
                <option value="out">نفد</option>
              </select>
              <select className={`${inputClass} h-9 text-xs`} value={filters.badge} onChange={(e) => setFilter({ badge: e.target.value })} aria-label="فلترة بالوسم">
                <option value="">كل الوسوم</option>
                {PRODUCT_BADGES.filter((b) => b.id).map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
              <select className={`${inputClass} h-9 text-xs col-span-2 sm:col-span-1`} value={filters.sort} onChange={(e) => setFilter({ sort: e.target.value as SortBy })} aria-label="الترتيب">
                {SORTS.map((s) => <option key={s.id} value={s.id}>ترتيب: {s.label}</option>)}
              </select>
            </div>
            {filtering && (
              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                <span>{list.length} من {data.products.length} منتج</span>
                <button
                  type="button"
                  onClick={() => { setFilters((f) => ({ ...NO_FILTERS, sort: f.sort })); setQuery(''); }}
                  className="h-7 px-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X size={11} /> مسح الفلاتر
                </button>
              </div>
            )}
          </div>
        )}
        {list.length === 0 ? (
          <EmptyState text={data.products.length ? 'لا منتجات تطابق البحث أو الفلاتر.' : 'المستودع فارغ. أضف منتجات من "إضافة منتج".'} />
        ) : (
          <div className="space-y-2">
            {list.map((p) => (
              <div key={p.id} className="p-2.5 rounded-xl border border-neutral-100 bg-[#fbfbfd] space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                    {p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#1d1d1f] truncate">{p.name}</div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {formatMoney(p.price, p.currency || currency)}
                      {p.catalogIds.length > 0 && ` · ${p.catalogIds.map(catalogName).filter(Boolean).join('، ')}`}
                    </div>
                  </div>
                  {tracksStock(p) ? (
                    <div className={`text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1 ${p.stock <= LOW_STOCK ? 'bg-amber-50 text-amber-600' : 'bg-neutral-100 text-neutral-700'}`}>
                      {p.stock <= LOW_STOCK && <AlertTriangle size={12} />}
                      {p.stock}
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-[#0071e3]" title="يُباع من المتجر دون حساب كمية">بدون مخزون</div>
                  )}
                  <button
                    type="button"
                    onClick={() => togglePublished(p)}
                    className={`h-8 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${p.published ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}
                    title={p.published ? 'معروض في صفحة المتجر. اضغط للإخفاء' : 'محفوظ في المستودع فقط. اضغط للعرض في المتجر'}
                  >
                    {p.published ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span className="hidden sm:inline">{p.published ? 'في المتجر' : 'مخفي'}</span>
                  </button>
                  <button type="button" disabled={!tracksStock(p)} onClick={() => setRestock({ id: p.id, qty: '', cost: '', variant: '' })} className="disabled:opacity-25 disabled:pointer-events-none w-8 h-8 rounded-lg text-[#0071e3] hover:bg-blue-50 flex items-center justify-center cursor-pointer" aria-label="إضافة كمية" title="إضافة كمية للمخزون">
                    <PackagePlus size={15} />
                  </button>
                  <button type="button" onClick={() => setEditing(p)} className="w-8 h-8 rounded-lg text-neutral-500 hover:bg-neutral-100 flex items-center justify-center cursor-pointer" aria-label="تعديل">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => remove(p)} className="w-8 h-8 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer" aria-label="حذف">
                    <Trash2 size={14} />
                  </button>
                </div>
                {p.variants.length > 0 && tracksStock(p) && (
                  <div className="flex flex-wrap gap-1">
                    {p.variants.map((v) => (
                      <span key={variantLabel(v.values)} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${v.stock <= 0 ? 'bg-neutral-100 text-neutral-400 line-through' : v.stock <= LOW_STOCK ? 'bg-amber-50 text-amber-600' : 'bg-white border border-neutral-100 text-neutral-600'}`}>
                        {variantLabel(v.values)}: {v.stock}
                      </span>
                    ))}
                  </div>
                )}
                {restock?.id === p.id && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {p.variants.length > 0 && (
                      <select className={`${inputFitClass} h-9 w-44`} value={restock.variant} onChange={(e) => setRestock({ ...restock, variant: e.target.value })} aria-label="التركيبة">
                        <option value="">— التركيبة —</option>
                        {p.variants.map((v) => <option key={variantLabel(v.values)} value={variantLabel(v.values)}>{variantLabel(v.values)} ({v.stock})</option>)}
                      </select>
                    )}
                    <input className={`${inputFitClass} h-9 w-28`} type="number" min="1" placeholder="الكمية" value={restock.qty} onChange={(e) => setRestock({ ...restock, qty: e.target.value })} autoFocus />
                    <input className={`${inputFitClass} h-9 w-36`} type="number" min="0" placeholder={`سعر الشراء (${p.cost})`} value={restock.cost} onChange={(e) => setRestock({ ...restock, cost: e.target.value })} />
                    <PrimaryButton onClick={saveRestock} className="h-9">إضافة للمخزون</PrimaryButton>
                    <GhostButton onClick={() => setRestock(null)}>إلغاء</GhostButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
