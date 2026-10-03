// الكاتالوكات: the store's catalogs and sub-catalogs. They are created from "إضافة منتج": picking
// a catalog from artikel.json adds it on save, and "غير ذلك" + the green button adds the store's
// own catalog. Here they can be renamed or deleted.
import React, { useState } from 'react';
import { Pencil, Trash2, CornerDownLeft, Check, X } from 'lucide-react';
import { ShopCatalog } from '../shopTypes';
import { Card, inputClass, EmptyState } from '../adminUi';
import { AdminTabProps } from './tabProps';

export const CatalogsTab: React.FC<AdminTabProps> = ({ data, update }) => {
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const topLevel = data.catalogs.filter((c) => !c.parentId);
  const childrenOf = (id: string) => data.catalogs.filter((c) => c.parentId === id);
  const productCount = (id: string) => data.products.filter((p) => p.catalogIds.includes(id)).length;

  const rename = () => {
    if (!editing || !editing.name.trim()) return;
    update((d) => ({ ...d, catalogs: d.catalogs.map((c) => (c.id === editing.id ? { ...c, name: editing.name.trim() } : c)) }));
    setEditing(null);
  };

  const remove = (c: ShopCatalog) => {
    const subs = childrenOf(c.id);
    const msg = subs.length
      ? `حذف كاتالوك "${c.name}" مع ${subs.length} كاتالوك فرعي؟ المنتجات تبقى في المستودع.`
      : `حذف كاتالوك "${c.name}"؟ المنتجات تبقى في المستودع.`;
    if (!window.confirm(msg)) return;
    const removed = new Set([c.id, ...subs.map((s) => s.id)]);
    update((d) => ({
      ...d,
      catalogs: d.catalogs.filter((x) => !removed.has(x.id)),
      products: d.products.map((p) => ({ ...p, catalogIds: p.catalogIds.filter((id) => !removed.has(id)) })),
    }));
  };

  const row = (c: ShopCatalog, isSub: boolean) => (
    <div key={c.id} className={`flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 bg-[#fbfbfd] ${isSub ? 'mr-8' : ''}`}>
      {isSub && <CornerDownLeft size={14} className="text-neutral-300 shrink-0" />}
      {editing?.id === c.id ? (
        <>
          <input
            className={`${inputClass} h-9`}
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') rename(); if (e.key === 'Escape') setEditing(null); }}
            autoFocus
          />
          <button type="button" onClick={rename} className="w-8 h-8 shrink-0 rounded-lg text-emerald-600 hover:bg-emerald-50 flex items-center justify-center cursor-pointer" aria-label="حفظ"><Check size={15} /></button>
          <button type="button" onClick={() => setEditing(null)} className="w-8 h-8 shrink-0 rounded-lg text-neutral-400 hover:bg-neutral-100 flex items-center justify-center cursor-pointer" aria-label="إلغاء"><X size={15} /></button>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[#1d1d1f] truncate">{c.name}</div>
            <div className="text-[10px] text-neutral-400">
              {productCount(c.id)} منتج{!isSub && childrenOf(c.id).length ? ` · ${childrenOf(c.id).length} فرعي` : ''}
            </div>
          </div>
          <button type="button" onClick={() => setEditing({ id: c.id, name: c.name })} className="w-8 h-8 rounded-lg text-neutral-500 hover:bg-neutral-100 flex items-center justify-center cursor-pointer" aria-label="إعادة تسمية">
            <Pencil size={14} />
          </button>
          <button type="button" onClick={() => remove(c)} className="w-8 h-8 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer" aria-label="حذف">
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl">
      <Card title="الكاتالوكات">
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          تُضاف الكاتالوكات من «إضافة منتج»: اختر كاتالوكاً من القائمة فيُضاف عند الحفظ، أو اختر «غير ذلك» واكتب اسماً ثم اضغط الزر الأخضر لإضافة كاتالوك خاص بمتجرك.
        </p>
        {topLevel.length === 0 ? (
          <EmptyState text="لا توجد كاتالوكات بعد." />
        ) : (
          <div className="space-y-2">
            {topLevel.map((c) => (
              <React.Fragment key={c.id}>
                {row(c, false)}
                {childrenOf(c.id).map((s) => row(s, true))}
              </React.Fragment>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
