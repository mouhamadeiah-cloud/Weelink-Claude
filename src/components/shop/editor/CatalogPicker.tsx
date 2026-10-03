// Picks where a product belongs from artikel.json: main catalog → sub catalog → product name,
// with a keyword search across all three. Every step also accepts "غير ذلك" with a typed name.
import React, { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, ChevronLeft } from 'lucide-react';
import { ArtikelCatalog, loadArtikel, searchArtikel } from '../artikel';
import { Field, inputClass } from '../adminUi';

// id: null = not chosen, 0 = "غير ذلك" (typed name), otherwise the artikel.json id.
export interface PickerPath {
  mainId: number | null;
  mainName: string;
  mainSlug: string;
  subId: number | null;
  subName: string;
  subSlug: string;
  itemId: number | null;
}

export const emptyPickerPath: PickerPath = {
  mainId: null, mainName: '', mainSlug: '', subId: null, subName: '', subSlug: '', itemId: null,
};

const OTHER = '__other__';

interface CatalogPickerProps {
  path: PickerPath;
  onChange: (path: PickerPath) => void;
  productName: string;
  onProductName: (name: string) => void;
}

export const CatalogPicker: React.FC<CatalogPickerProps> = ({ path, onChange, productName, onProductName }) => {
  const [catalogs, setCatalogs] = useState<ArtikelCatalog[] | null>(null);
  const [query, setQuery] = useState('');
  const [typingName, setTypingName] = useState(false);

  useEffect(() => {
    let alive = true;
    loadArtikel().then((c) => alive && setCatalogs(c)).catch(() => alive && setCatalogs([]));
    return () => { alive = false; };
  }, []);

  const main = catalogs?.find((c) => c.id === path.mainId);
  const sub = main?.subcategories.find((s) => s.id === path.subId);
  const hits = useMemo(() => (catalogs ? searchArtikel(catalogs, query) : []), [catalogs, query]);

  if (!catalogs) {
    return <div className="flex items-center gap-2 text-xs text-neutral-400"><Loader2 size={14} className="animate-spin" /> جاري تحميل الكاتالوكات…</div>;
  }

  const pickMain = (value: string) => {
    if (value === OTHER) return onChange({ ...emptyPickerPath, mainId: 0 });
    const c = catalogs.find((x) => String(x.id) === value);
    onChange(c ? { ...emptyPickerPath, mainId: c.id, mainName: c.name_ar, mainSlug: c.slug } : emptyPickerPath);
  };

  const pickSub = (value: string) => {
    const base = { ...path, subId: null, subName: '', subSlug: '', itemId: null };
    if (value === OTHER) return onChange({ ...base, subId: 0 });
    const s = main?.subcategories.find((x) => String(x.id) === value);
    onChange(s ? { ...base, subId: s.id, subName: s.name_ar, subSlug: s.slug } : base);
  };

  const pickItem = (value: string) => {
    if (value === OTHER) {
      setTypingName(true);
      onChange({ ...path, itemId: 0 });
      return;
    }
    const item = sub?.items.find((x) => String(x.id) === value);
    setTypingName(false);
    onChange({ ...path, itemId: item ? item.id : null });
    if (item) onProductName(item.name_ar);
  };

  const pickHit = (i: number) => {
    const h = hits[i];
    onChange({
      mainId: h.catalog.id, mainName: h.catalog.name_ar, mainSlug: h.catalog.slug,
      subId: h.sub.id, subName: h.sub.name_ar, subSlug: h.sub.slug,
      itemId: h.item ? h.item.id : null,
    });
    if (h.item) onProductName(h.item.name_ar);
    setQuery('');
  };

  const selectValue = (id: number | null) => (id === null ? '' : id === 0 ? OTHER : String(id));

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

      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="الكاتالوك الرئيسي">
          <select className={inputClass} value={selectValue(path.mainId)} onChange={(e) => pickMain(e.target.value)}>
            <option value="">— اختر —</option>
            {catalogs.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            <option value={OTHER}>غير ذلك…</option>
          </select>
          {path.mainId === 0 && (
            <input className={inputClass} placeholder="اسم الكاتالوك" value={path.mainName} onChange={(e) => onChange({ ...path, mainName: e.target.value })} autoFocus />
          )}
        </Field>
        <Field label="الكاتالوك الفرعي">
          <select className={inputClass} value={selectValue(path.subId)} onChange={(e) => pickSub(e.target.value)} disabled={path.mainId === null}>
            <option value="">— اختر —</option>
            {main?.subcategories.map((s) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
            <option value={OTHER}>غير ذلك…</option>
          </select>
          {path.subId === 0 && (
            <input className={inputClass} placeholder="اسم الكاتالوك الفرعي" value={path.subName} onChange={(e) => onChange({ ...path, subName: e.target.value })} />
          )}
        </Field>
        <Field label="المنتج">
          <select className={inputClass} value={selectValue(path.itemId)} onChange={(e) => pickItem(e.target.value)} disabled={path.subId === null}>
            <option value="">— اختر —</option>
            {sub?.items.map((it) => <option key={it.id} value={it.id}>{it.name_ar}</option>)}
            <option value={OTHER}>غير ذلك…</option>
          </select>
        </Field>
      </div>

      <Field label="اسم المنتج كما يظهر في المتجر" hint={typingName || path.itemId === 0 ? undefined : 'يُملأ تلقائياً عند اختيار منتج، ويمكنك تعديله، مثلاً بإضافة الماركة أو الموديل.'}>
        <input className={inputClass} value={productName} onChange={(e) => onProductName(e.target.value)} placeholder="مثال: آيفون 15 برو 256GB" />
      </Field>
    </div>
  );
};
