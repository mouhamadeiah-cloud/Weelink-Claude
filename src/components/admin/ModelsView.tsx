// «نماذج الصفحات»: the sections each kind of page is made of, in order (src/data/pageModels.ts has the defaults).
// The admin reorders them, changes when a section appears and adds or removes sections; «الافتراضي» goes back to the defaults.
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Trash2 } from 'lucide-react';
import { AdminError, adminModelReset, adminModelSave, adminModels } from '../../services/adminApi';
import { MODEL_CATEGORIES, ModelSection, PageModel, SectionMode, SectionNeed } from '../../data/pageModels';

const MODE_LABEL: Record<SectionMode, string> = { always: 'دائماً', if: 'إذا توفّر', ask: 'يختاره الزبون' };
const NEED_LABEL: Record<SectionNeed, string> = { services: 'خدمات', priced: 'خدمات بأسعار', photos: 'صور المعرض' };
const PART_LABEL: Record<string, string> = { front: 'الواجهة', main: 'القسم الحي', priceList: 'قائمة الأسعار' };
const nameOf = (id: string) => MODEL_CATEGORIES.find((c) => c.id === id)?.name || id;
const idOf = (s: Pick<ModelSection, 'category' | 'part'>) => (s.part ? `${s.category}:${s.part}` : s.category);

export const ModelsView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [models, setModels] = useState<(PageModel & { custom: boolean })[] | null>(null);
  const [open, setOpen] = useState('page-free');
  const [draft, setDraft] = useState<ModelSection[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const fail = useCallback((e: unknown) => {
    if ((e as AdminError)?.code === 'session') return onSessionEnd();
    setNote('تعذّر تنفيذ العملية، جرّب مرة ثانية.');
  }, [onSessionEnd]);
  const load = useCallback(() => adminModels().then((r) => { setModels(r.models); return r.models; }).catch(fail), [fail]);
  useEffect(() => { load(); }, [load]);
  const model = models?.find((m) => m.id === open);
  useEffect(() => { if (model) setDraft(model.sections); }, [model]);

  if (!models || !model) return <div className="flex justify-center p-10 text-faint"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const changed = JSON.stringify(draft) !== JSON.stringify(model.sections);
  const patch = (i: number, p: Partial<ModelSection>) => setDraft((d) => d.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const move = (i: number, by: number) => setDraft((d) => { const n = [...d]; [n[i], n[i + by]] = [n[i + by], n[i]]; return n; });
  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setNote('');
    try { await fn(); await load(); setNote(done); } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const addable = MODEL_CATEGORIES.filter((c) => !draft.some((s) => s.id === c.id));

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <h2 className="text-lg font-bold">نماذج الصفحات</h2>
        <p className="text-sm text-muted">لكل نوع صفحة أقسامه بالترتيب. «دائماً» يدخل كل صفحة، «إذا توفّر» يدخل عند وجود ما يحتاجه، و«يختاره الزبون» يظهر مربعاً في الأسئلة.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {models.map((m) => (
          <button key={m.id} type="button" onClick={() => setOpen(m.id)} className={`rounded-full border px-3 py-1 text-sm ${m.id === open ? 'border-brand bg-brand text-white' : 'border-line bg-white hover:bg-bg'}`}>{m.name}{m.custom && <span className="mr-1" title="معدّل">●</span>}</button>
        ))}
      </div>
      {note && <p className="rounded-ctl bg-bg px-3 py-2 text-sm">{note}</p>}
      <section className="space-y-2 rounded-card border border-line bg-white p-4">
        {draft.map((s, i) => (
          <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-ctl border border-line p-2 text-sm">
            <span className="w-6 text-center text-muted">{i + 1}</span>
            <span className="min-w-28 font-semibold">{nameOf(s.category)}{s.part && <span className="mr-1 text-tiny text-muted">· {PART_LABEL[s.part]}</span>}</span>
            <select value={s.mode} onChange={(e) => { const mode = e.target.value as SectionMode; patch(i, { mode, need: mode === 'if' ? s.need || 'services' : undefined, defaultOn: mode === 'ask' ? s.defaultOn : undefined }); }} className="rounded-ctl border border-line bg-white px-2 py-1">
              {(Object.keys(MODE_LABEL) as SectionMode[]).map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
            </select>
            {s.mode === 'if' && (
              <select value={s.need || 'services'} onChange={(e) => patch(i, { need: e.target.value as SectionNeed })} className="rounded-ctl border border-line bg-white px-2 py-1">
                {(Object.keys(NEED_LABEL) as SectionNeed[]).map((n) => <option key={n} value={n}>{NEED_LABEL[n]}</option>)}
              </select>
            )}
            {s.mode === 'ask' && <label className="inline-flex items-center gap-1"><input type="checkbox" checked={!!s.defaultOn} onChange={(e) => patch(i, { defaultOn: e.target.checked })} /> معلَّم من البداية</label>}
            <span className="mr-auto inline-flex gap-1">
              <button type="button" title="أعلى" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowUp size={14} /></button>
              <button type="button" title="أسفل" disabled={i === draft.length - 1} onClick={() => move(i, 1)} className="rounded-ctl border border-line p-1.5 hover:bg-bg disabled:opacity-40"><ArrowDown size={14} /></button>
              <button type="button" title="حذف القسم" onClick={() => setDraft((d) => d.filter((_, j) => j !== i))} className="rounded-ctl border border-line p-1.5 text-danger hover:bg-bg"><Trash2 size={14} /></button>
            </span>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <select value="" onChange={(e) => e.target.value && setDraft((d) => [...d, { id: idOf({ category: e.target.value }), category: e.target.value, mode: 'ask' }])} className="rounded-ctl border border-line bg-white px-2 py-1.5 text-sm">
            <option value="">إضافة قسم…</option>
            {addable.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" disabled={busy || !changed || !draft.length} onClick={() => run(() => adminModelSave(model.id, draft), 'حُفظ النموذج.')} className="inline-flex items-center gap-1.5 rounded-ctl bg-brand px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ</button>
          <button type="button" disabled={busy || !changed} onClick={() => setDraft(model.sections)} className="rounded-ctl border border-line px-3 py-1.5 text-sm hover:bg-bg disabled:opacity-50">تراجع</button>
          <button type="button" disabled={busy || !model.custom} onClick={() => window.confirm('العودة إلى النموذج الافتراضي؟') && run(() => adminModelReset(model.id), 'عاد النموذج إلى الافتراضي.')} className="rounded-ctl border border-line px-3 py-1.5 text-sm text-danger hover:bg-bg disabled:opacity-50">الافتراضي</button>
        </div>
      </section>
    </div>
  );
};
