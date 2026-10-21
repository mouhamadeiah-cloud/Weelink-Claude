// «الشرائح الجاهزة»: the admin decides what the editor's ready-slide panel shows (docs/READY_SLIDES_PLAN.md, step 3). Each category
// lists its gallery slides in order (أعلى / أسفل), can move a slide to another category or take it out, and has one switch:
// «استعمل شرائح المعرض بدل شرائح الكود». Slides are added from «مراجعة الشرائح», where they are approved.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Trash2 } from 'lucide-react';
import { AdminError, ReadyCategory, adminGalleryDoc, adminReadyAdd, adminReadyAdopt, adminReadyMove, adminReadyOverview, adminReadyRemove, adminReadyUseGallery } from '../../services/adminApi';
import { GALLERY_READY_CATEGORIES } from '../../data/readyCategories';
import { slideTemplateCount } from '../../data/slideTemplates';
import { LiveSlide } from '../gallery/LiveSlide';
import { deserializeElements } from '../../utils/elementStorage';

const REASONS: Record<string, string> = {
  empty: 'لا توجد شريحة معتمدة في هذه الفئة بعد، أضف شريحة أولاً.',
  'not-found': 'لم تعد الشريحة موجودة.',
  bad_category: 'فئة غير معروفة.',
};

// The slide itself, loaded when its card comes on screen.
const Preview: React.FC<{ id: string }> = ({ id }) => {
  const [doc, setDoc] = useState<{ slide: any; elements: any[] } | null>(null);
  useEffect(() => {
    let alive = true;
    adminGalleryDoc(id).then((r) => { if (alive) setDoc({ slide: r.design.page?.slides?.[0] || r.design.slide, elements: r.design.elements }); }).catch(() => {});
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
    setNote(REASONS[code] || 'تعذّر تنفيذ العملية، جرّب مرة ثانية.');
  }, [onSessionEnd]);
  const load = useCallback(() => adminReadyOverview().then((r) => setCats(r.categories)).catch(fail), [fail]);
  useEffect(() => { load(); }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setNote('');
    try { await fn(); await load(); } catch (e) { fail(e); } finally { setBusy(''); }
  };

  if (!cats) return <div className="flex justify-center p-10 text-faint"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const cat = cats.find((c) => c.id === open) || cats[0];
  const total = cats.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <h2 className="text-lg font-bold">الشرائح الجاهزة</h2>
        <p className="text-sm text-muted">ما تراه هنا هو ما يظهر في لوحة «شرائح جاهزة» في المحرر. تُضاف الشرائح من «مراجعة الشرائح» بعد اعتمادها. فئات المتجر والسيارات والمطعم والمواعيد والاتصال تبقى من الكود.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-white p-3 text-sm">
        <span>{total} شريحة في الجاهزة.</span>
        <button type="button" disabled={!!busy} onClick={() => run('adopt', async () => { const r = await adminReadyAdopt(); setNote(r.adopted ? `أُضيفت ${r.adopted} شريحة معتمدة من المنسوخة إلى فئاتها الأصلية.` : 'لا توجد شرائح منسوخة معتمدة جديدة.'); })} className="inline-flex items-center gap-1.5 rounded-ctl border border-line px-3 py-1.5 font-medium hover:bg-bg disabled:opacity-50">
          {busy === 'adopt' && <Loader2 className="h-4 w-4 animate-spin" />} اعتماد الشرائح المنسوخة في فئاتها
        </button>
        <span className="text-muted">تأخذ الشرائح المنسوخة من الكود والمعتمدة في المعرض مكانها الأصلي في الجاهزة.</span>
      </div>
      {note && <p className="rounded-ctl bg-bg px-3 py-2 text-sm">{note}</p>}

      <div className="flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button key={c.id} type="button" onClick={() => setOpen(c.id)} className={`rounded-full border px-3 py-1 text-sm ${c.id === cat.id ? 'border-brand bg-brand text-white' : 'border-line bg-white hover:bg-bg'}`}>
            {c.icon} {c.name} <span className="opacity-70">{c.items.length}</span>{c.useGallery && <span className="mr-1" title="من المعرض">●</span>}
          </button>
        ))}
      </div>

      <section className="space-y-3 rounded-card border border-line bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold">{cat.icon} {cat.name}</p>
            <p className="text-sm text-muted">{cat.useGallery ? `المحرر يعرض شرائح المعرض فقط (${cat.items.length}).` : `المحرر يعرض شرائح الكود (${slideTemplateCount(cat.id)}) ثم شرائح المعرض هنا (${cat.items.length}).`}</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={cat.useGallery} disabled={!!busy} onChange={(e) => run(`use-${cat.id}`, () => adminReadyUseGallery(cat.id, e.target.checked))} className="h-4 w-4" />
            استعمل شرائح المعرض بدل شرائح الكود
            {busy === `use-${cat.id}` && <Loader2 className="h-4 w-4 animate-spin" />}
          </label>
        </div>

        {cat.items.length === 0 && <p className="text-sm text-muted">لا توجد شرائح هنا بعد. افتح «مراجعة الشرائح» ← شريحة معتمدة ← «إضافة إلى الشرائح الجاهزة».</p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cat.items.map((it, i) => (
            <div key={it.id} className="space-y-2 rounded-card border border-line p-2">
              <Preview id={it.id} />
              <p className="truncate text-sm font-semibold">{i + 1}. {it.name || it.id}{it.official && <span className="mr-1 rounded-full bg-brand/10 px-2 py-0.5 text-tiny font-bold text-brand">رسمي</span>}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" title="أعلى" disabled={!!busy || i === 0} onClick={() => run(it.id, () => adminReadyMove(it.id, 'up'))} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowUp size={14} /></button>
                <button type="button" title="أسفل" disabled={!!busy || i === cat.items.length - 1} onClick={() => run(it.id, () => adminReadyMove(it.id, 'down'))} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowDown size={14} /></button>
                <select value="" disabled={!!busy} onChange={(e) => e.target.value && run(it.id, () => adminReadyAdd(it.id, e.target.value))} className="min-w-0 flex-1 rounded-ctl border border-line bg-white px-2 py-1.5 text-sm">
                  <option value="">نقل إلى فئة…</option>
                  {GALLERY_READY_CATEGORIES.filter((c) => c.id !== cat.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" title="إخراجها من الجاهزة" disabled={!!busy} onClick={() => run(it.id, () => adminReadyRemove(it.id))} className="rounded-ctl border border-line p-1.5 text-danger hover:bg-bg disabled:opacity-40"><Trash2 size={14} /></button>
                {busy === it.id && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
