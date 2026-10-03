// إضافة منتج: a new product entered by hand, or a warehouse product completed and exported to
// the store. Both use the two-step product editor.
import React, { useState } from 'react';
import { Warehouse, PenLine, CheckCircle2, Search } from 'lucide-react';
import { ShopProduct } from '../shopTypes';
import { Card, inputClass, EmptyState, formatMoney } from '../adminUi';
import { AdminTabProps } from './tabProps';
import { ProductEditor } from '../editor/ProductEditor';
import { totalStock } from '../productModel';

export const AddProductTab: React.FC<AdminTabProps> = ({ data, update }) => {
  const [mode, setMode] = useState<'manual' | 'warehouse'>('manual');
  const [picked, setPicked] = useState<ShopProduct | null>(null);
  const [query, setQuery] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const finish = (msg: string) => {
    setDone(msg);
    setPicked(null);
    setEditorKey((k) => k + 1); // fresh, empty editor for the next product
    window.setTimeout(() => setDone(null), 3000);
  };

  const q = query.trim().toLowerCase();
  const list = data.products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-neutral-100 rounded-2xl w-full sm:w-fit">
        {([
          { id: 'manual', label: 'إدخال يدوي', icon: PenLine },
          { id: 'warehouse', label: 'من المستودع', icon: Warehouse },
        ] as const).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMode(m.id); setPicked(null); }}
            className={`flex-1 sm:flex-none h-9 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === m.id ? 'bg-white text-[#0071e3] shadow-sm' : 'text-neutral-500'
            }`}
          >
            <m.icon size={14} />
            {m.label}
          </button>
        ))}
      </div>

      {done && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">
          <CheckCircle2 size={15} /> {done}
        </div>
      )}

      {mode === 'manual' ? (
        <ProductEditor key={`new-${editorKey}`} data={data} update={update} onDone={finish} />
      ) : picked ? (
        <ProductEditor key={picked.id} data={data} update={update} initial={picked} onDone={finish} onCancel={() => setPicked(null)} />
      ) : (
        <Card
          title="اختر منتجاً من المستودع"
          actions={
            <div className="relative w-48 sm:w-64">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input className={`${inputClass} h-9 pr-8`} placeholder="بحث بالاسم أو الرمز" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          }
        >
          {list.length === 0 ? (
            <EmptyState text={data.products.length ? 'لا نتائج لهذا البحث.' : 'المستودع فارغ. أدخل منتجاً يدوياً أولاً.'} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {list.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPicked(p)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 bg-[#fbfbfd] hover:border-[#0071e3] text-right cursor-pointer transition"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                    {p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#1d1d1f] truncate">{p.name}</div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {formatMoney(p.price, p.currency)} · المخزون {totalStock(p)}
                      {p.variants.length > 0 && ` · ${p.variants.filter((v) => v.stock > 0).length} تركيبة متوفرة`}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${p.published ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>
                    {p.published ? 'في المتجر' : 'في المستودع'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
