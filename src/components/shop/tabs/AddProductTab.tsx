// إضافة منتج: add a product to catalogs, either picked from the warehouse or entered by hand.
import React, { useState } from 'react';
import { PackagePlus, Warehouse, PenLine, CheckCircle2 } from 'lucide-react';
import { ShopProduct, ShopMovement, newId } from '../shopTypes';
import { Card, Field, inputClass, PrimaryButton, EmptyState, formatMoney } from '../adminUi';
import { AdminTabProps } from './tabProps';
import { ProductForm, ProductDraft, emptyProductDraft, CatalogChecklist, toNumber } from './ProductForm';

export const AddProductTab: React.FC<AdminTabProps> = ({ data, update }) => {
  const [mode, setMode] = useState<'manual' | 'warehouse'>('manual');
  const [draft, setDraft] = useState<ProductDraft>(emptyProductDraft);
  const [pickedId, setPickedId] = useState('');
  const [pickedCatalogs, setPickedCatalogs] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const currency = data.settings.currency;

  const flash = (msg: string) => {
    setDone(msg);
    window.setTimeout(() => setDone(null), 2500);
  };

  const addManual = () => {
    const name = draft.name.trim();
    if (!name) return;
    const now = new Date().toISOString();
    const product: ShopProduct = {
      id: newId('prd'),
      name,
      description: draft.description.trim(),
      price: toNumber(draft.price),
      cost: toNumber(draft.cost),
      stock: Math.floor(toNumber(draft.stock)),
      sku: draft.sku.trim(),
      images: draft.images,
      catalogIds: draft.catalogIds,
      createdAt: now,
    };
    const movement: ShopMovement | null = product.stock > 0
      ? { id: newId('mov'), type: 'purchase', productId: product.id, name, qty: product.stock, unitAmount: product.cost, createdAt: now }
      : null;
    update((d) => ({
      ...d,
      products: [product, ...d.products],
      movements: movement ? [movement, ...d.movements] : d.movements,
    }));
    setDraft(emptyProductDraft);
    flash(`تمت إضافة "${name}" إلى المستودع.`);
  };

  const picked = data.products.find((p) => p.id === pickedId);

  const assignFromWarehouse = () => {
    if (!picked) return;
    update((d) => ({
      ...d,
      products: d.products.map((p) =>
        p.id === picked.id ? { ...p, catalogIds: Array.from(new Set([...p.catalogIds, ...pickedCatalogs])) } : p
      ),
    }));
    flash(`تمت إضافة "${picked.name}" إلى الكاتالوكات المختارة.`);
    setPickedId('');
    setPickedCatalogs([]);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex gap-2 p-1 bg-neutral-100 rounded-2xl w-full sm:w-fit">
        {([
          { id: 'manual', label: 'إضافة يدوية', icon: PenLine },
          { id: 'warehouse', label: 'من المستودع', icon: Warehouse },
        ] as const).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
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
        <Card title="منتج جديد" actions={<span className="text-[10px] text-neutral-400">يُحفظ في المستودع تلقائياً</span>}>
          <ProductForm draft={draft} onChange={setDraft} catalogs={data.catalogs} currency={currency} stockLabel="الكمية الأولية" />
          <PrimaryButton onClick={addManual} disabled={!draft.name.trim()} className="w-full flex items-center justify-center gap-1.5">
            <PackagePlus size={15} /> إضافة المنتج
          </PrimaryButton>
        </Card>
      ) : (
        <Card title="اختيار منتج من المستودع">
          {data.products.length === 0 ? (
            <EmptyState text="المستودع فارغ. أضف منتجاً يدوياً أولاً." />
          ) : (
            <>
              <Field label="المنتج">
                <select
                  className={inputClass}
                  value={pickedId}
                  onChange={(e) => {
                    setPickedId(e.target.value);
                    setPickedCatalogs(data.products.find((p) => p.id === e.target.value)?.catalogIds || []);
                  }}
                >
                  <option value="">— اختر منتجاً —</option>
                  {data.products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {formatMoney(p.price, currency)} · المخزون {p.stock}</option>
                  ))}
                </select>
              </Field>
              {picked && (
                <>
                  <Field label="أضفه إلى الكاتالوكات">
                    <CatalogChecklist catalogs={data.catalogs} selected={pickedCatalogs} onChange={setPickedCatalogs} />
                  </Field>
                  <PrimaryButton onClick={assignFromWarehouse} disabled={pickedCatalogs.length === 0} className="w-full">
                    حفظ
                  </PrimaryButton>
                </>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
};
