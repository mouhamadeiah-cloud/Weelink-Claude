// Picks where a product belongs: main catalog → sub catalog → product name, from artikel.json plus
// the catalogs this store added itself, with a keyword search over artikel.json. Choosing
// "غير ذلك" and typing a name shows a green button that adds the catalog to this store only
// (artikel.json and other users are not affected).
import React, { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, ChevronLeft, Plus } from 'lucide-react';
import { ShopCatalog } from '../shopTypes';
import { ArtikelCatalog, loadArtikel, normalizeSearch, searchArtikel } from '../artikel';
import { Field, inputClass } from '../adminUi';

// key: '' = not chosen, 'a:<id>' = from artikel.json, 'c:<name>' = the store's own catalog,
// 'other' = typing a new name.
export interface PickerPath {
  mainKey: string;
  mainName: string;
  mainSlug: string;
  subKey: string;
  subName: string;
  subSlug: string;
  itemId: number | null;
}

export const emptyPickerPath: PickerPath = {
  mainKey: '', mainName: '', mainSlug: '', subKey: '', subName: '', subSlug: '', itemId: null,
};

const OTHER = 'other';
const same = (a: string, b: string) => normalizeSearch(a) === normalizeSearch(b);

interface CatalogPickerProps {
  path: PickerPath;
  onChange: (path: PickerPath) => void;
  productName: string;
  onProductName: (name: string) => void;
  storeCatalogs: ShopCatalog[];
  onAddCatalog: (name: string, parentName: string | null) => void;
}

export const CatalogPicker: React.FC<CatalogPickerProps> = ({ path, onChange, productName, onProductName, storeCatalogs, onAddCatalog }) => {
  const [catalogs, setCatalogs] = useState<ArtikelCatalog[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    loadArtikel().then((c) => alive && setCatalogs(c)).catch(() => alive && setCatalogs([]));
    return () => { alive = false; };
  }, []);

  const main = catalogs?.find((c) => `a:${c.id}` === path.mainKey);
  const sub = main?.subcategories.find((s) => `a:${s.id}` === path.subKey);
  const hits = useMemo(() => (catalogs ? searchArtikel(catalogs, query) : []), [catalogs, query]);

  // The store's own catalogs: those whose names are not in artikel.json.
  const customMains = useMemo(
    () => storeCatalogs.filter((c) => !c.parentId && !(catalogs || []).some((a) => same(a.name_ar, c.name))),
    [storeCatalogs, catalogs]
  );
  const storeMain = storeCatalogs.find((c) => !c.parentId && same(c.name, path.mainName));
  const customSubs = useMemo(
    () => (storeMain ? storeCatalogs.filter((c) => c.parentId === storeMain.id && !(main?.subcategories || []).some((s) => same(s.name_ar, c.name))) : []),
    [storeCatalogs, storeMain, main]
  );

  // A path set by name only (editing a saved product): resolve its keys once artikel.json is here.
  useEffect(() => {
    if (!catalogs || path.mainKey || !path.mainName) return;
    const a = catalogs.find((c) => same(c.name_ar, path.mainName));
    const s = a?.subcategories.find((x) => same(x.name_ar, path.subName));
    onChange({
      ...path,
      mainKey: a ? `a:${a.id}` : `c:${path.mainName}`,
      mainSlug: a?.slug || '',
      subKey: !path.subName ? '' : s ? `a:${s.id}` : `c:${path.subName}`,
      subSlug: s?.slug || '',
    });
  }, [catalogs, path, onChange]);

  if (!catalogs) {
    return <div className="flex items-center gap-2 text-xs text-neutral-400"><Loader2 size={14} className="animate-spin" /> جاري تحميل التصنيفات…</div>;
  }

  const pickMain = (value: string) => {
    if (value === OTHER) return onChange({ ...emptyPickerPath, mainKey: OTHER });
    if (value.startsWith('c:')) return onChange({ ...emptyPickerPath, mainKey: value, mainName: value.slice(2) });
    const c = catalogs.find((x) => `a:${x.id}` === value);
    onChange(c ? { ...emptyPickerPath, mainKey: value, mainName: c.name_ar, mainSlug: c.slug } : emptyPickerPath);
  };

  const pickSub = (value: string) => {
    const base = { ...path, subKey: '', subName: '', subSlug: '', itemId: null };
    if (value === OTHER) return onChange({ ...base, subKey: OTHER });
    if (value.startsWith('c:')) return onChange({ ...base, subKey: value, subName: value.slice(2) });
    const s = main?.subcategories.find((x) => `a:${x.id}` === value);
    onChange(s ? { ...base, subKey: value, subName: s.name_ar, subSlug: s.slug } : base);
  };

  const pickItem = (value: string) => {
    const item = sub?.items.find((x) => String(x.id) === value);
    onChange({ ...path, itemId: item ? item.id : value === OTHER ? 0 : null });
    if (item) onProductName(item.name_ar);
  };

  const pickHit = (i: number) => {
    const h = hits[i];
    onChange({
      mainKey: `a:${h.catalog.id}`, mainName: h.catalog.name_ar, mainSlug: h.catalog.slug,
      subKey: `a:${h.sub.id}`, subName: h.sub.name_ar, subSlug: h.sub.slug,
      itemId: h.item ? h.item.id : null,
    });
    if (h.item) onProductName(h.item.name_ar);
    setQuery('');
  };

  const addMain = () => {
    const name = path.mainName.trim();
    if (!name) return;
    onAddCatalog(name, null);
    onChange({ ...emptyPickerPath, mainKey: `c:${name}`, mainName: name });
  };
  const addSub = () => {
    const name = path.subName.trim();
    if (!name || !path.mainName.trim()) return;
    onAddCatalog(name, path.mainName.trim());
    onChange({ ...path, subKey: `c:${name}`, subName: name, subSlug: '', itemId: null });
  };

  const GreenAdd: React.FC<{ onClick: () => void; disabled: boolean }> = ({ onClick, disabled }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-9 rounded-xl bg-[#34c759] hover:bg-[#2fb350] disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
    >
      <Plus size={14} /> إضافة التصنيف إلى متجري
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          className={`${inputClass} pr-9`}
          placeholder="ابحث عن المنتج، مثلاً: آيفون، قميص، عسل…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {hits.length > 0 && (
          <div className="absolute z-20 inset-x-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
            {hits.map((h, i) => (
              <button
                key={`${h.sub.id}-${h.item?.id ?? 's'}`}
                type="button"
                onClick={() => pickHit(i)}
                className="w-full text-right px-3 py-2 hover:bg-neutral-50 flex items-center gap-1 text-xs cursor-pointer border-b border-neutral-100 last:border-0"
              >
                <span className="text-neutral-400">{h.catalog.name_ar}</span>
                <ChevronLeft size={12} className="text-neutral-300" />
                <span className={h.item ? 'text-neutral-400' : 'font-bold text-[#1d1d1f]'}>{h.sub.name_ar}</span>
                {h.item && (
                  <>
                    <ChevronLeft size={12} className="text-neutral-300" />
                    <span className="font-bold text-[#1d1d1f]">{h.item.name_ar}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-3 items-start">
        <Field label="التصنيف الرئيسي">
          <select className={inputClass} value={path.mainKey} onChange={(e) => pickMain(e.target.value)}>
            <option value="">— اختر —</option>
            {customMains.length > 0 && (
              <optgroup label="تصنيفات متجري">
                {customMains.map((c) => <option key={c.id} value={`c:${c.name}`}>{c.name}</option>)}
              </optgroup>
            )}
            {catalogs.map((c) => <option key={c.id} value={`a:${c.id}`}>{c.name_ar}</option>)}
            <option value={OTHER}>غير ذلك…</option>
          </select>
          {path.mainKey === OTHER && (
            <>
              <input className={inputClass} placeholder="اسم التصنيف الجديد" value={path.mainName} onChange={(e) => onChange({ ...path, mainName: e.target.value })} autoFocus />
              <GreenAdd onClick={addMain} disabled={!path.mainName.trim()} />
            </>
          )}
        </Field>
        <Field label="التصنيف الفرعي">
          <select className={inputClass} value={path.subKey} onChange={(e) => pickSub(e.target.value)} disabled={!path.mainKey || path.mainKey === OTHER}>
            <option value="">— اختر —</option>
            {customSubs.length > 0 && (
              <optgroup label="تصنيفات متجري">
                {customSubs.map((c) => <option key={c.id} value={`c:${c.name}`}>{c.name}</option>)}
              </optgroup>
            )}
            {main?.subcategories.map((s) => <option key={s.id} value={`a:${s.id}`}>{s.name_ar}</option>)}
            <option value={OTHER}>غير ذلك…</option>
          </select>
          {path.subKey === OTHER && (
            <>
              <input className={inputClass} placeholder="اسم التصنيف الفرعي الجديد" value={path.subName} onChange={(e) => onChange({ ...path, subName: e.target.value })} autoFocus />
              <GreenAdd onClick={addSub} disabled={!path.subName.trim()} />
            </>
          )}
        </Field>
        <Field label="المنتج">
          <select className={inputClass} value={path.itemId === null ? '' : path.itemId === 0 ? OTHER : String(path.itemId)} onChange={(e) => pickItem(e.target.value)} disabled={!sub}>
            <option value="">— اختر —</option>
            {sub?.items.map((it) => <option key={it.id} value={it.id}>{it.name_ar}</option>)}
            <option value={OTHER}>غير ذلك (اكتب الاسم بالأسفل)</option>
          </select>
        </Field>
      </div>

      <Field label="اسم المنتج كما يظهر في المتجر" hint="يُملأ تلقائياً عند اختيار منتج، ويمكنك تعديله، مثلاً بإضافة الماركة أو الموديل.">
        <input className={inputClass} value={productName} onChange={(e) => onProductName(e.target.value)} placeholder="مثال: آيفون 15 برو 256GB" />
      </Field>
    </div>
  );
};
