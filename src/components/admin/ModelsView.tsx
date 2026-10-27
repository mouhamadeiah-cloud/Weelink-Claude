// «نماذج الصفحات»: the pages each kind of site is made of, and the sections of each page in order (src/data/pageModels.ts has the defaults).
// The admin adds and names pages, adds any section to a page, says which ready slides each section may use, reorders, and changes when a
// section appears; «الافتراضي» goes back to the defaults.
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { AdminError, ReadyCategory, adminModelReset, adminModelSave, adminModels, adminReadyOverview } from '../../services/adminApi';
import { FIXED_READY_CATEGORIES } from '../../data/readyCategories';
import { MAIN_PAGE_NAME, MAX_MODEL_PAGES, MAX_MODEL_SECTIONS, MODEL_CATEGORIES, ModelPage, ModelSection, PageModel, SectionMode, SectionNeed, pagesOf } from '../../data/pageModels';

const MODE_LABEL: Record<SectionMode, string> = { always: 'دائماً', if: 'إذا توفّر', ask: 'يختاره الزبون' };
const NEED_LABEL: Record<SectionNeed, string> = { services: 'خدمات', priced: 'خدمات بأسعار', photos: 'صور المعرض' };
const PART_LABEL: Record<string, string> = { front: 'الواجهة', main: 'القسم الحي', priceList: 'قائمة الأسعار' };
const nameOf = (id: string) => MODEL_CATEGORIES.find((c) => c.id === id)?.name || id;
const idOf = (s: Pick<ModelSection, 'category' | 'part'>) => (s.part ? `${s.category}:${s.part}` : s.category);

// Every section the admin may add: each category, the shop, showroom and menu ones as their front slide and their live section, and the hand-typed price list.
const ADDABLE: Pick<ModelSection, 'category' | 'part'>[] = [
  ...MODEL_CATEGORIES.flatMap((c) => (FIXED_READY_CATEGORIES.includes(c.id) ? [{ category: c.id, part: 'front' as const }, { category: c.id, part: 'main' as const }] : [{ category: c.id }])),
  { category: 'table', part: 'priceList' },
];
const labelOf = (s: Pick<ModelSection, 'category' | 'part'>) => `${nameOf(s.category)}${s.part ? ` · ${PART_LABEL[s.part]}` : ''}`;

export const ModelsView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [models, setModels] = useState<(PageModel & { custom: boolean })[] | null>(null);
  const [ready, setReady] = useState<ReadyCategory[]>([]);
  const [open, setOpen] = useState('page-free');
  const [draft, setDraft] = useState<ModelPage[]>([]);
  const [pageIx, setPageIx] = useState(0);
  const [slidesOf, setSlidesOf] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const fail = useCallback((e: unknown) => {
    if ((e as AdminError)?.code === 'session') return onSessionEnd();
    setNote('تعذّر تنفيذ العملية، جرّب مرة ثانية.');
  }, [onSessionEnd]);
  const load = useCallback(() => adminModels().then((r) => { setModels(r.models); return r.models; }).catch(fail), [fail]);
  useEffect(() => { load(); adminReadyOverview().then((r) => setReady(r.categories)).catch(() => {}); }, [load]);
  const model = models?.find((m) => m.id === open);
  useEffect(() => { if (model) { setDraft(pagesOf(model)); setPageIx(0); setSlidesOf(''); } }, [model]);

  if (!models || !model) return <div className="flex justify-center p-10 text-faint"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const saved = pagesOf(model);
  const changed = JSON.stringify(draft) !== JSON.stringify(saved);
  const page = draft[Math.min(pageIx, draft.length - 1)];
  const at = draft.indexOf(page);
  const setPage = (p: Partial<ModelPage>) => setDraft((d) => d.map((x, j) => (j === at ? { ...x, ...p } : x)));
  const setSections = (f: (s: ModelSection[]) => ModelSection[]) => setPage({ sections: f(page.sections) });
  const patch = (i: number, p: Partial<ModelSection>) => setSections((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, by: number) => setSections((s) => { const n = [...s]; [n[i], n[i + by]] = [n[i + by], n[i]]; return n; });
  const movePage = (by: number) => { setDraft((d) => { const n = [...d]; [n[at], n[at + by]] = [n[at + by], n[at]]; return n; }); setPageIx(at + by); };
  const addPage = () => { setDraft((d) => [...d, { id: `p${Date.now().toString(36)}`, name: `صفحة ${d.length + 1}`, sections: [] }]); setPageIx(draft.length); };
  const removePage = () => { setDraft((d) => d.filter((_, j) => j !== at)); setPageIx(Math.max(0, at - 1)); };
  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setNote('');
    try { await fn(); await load(); setNote(done); } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const addable = ADDABLE.filter((c) => !page.sections.some((s) => s.id === idOf(c)));
  const empty = draft.some((p) => !p.sections.length);
  const toggleSlide = (i: number, all: string[], id: string) => {
    const now = page.sections[i].slides?.length ? page.sections[i].slides! : all;
    const next = now.includes(id) ? now.filter((x) => x !== id) : [...now, id];
    patch(i, { slides: next.length === all.length || !next.length ? undefined : next });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <h2 className="text-lg font-bold">نماذج الصفحات</h2>
        <p className="text-sm text-muted">لكل نوع موقع صفحاته بأسمائها، ولكل صفحة أقسامها بالترتيب. «دائماً» يدخل كل موقع، «إذا توفّر» يدخل عند وجود ما يحتاجه، و«يختاره الزبون» يظهر مربعاً في الأسئلة. لكل قسم تحدّد الشرائح التي يجوز البناء بها، وإن لم تحدّد فكل شرائح تصنيفه تصلح.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {models.map((m) => (
          <button key={m.id} type="button" onClick={() => setOpen(m.id)} className={`rounded-full border px-3 py-1 text-sm ${m.id === open ? 'border-brand bg-brand text-white' : 'border-line bg-white hover:bg-bg'}`}>{m.name}{m.custom && <span className="mr-1" title="معدّل">●</span>}</button>
        ))}
      </div>
      {note && <p className="rounded-ctl bg-bg px-3 py-2 text-sm">{note}</p>}
      <section className="space-y-3 rounded-card border border-line bg-white p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {draft.map((p, j) => (
            <button key={p.id} type="button" onClick={() => { setPageIx(j); setSlidesOf(''); }} className={`rounded-ctl border px-3 py-1 text-sm ${j === at ? 'border-brand bg-bg font-semibold' : 'border-line hover:bg-bg'}`}>{p.name || '—'}</button>
          ))}
          <button type="button" disabled={draft.length >= MAX_MODEL_PAGES} onClick={addPage} className="inline-flex items-center gap-1 rounded-ctl border border-dashed border-line px-3 py-1 text-sm hover:bg-bg disabled:opacity-40"><Plus size={14} /> صفحة</button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="inline-flex items-center gap-2">اسم الصفحة <input value={page.name} maxLength={40} onChange={(e) => setPage({ name: e.target.value })} placeholder={MAIN_PAGE_NAME} className="rounded-ctl border border-line px-2 py-1" /></label>
          <span className="mr-auto inline-flex gap-1">
            <button type="button" title="قبل" disabled={at === 0} onClick={() => movePage(-1)} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowUp size={14} /></button>
            <button type="button" title="بعد" disabled={at === draft.length - 1} onClick={() => movePage(1)} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowDown size={14} /></button>
            <button type="button" title="حذف الصفحة" disabled={draft.length < 2} onClick={() => window.confirm('حذف هذه الصفحة بأقسامها؟') && removePage()} className="rounded-ctl border border-line p-1.5 text-danger hover:bg-bg disabled:opacity-40"><Trash2 size={14} /></button>
          </span>
        </div>
        {!page.sections.length && <p className="text-sm text-muted">الصفحة فارغة: أضف لها قسماً واحداً على الأقل قبل الحفظ.</p>}
        {page.sections.map((s, i) => {
          const cat = ready.find((c) => c.id === s.category);
          const all = (cat?.items || []).filter((x) => x.eligible).map((x) => x.id);
          const chosen = s.slides?.length ? s.slides.filter((x) => all.includes(x)) : all;
          return (
            <div key={s.id} className="space-y-2 rounded-ctl border border-line p-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-6 text-center text-muted">{i + 1}</span>
                <span className="min-w-28 font-semibold">{labelOf(s)}</span>
                <select value={s.mode} onChange={(e) => { const mode = e.target.value as SectionMode; patch(i, { mode, need: mode === 'if' ? s.need || 'services' : undefined, defaultOn: mode === 'ask' ? s.defaultOn : undefined }); }} className="rounded-ctl border border-line bg-white px-2 py-1">
                  {(Object.keys(MODE_LABEL) as SectionMode[]).map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
                </select>
                {s.mode === 'if' && (
                  <select value={s.need || 'services'} onChange={(e) => patch(i, { need: e.target.value as SectionNeed })} className="rounded-ctl border border-line bg-white px-2 py-1">
                    {(Object.keys(NEED_LABEL) as SectionNeed[]).map((n) => <option key={n} value={n}>{NEED_LABEL[n]}</option>)}
                  </select>
                )}
                {s.mode === 'ask' && <label className="inline-flex items-center gap-1"><input type="checkbox" checked={!!s.defaultOn} onChange={(e) => patch(i, { defaultOn: e.target.checked })} /> معلَّم من البداية</label>}
                <button type="button" onClick={() => setSlidesOf(slidesOf === s.id ? '' : s.id)} className="inline-flex items-center gap-1 rounded-ctl border border-line px-2 py-1 hover:bg-bg">
                  الشرائح {cat ? (s.slides?.length ? `${chosen.length} من ${all.length}` : `الكل (${all.length})`) : 'من الكود'} <ChevronDown size={14} className={slidesOf === s.id ? 'rotate-180' : ''} />
                </button>
                <span className="mr-auto inline-flex gap-1">
                  <button type="button" title="أعلى" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowUp size={14} /></button>
                  <button type="button" title="أسفل" disabled={i === page.sections.length - 1} onClick={() => move(i, 1)} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowDown size={14} /></button>
                  <button type="button" title="حذف القسم" onClick={() => setSections((x) => x.filter((_, j) => j !== i))} className="rounded-ctl border border-line p-1.5 text-danger hover:bg-bg"><Trash2 size={14} /></button>
                </span>
              </div>
              {slidesOf === s.id && (
                <div className="rounded-ctl bg-bg p-2">
                  {!cat ? <p className="text-muted">هذا القسم يقرأ بياناته الحيّة (قائمة، منتجات، سيارات)، وشرائحه من الكود.</p>
                    : !cat.items.length ? <p className="text-muted">لا شرائح جاهزة في هذا التصنيف بعد. أضفها من «الشرائح الجاهزة».</p>
                    : (
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 pb-1">
                          <button type="button" onClick={() => patch(i, { slides: undefined })} className="rounded-ctl border border-line bg-white px-2 py-0.5 hover:bg-bg">كل الشرائح</button>
                          <span className="text-tiny text-muted">إن لم تعلّم شيئاً فكل شرائح التصنيف تصلح.</span>
                        </div>
                        {cat.items.map((x) => (
                          <label key={x.id} className={`flex items-center gap-2 ${x.eligible ? '' : 'opacity-50'}`}>
                            <input type="checkbox" disabled={!x.eligible} checked={x.eligible && chosen.includes(x.id)} onChange={() => toggleSlide(i, all, x.id)} />
                            <span>{x.name || x.id}</span>
                            {!x.eligible && <span className="text-tiny text-danger">غير صالحة للبناء</span>}
                          </label>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <select value="" disabled={page.sections.length >= MAX_MODEL_SECTIONS} onChange={(e) => { const c = addable[Number(e.target.value)]; if (c) setSections((s) => [...s, { id: idOf(c), category: c.category, ...(c.part ? { part: c.part } : {}), mode: 'ask' }]); }} className="rounded-ctl border border-line bg-white px-2 py-1.5 text-sm">
            <option value="">إضافة قسم…</option>
            {addable.map((c, k) => <option key={idOf(c)} value={k}>{labelOf(c)}</option>)}
          </select>
          <button type="button" disabled={busy || !changed || empty} onClick={() => run(() => adminModelSave(model.id, draft), 'حُفظ النموذج.')} className="inline-flex items-center gap-1.5 rounded-ctl bg-brand px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ</button>
          <button type="button" disabled={busy || !changed} onClick={() => { setDraft(saved); setPageIx(0); }} className="rounded-ctl border border-line px-3 py-1.5 text-sm hover:bg-bg disabled:opacity-50">تراجع</button>
          <button type="button" disabled={busy || !model.custom} onClick={() => window.confirm('العودة إلى النموذج الافتراضي؟') && run(() => adminModelReset(model.id), 'عاد النموذج إلى الافتراضي.')} className="rounded-ctl border border-line px-3 py-1.5 text-sm text-danger hover:bg-bg disabled:opacity-50">الافتراضي</button>
        </div>
        {draft.length > 1 && <p className="text-tiny text-muted">الصفحات الإضافية تُحفظ الآن في النموذج، أما بناء الموقع بالذكاء فيستعمل الصفحة الأولى فقط إلى أن نفعّل بناء كل الصفحات.</p>}
      </section>
    </div>
  );
};
