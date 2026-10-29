// «نماذج الصفحات»: the pages each kind of site is made of, and the sections of each page in order (src/data/pageModels.ts has the defaults).
// The admin adds and names pages, adds any section to a page, says which ready slides each section may use (his own, or the editor's own
// for search, featured and the live lists), reorders, and changes when a section appears; «الافتراضي» goes back to the defaults.
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Loader2, Lock, Plus, Trash2 } from 'lucide-react';
import { AdminError, ReadyCategory, adminModelReset, adminModelSave, adminModels, adminReadyOverview } from '../../services/adminApi';
import { CODE_CATEGORIES, codeSlides } from '../../data/codeReady';
import { siteKindsOfModel } from '../../data/siteKinds';
import { MAIN_PAGE_NAME, MAX_MODEL_PAGES, MAX_MODEL_SECTIONS, MODEL_CATEGORIES, ModelPage, ModelProblem, ModelSection, PageModel, SYSTEM_PAGES, SectionMode, SectionNeed, SlideFit, modelProblems, pagesOf, sectionName, slideFits } from '../../data/pageModels';

const MODE_LABEL: Record<SectionMode, string> = { always: 'دائماً', if: 'إذا توفّر', ask: 'يختاره الزبون' };
const NEED_LABEL: Record<SectionNeed, string> = { services: 'خدمات', priced: 'خدمات بأسعار', photos: 'صور المعرض' };
// What a booking slide books, shown beside it so the right ones are ticked for each kind of page.
const BOOKING_LABEL: Record<string, string> = { appointment: 'موعد أو استشارة', table: 'طاولة مطعم', stay: 'غرف وليالي', seats: 'مقاعد في جلسة', rental: 'تأجير' };
const KIND_LABEL: Record<string, string> = { page: 'صفحة', restaurant: 'مطعم', shop: 'متجر', cars: 'سيارات', 'rental-cars': 'تأجير سيارات', 'rental-items': 'تأجير أغراض', hotel: 'فنادق ومساحات' };
const idOf = (s: Pick<ModelSection, 'category' | 'part'>) => (s.part ? `${s.category}:${s.part}` : s.category);

// The shop, showroom and menu categories have a front slide and a live section; «بحث» and «عروض مميزة» are one section each.
const PARTED = ['shop', 'cars', 'restaurant'];

// Every section the admin may add: each category, the shop, showroom and menu ones as their front slide and their live section, and the hand-typed price list.
const ADDABLE: Pick<ModelSection, 'category' | 'part'>[] = [
  ...MODEL_CATEGORIES.flatMap((c) => (PARTED.includes(c.id) ? [{ category: c.id, part: 'front' as const }, { category: c.id, part: 'main' as const }] : [{ category: c.id }])),
  { category: 'table', part: 'priceList' },
];

// A slide as the list shows it: the admin's from «الشرائح الجاهزة», or the editor's own.
type Item = SlideFit & { name: string; eligible: boolean; booking?: string };

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
    if ((e as AdminError)?.code === 'no_slides') return setNote(`ما انحفظ النموذج: ${((e as AdminError).extra.problems as ModelProblem[] | undefined)?.length || 'في'} أقسام ما إلها شريحة جاهزة صالحة. شوف الأقسام المعلّمة بالأحمر.`);
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
  // The first render after a model opens, before its pages are copied into the draft.
  if (!page) return <div className="flex justify-center p-10 text-faint"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const at = draft.indexOf(page);
  const setPage = (p: Partial<ModelPage>) => setDraft((d) => d.map((x, j) => (j === at ? { ...x, ...p } : x)));
  const setSections = (f: (s: ModelSection[]) => ModelSection[]) => setPage({ sections: f(page.sections) });
  const patch = (i: number, p: Partial<ModelSection>) => setSections((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, by: number) => setSections((s) => { const n = [...s]; [n[i], n[i + by]] = [n[i + by], n[i]]; return n; });
  const movePage = (by: number) => { setDraft((d) => { const n = [...d]; [n[at], n[at + by]] = [n[at + by], n[at]]; return n; }); setPageIx(at + by); };
  // A new page goes before the cart page, which stays last unless the admin moves it.
  const addPage = () => {
    const sys = draft.findIndex((p) => p.system);
    const where = sys < 0 ? draft.length : sys;
    setDraft((d) => [...d.slice(0, where), { id: `p${Date.now().toString(36)}`, name: `صفحة ${d.filter((p) => !p.system).length + 1}`, sections: [] }, ...d.slice(where)]);
    setPageIx(where);
  };
  const removePage = () => { setDraft((d) => d.filter((_, j) => j !== at)); setPageIx(Math.max(0, at - 1)); };
  // The cart page never comes first: the first page is the site's main page, built from its sections.
  const canMove = (by: number) => { const to = at + by; return to >= 0 && to < draft.length && !(to === 0 && page.system) && !(at === 0 && draft[to]?.system); };
  const contentPages = draft.filter((p) => !p.system).length;
  // The slides of a category, and the sites this model builds (a search or featured slide is for some of them only).
  const itemsOf = (c: string): Item[] | undefined => (CODE_CATEGORIES.includes(c) ? codeSlides(c) : ready.find((x) => x.id === c)?.items.map((x) => ({ ...x, id: x.id })));
  const kinds = siteKindsOfModel(model.id);
  // Every section needs a ready slide to be built from (checked again on the server when saving).
  const eligibleOf = (c: string) => (itemsOf(c) || []).filter((x) => x.eligible);
  const problems = ready.length ? modelProblems(draft, eligibleOf, kinds) : [];
  const problemOf = (pageId: string, sectionId?: string) => problems.find((x) => x.page === pageId && x.section === sectionId)?.why;
  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setNote('');
    try { await fn(); await load(); setNote(done); } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const addable = ADDABLE.filter((c) => !page.sections.some((s) => s.id === idOf(c)));
  const empty = draft.some((p) => !p.system && !p.sections.length) || problems.length > 0;
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
            <button key={p.id} type="button" onClick={() => { setPageIx(j); setSlidesOf(''); }} className={`inline-flex items-center gap-1 rounded-ctl border px-3 py-1 text-sm ${j === at ? 'border-brand bg-bg font-semibold' : 'border-line hover:bg-bg'} ${problems.some((x) => x.page === p.id) ? 'text-danger' : ''}`}>{p.system && <Lock size={12} />}{p.name || '—'}</button>
          ))}
          <button type="button" disabled={draft.length >= MAX_MODEL_PAGES} onClick={addPage} className="inline-flex items-center gap-1 rounded-ctl border border-dashed border-line px-3 py-1 text-sm hover:bg-bg disabled:opacity-40"><Plus size={14} /> صفحة</button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {page.system
            ? <p className="inline-flex items-center gap-1.5 rounded-ctl bg-bg px-3 py-1.5"><Lock size={14} /> {SYSTEM_PAGES[page.system].note}</p>
            : <label className="inline-flex items-center gap-2">اسم الصفحة <input value={page.name} maxLength={40} onChange={(e) => setPage({ name: e.target.value })} placeholder={MAIN_PAGE_NAME} className="rounded-ctl border border-line px-2 py-1" /></label>}
          <span className="mr-auto inline-flex gap-1">
            <button type="button" title="قبل" disabled={!canMove(-1)} onClick={() => movePage(-1)} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowUp size={14} /></button>
            <button type="button" title="بعد" disabled={!canMove(1)} onClick={() => movePage(1)} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowDown size={14} /></button>
            <button type="button" title="حذف الصفحة" disabled={!!page.system || contentPages < 2} onClick={() => window.confirm('حذف هذه الصفحة بأقسامها؟') && removePage()} className="rounded-ctl border border-line p-1.5 text-danger hover:bg-bg disabled:opacity-40"><Trash2 size={14} /></button>
          </span>
        </div>
        {!page.system && !page.sections.length && <p className="text-sm text-danger">الصفحة فارغة: أضف لها قسماً واحداً على الأقل قبل الحفظ.</p>}
        {page.sections.map((s, i) => {
          const items = itemsOf(s.category);
          const usable = (x: Item) => x.eligible && slideFits(x, s, kinds);
          const all = (items || []).filter(usable).map((x) => x.id);
          const chosen = s.slides?.length ? s.slides.filter((x) => all.includes(x)) : all;
          return (
            <div key={s.id} className={`space-y-2 rounded-ctl border p-2 text-sm ${problemOf(page.id, s.id) ? 'border-danger' : 'border-line'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-6 text-center text-muted">{i + 1}</span>
                <span className="min-w-28 font-semibold">{sectionName(s)}</span>
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
                  الشرائح {items ? (s.slides?.length ? `${chosen.length} من ${all.length}` : `الكل (${all.length})`) : ''} <ChevronDown size={14} className={slidesOf === s.id ? 'rotate-180' : ''} />
                </button>
                <span className="mr-auto inline-flex gap-1">
                  <button type="button" title="أعلى" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowUp size={14} /></button>
                  <button type="button" title="أسفل" disabled={i === page.sections.length - 1} onClick={() => move(i, 1)} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowDown size={14} /></button>
                  <button type="button" title="حذف القسم" onClick={() => setSections((x) => x.filter((_, j) => j !== i))} className="rounded-ctl border border-line p-1.5 text-danger hover:bg-bg"><Trash2 size={14} /></button>
                </span>
              </div>
              {problemOf(page.id, s.id) && <p className="text-danger">{problemOf(page.id, s.id)}</p>}
              {slidesOf === s.id && (
                <div className="rounded-ctl bg-bg p-2">
                  {!items ? <p className="text-muted">هذا القسم يرسمه الموقع نفسه (صندوق التقييمات)، ما إله شرائح.</p>
                    : !items.length ? <p className="text-muted">لا شرائح جاهزة في هذا التصنيف بعد. أضفها من «الشرائح الجاهزة».</p>
                    : (
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 pb-1">
                          <button type="button" onClick={() => patch(i, { slides: undefined })} className="rounded-ctl border border-line bg-white px-2 py-0.5 hover:bg-bg">كل الشرائح</button>
                          <span className="text-tiny text-muted">إن لم تعلّم شيئاً فكل شرائح التصنيف المناسبة تصلح، بالترتيب.</span>
                        </div>
                        {items.map((x) => (
                          <label key={x.id} className={`flex items-center gap-2 ${usable(x) ? '' : 'opacity-50'}`}>
                            <input type="checkbox" disabled={!usable(x)} checked={usable(x) && chosen.includes(x.id)} onChange={() => toggleSlide(i, all, x.id)} />
                            <span>{x.name || x.id}</span>
                            {x.booking && <span className="text-tiny text-muted">· {BOOKING_LABEL[x.booking] || 'حجز'}</span>}
                            {x.kinds && <span className="text-tiny text-muted">· {x.kinds.map((k) => KIND_LABEL[k] || k).join('، ')}</span>}
                            {!x.eligible ? <span className="text-tiny text-danger">غير صالحة للبناء</span>
                              : !slideFits(x, s, kinds) && <span className="text-tiny text-muted">{x.kinds && !slideFits({ id: x.id, kinds: x.kinds }, {}, kinds) ? 'لنوع موقع آخر' : s.part === 'main' ? 'ما فيها القائمة الحية' : 'مش شريحة واجهة'}</span>}
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
          {!page.system && <select value="" disabled={page.sections.length >= MAX_MODEL_SECTIONS} onChange={(e) => { const c = addable[Number(e.target.value)]; if (c) setSections((s) => [...s, { id: idOf(c), category: c.category, ...(c.part ? { part: c.part } : {}), mode: 'ask' }]); }} className="rounded-ctl border border-line bg-white px-2 py-1.5 text-sm">
            <option value="">إضافة قسم…</option>
            {addable.map((c, k) => <option key={idOf(c)} value={k}>{sectionName(c)}</option>)}
          </select>}
          <button type="button" disabled={busy || !changed || empty} onClick={() => run(() => adminModelSave(model.id, draft), 'حُفظ النموذج.')} className="inline-flex items-center gap-1.5 rounded-ctl bg-brand px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ</button>
          <button type="button" disabled={busy || !changed} onClick={() => { setDraft(saved); setPageIx(0); }} className="rounded-ctl border border-line px-3 py-1.5 text-sm hover:bg-bg disabled:opacity-50">تراجع</button>
          <button type="button" disabled={busy || !model.custom} onClick={() => window.confirm('العودة إلى النموذج الافتراضي؟') && run(() => adminModelReset(model.id), 'عاد النموذج إلى الافتراضي.')} className="rounded-ctl border border-line px-3 py-1.5 text-sm text-danger hover:bg-bg disabled:opacity-50">الافتراضي</button>
        </div>
        {problems.length > 0 && <p className="text-tiny text-danger">ما بينحفظ النموذج وفيه قسم ما إله شريحة جاهزة صالحة: الموقع بينبني من النموذج بالضبط، فما لازم يسقط ولا قسم.</p>}
      </section>
    </div>
  );
};
