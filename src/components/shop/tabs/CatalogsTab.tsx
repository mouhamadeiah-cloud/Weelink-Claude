// كاتالوكات: catalogs and sub-catalogs, each with up to 5 images.
import React, { useState } from 'react';
import { FolderPlus, Pencil, Trash2, CornerDownLeft } from 'lucide-react';
import { ShopAdminData, ShopCatalog, newId } from '../shopTypes';
import { Card, Field, inputClass, PrimaryButton, GhostButton, ImagesPicker, EmptyState } from '../adminUi';
import { AdminTabProps } from './tabProps';

const emptyDraft = { name: '', parentId: '' as string, images: [] as string[] };

export const CatalogsTab: React.FC<AdminTabProps> = ({ data, update }) => {
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const topLevel = data.catalogs.filter((c) => !c.parentId);
  const childrenOf = (id: string) => data.catalogs.filter((c) => c.parentId === id);
  const productCount = (id: string) => data.products.filter((p) => p.catalogIds.includes(id)).length;

  const save = () => {
    const name = draft.name.trim();
    if (!name) return;
    update((d: ShopAdminData) => {
      if (editingId) {
        return {
          ...d,
          catalogs: d.catalogs.map((c) =>
            c.id === editingId ? { ...c, name, parentId: draft.parentId || null, images: draft.images } : c
          ),
        };
      }
      const catalog: ShopCatalog = {
        id: newId('cat'),
        name,
        parentId: draft.parentId || null,
        images: draft.images,
        createdAt: new Date().toISOString(),
      };
      return { ...d, catalogs: [...d.catalogs, catalog] };
    });
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const startEdit = (c: ShopCatalog) => {
    setEditingId(c.id);
    setDraft({ name: c.name, parentId: c.parentId || '', images: c.images });
  };

  const remove = (c: ShopCatalog) => {
    const subs = childrenOf(c.id);
    const msg = subs.length
      ? `حذف كاتالوك "${c.name}" مع ${subs.length} كاتالوك ضمني؟ المنتجات تبقى في المستودع.`
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
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
        {c.images[0] && <img src={c.images[0]} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-[#1d1d1f] truncate">{c.name}</div>
        <div className="text-[10px] text-neutral-400">
          {productCount(c.id)} منتج · {c.images.length} صور{!isSub && childrenOf(c.id).length ? ` · ${childrenOf(c.id).length} ضمني` : ''}
        </div>
      </div>
      <button type="button" onClick={() => startEdit(c)} className="w-8 h-8 rounded-lg text-neutral-500 hover:bg-neutral-100 flex items-center justify-center cursor-pointer" aria-label="تعديل">
        <Pencil size={14} />
      </button>
      <button type="button" onClick={() => remove(c)} className="w-8 h-8 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer" aria-label="حذف">
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
      <Card title="الكاتالوكات">
        {topLevel.length === 0 ? (
          <EmptyState text="لا توجد كاتالوكات بعد. أضف أول كاتالوك من النموذج." />
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

      <Card title={editingId ? 'تعديل كاتالوك' : 'إضافة كاتالوك'}>
        <Field label="اسم الكاتالوك">
          <input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="مثال: ملابس رجالية" />
        </Field>
        <Field label="داخل كاتالوك" hint="اختر كاتالوكاً رئيسياً لجعله كاتالوكاً ضمنياً.">
          <select className={inputClass} value={draft.parentId} onChange={(e) => setDraft({ ...draft, parentId: e.target.value })}>
            <option value="">— كاتالوك رئيسي —</option>
            {topLevel.filter((c) => c.id !== editingId).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="صور الكاتالوك">
          <ImagesPicker images={draft.images} onChange={(images) => setDraft({ ...draft, images })} />
        </Field>
        <div className="flex gap-2">
          <PrimaryButton onClick={save} disabled={!draft.name.trim()} className="flex-1 flex items-center justify-center gap-1.5">
            <FolderPlus size={14} />
            {editingId ? 'حفظ التعديل' : 'إضافة الكاتالوك'}
          </PrimaryButton>
          {editingId && <GhostButton onClick={() => { setEditingId(null); setDraft(emptyDraft); }} className="h-10">إلغاء</GhostButton>}
        </div>
      </Card>
    </div>
  );
};
