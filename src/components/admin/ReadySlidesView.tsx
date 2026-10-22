// «الشرائح الجاهزة»: the slides the editor's ready-slide panel shows, and they are the admin's alone. Each category lists its slides in
// order (أعلى / أسفل); a slide is made new or edited in the editor (it opens on the admin's own session), moved to another category or
// deleted. Saving finds the slide's AI slots by itself, so a card says whether the page builder can use it.
// A gallery slide is copied here from «مراجعة الشرائح».
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminError, ReadyCategory, adminReadyCategory, adminReadyDoc, adminReadyMove, adminReadyOverview, adminReadyRemove, openGalleryEditor } from '../../services/adminApi';
import { GALLERY_READY_CATEGORIES } from '../../data/readyCategories';
import { LiveSlide } from '../gallery/LiveSlide';
import { deserializeElements } from '../../utils/elementStorage';

const REASONS: Record<string, string> = {
  'not-found': 'لم تعد الشريحة موجودة.',
  bad_category: 'فئة غير معروفة.',
};

// The slide itself, loaded when its card comes on screen.
const Preview: React.FC<{ id: string }> = ({ id }) => {
  const [doc, setDoc] = useState<{ slide: any; elements: any[] } | null>(null);
  useEffect(() => {
    let alive = true;
    adminReadyDoc(id).then((r) => { if (alive) setDoc({ slide: r.design.slide, elements: r.design.elements }); }).catch(() => {});
    return () => { alive = false; };
  }, [id]);
  const elements = useMemo(() => deserializeElements(doc?.elements || []), [doc]);
  if (!doc) return <div className="flex h-24 items-center justify-center text-faint"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  return <LiveSlide slide={doc.slide} elements={elements} maxHeight={220} />;
};

export const ReadySlidesView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [cats, setCats] = useState<ReadyCategory[] | null>(null);
  const [open, setOpen] = useState<string>(GALLERY_READY_CATEGORIES[0].id);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');

  const fail = useCallback((e: unknown) => {
    const code = (e as AdminError)?.code;
    if (code === 'session') return onSessionEnd();
    setNote(REASONS[code] || `تعذّر تنفيذ العملية، جرّب مرة ثانية. (${code || 'خطأ'})`);
  }, [onSessionEnd]);
  const load = useCallback(() => adminReadyOverview().then((r) => setCats(r.categories)).catch(fail), [fail]);
  useEffect(() => { load(); }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setNote('');
    try { await fn(); await load(); } catch (e) { fail(e); } finally { setBusy(''); }
  };
  const openEditor = (id: string, category: string) => {
    if (!openGalleryEditor(id, { category })) setNote('تعذّر فتح المحرر. اسمح للنوافذ المنبثقة وجرّب مرة ثانية.');
  };

  if (!cats) return <div className="flex justify-center p-10 text-faint"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const cat = cats.find((c) => c.id === open) || cats[0];
  const total = cats.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <h2 className="text-lg font-bold">الشرائح الجاهزة</h2>
        <p className="text-sm text-muted">هذه الشرائح هي ما تراه في لوحة «شرائح جاهزة» في المحرر وما يختار منه الذكاء الاصطناعي عند بناء الصفحات. {total} شريحة. فئات المتجر والسيارات والمطعم تبقى من الكود. لإضافة شريحة من المعرض افتح «مراجعة الشرائح» ← «نسخ إلى الجاهزة».</p>
      </div>
      {note && <p className="rounded-ctl bg-bg px-3 py-2 text-sm">{note}</p>}

      <div className="flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button key={c.id} type="button" onClick={() => setOpen(c.id)} className={`rounded-full border px-3 py-1 text-sm ${c.id === cat.id ? 'border-brand bg-brand text-white' : 'border-line bg-white hover:bg-bg'}`}>
            {c.icon} {c.name} <span className="opacity-70">{c.items.length}</span>
          </button>
        ))}
      </div>

      <section className="space-y-3 rounded-card border border-line bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold">{cat.icon} {cat.name}</p>
          <button type="button" disabled={!!busy} onClick={() => openEditor('', cat.id)} className="inline-flex items-center gap-1.5 rounded-ctl bg-brand px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
            <Plus size={14} /> شريحة جديدة
          </button>
        </div>

        {cat.items.length === 0 && <p className="text-sm text-muted">لا توجد شرائح هنا بعد.</p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cat.items.map((it, i) => (
            <div key={it.id} className="space-y-2 rounded-card border border-line p-2">
              <Preview id={it.id} />
              <p className="truncate text-sm font-semibold">{i + 1}. {it.name || it.id}</p>
              <p className={`text-tiny ${it.eligible ? 'text-success' : 'text-muted'}`} title={it.problems.join('، ')}>{it.eligible ? `جاهزة للذكاء الاصطناعي · ${it.slots} خانات` : it.slots ? `خانات ناقصة: ${it.problems.join('، ')}` : 'بلا خانات: تبقى للاستعمال اليدوي'}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" title="أعلى" disabled={!!busy || i === 0} onClick={() => run(it.id, () => adminReadyMove(it.id, 'up'))} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowUp size={14} /></button>
                <button type="button" title="أسفل" disabled={!!busy || i === cat.items.length - 1} onClick={() => run(it.id, () => adminReadyMove(it.id, 'down'))} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowDown size={14} /></button>
                <button type="button" disabled={!!busy} onClick={() => openEditor(it.id, cat.id)} className="inline-flex items-center gap-1 rounded-ctl border border-line px-2 py-1.5 text-sm hover:bg-bg disabled:opacity-40"><Pencil size={14} /> تعديل</button>
                <select value="" disabled={!!busy} onChange={(e) => e.target.value && run(it.id, () => adminReadyCategory(it.id, e.target.value))} className="min-w-0 flex-1 rounded-ctl border border-line bg-white px-2 py-1.5 text-sm">
                  <option value="">نقل إلى فئة…</option>
                  {GALLERY_READY_CATEGORIES.filter((c) => c.id !== cat.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" title="حذف" disabled={!!busy} onClick={() => { if (window.confirm('تحذف هذه الشريحة من الجاهزة؟')) run(it.id, () => adminReadyRemove(it.id)); }} className="rounded-ctl border border-line p-1.5 text-danger hover:bg-bg disabled:opacity-40"><Trash2 size={14} /></button>
                {busy === it.id && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
