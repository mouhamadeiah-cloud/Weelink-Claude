// «مراجعة الشرائح»: the slides designers exported to the gallery wait here as «بانتظار المراجعة»
// until the platform approves or rejects them. A rejection needs a reason. The preview is the live
// slide, drawn the way the gallery will draw it (videos and motion play). Only an approved slide ever appears in the gallery.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Eye, Loader2, Pencil, ShieldCheck, Trash2, X } from 'lucide-react';
import { AdminError, GallerySlideRow, SeedResult, SeedStatus, SlideStatus, adminEditReview, adminGalleryDelete, adminGallerySave, adminSeed, adminSeedStatus, adminSlideReview, adminSlides, openGalleryEditor } from '../../services/adminApi';
import { PagePreviewModal } from './PagePreviewModal';
import { categoriesFor, categoryLabel, slidesWord } from '../../data/slideCategories';
import { LivePage, LiveSlide } from '../gallery/LiveSlide';
import { deserializeElements } from '../../utils/elementStorage';
import { findContactInfo, findNavbarContact, CONTACT_KIND_LABEL } from '../../utils/contactCheck';

const TABS: [SlideStatus, string][] = [['pending', 'بانتظار المراجعة'], ['approved', 'مقبولة'], ['rejected', 'مرفوضة']];
const date = (ms: number) => (ms ? new Date(ms).toLocaleString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const SlideCard: React.FC<{ row: GallerySlideRow; onChanged: () => void; onSessionEnd: () => void }> = ({ row, onChanged, onSessionEnd }) => {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [info, setInfo] = useState({ name: row.name, category: row.category, designerName: row.designerName });
  // A second look at the texts, the same check the designer's export runs.
  const elements = useMemo(() => deserializeElements(row.elements), [row.elements]);
  const contact = [...findContactInfo(elements), ...(row.kind === 'page' ? findNavbarContact(row.page?.navbar) : [])];

  const review = async (decision: 'approve' | 'reject') => {
    setBusy(true);
    setError('');
    try {
      if (row.isEdit) await adminEditReview(row.id, decision, reason);
      else await adminSlideReview(row.id, decision, reason);
      onChanged();
    } catch (e) {
      const code = (e as AdminError)?.code;
      if (code === 'session') return onSessionEnd();
      setError(code === 'reason' ? 'اكتب سبب الرفض (3 أحرف على الأقل).' : code === 'bad-category' ? 'تصنيف الشريحة غير معروف.' : 'تعذّر الحفظ. جرّب مرة ثانية.');
    }
    setBusy(false);
  };

  // The admin edits anything: the name and category here, the design in the designer's panel (a new tab).
  const saveInfo = async () => {
    setBusy(true);
    setError('');
    try {
      await adminGallerySave(row.id, { page: row.kind === 'page' ? row.page : { slides: [row.slide] }, elements: row.elements, name: info.name, category: info.category, designerName: info.designerName });
      setEditingInfo(false);
      onChanged();
    } catch (e) {
      const code = (e as AdminError)?.code;
      if (code === 'session') return onSessionEnd();
      setError(code === 'bad_name' ? 'الاسم من حرفين إلى 60 حرفاً.' : code === 'bad_category' ? 'التصنيف غير معروف.' : 'تعذّر الحفظ.');
    }
    setBusy(false);
  };
  const remove = async () => {
    if (!window.confirm(`حذف «${row.name}» من المعرض نهائياً؟ لا يمكن التراجع.`)) return;
    setBusy(true);
    try {
      await adminGalleryDelete(row.id);
      onChanged();
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر الحذف.');
    }
    setBusy(false);
  };
  const edit = () => {
    if (!openGalleryEditor(row.id)) setError('تعذّر فتح لوحة المصمم. اسمح للنوافذ المنبثقة وجرّب مرة ثانية.');
  };

  return (
    <article className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      {viewing && <PagePreviewModal title={row.name} kind={row.kind} slide={row.slide} page={row.page} elements={row.elements} onClose={() => setViewing(false)} onEdit={row.isEdit ? undefined : edit} />}
      {row.isEdit && <p className="rounded-ctl bg-warn/10 p-2 text-small font-medium text-warn">تعديل من المصمم على تصميم منشور: يبقى القديم في المعرض حتى تقبله.</p>}
      <div className="overflow-hidden rounded-ctl border border-line">{row.kind === 'page' && row.page ? <LivePage page={row.page} elements={elements} maxHeight={420} /> : <LiveSlide slide={row.slide} elements={elements} />}</div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-small">
        <dt className="text-muted">المصمم</dt><dd>{row.designerName || '—'} {row.official ? <span className="rounded-full bg-brand/10 px-2 py-0.5 text-tiny font-bold text-brand">رسمي</span> : <span className="text-tiny text-faint" dir="ltr">{row.designerUid.slice(0, 8)}</span>}</dd>
        <dt className="text-muted">النوع</dt><dd>{row.kind === 'page' ? `صفحة (${slidesWord(row.page?.slides?.length || 1)} مع شريط تنقل) · ` : 'شريحة · '}{categoryLabel(row.category)}</dd>
        <dt className="text-muted">التصدير</dt><dd>{date(row.createdAt)}</dd>
        <dt className="text-muted">وافق على القانون</dt><dd>النسخة {row.lawVersion} · {row.acceptedAt ? date(Date.parse(row.acceptedAt)) : '—'}</dd>
        {row.status === 'rejected' && <><dt className="text-muted">سبب الرفض</dt><dd className="text-danger">{row.reason || '—'}</dd></>}
        {row.reviewedBy && <><dt className="text-muted">راجعها</dt><dd>{row.reviewedBy}</dd></>}
        {row.editedBy && <><dt className="text-muted">آخر تعديل</dt><dd>{row.editedBy.startsWith('admin:') ? `الإدارة (${row.editedBy.slice(6)})` : 'المصمم'}</dd></>}
      </dl>
      {contact.length > 0 && (
        <p className="rounded-ctl bg-danger/5 p-2 text-small text-danger">فيها بيانات تواصل: {contact.map((c) => CONTACT_KIND_LABEL[c.kind]).join('، ')}</p>
      )}
      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setViewing(true)} className="inline-flex items-center gap-1.5 rounded-ctl border border-line px-3 py-1.5 text-small hover:bg-bg"><Eye className="h-4 w-4" /> دخول الصفحة</button>
        {!row.isEdit && <button type="button" onClick={edit} className="inline-flex items-center gap-1.5 rounded-ctl border border-line px-3 py-1.5 text-small hover:bg-bg"><Pencil className="h-4 w-4" /> تعديل في لوحة المصمم</button>}
        {!row.isEdit && <button type="button" onClick={() => setEditingInfo((v) => !v)} className="rounded-ctl border border-line px-3 py-1.5 text-small hover:bg-bg">بيانات</button>}
        {!row.isEdit && <button type="button" disabled={busy} onClick={remove} className="inline-flex items-center gap-1.5 rounded-ctl border border-line px-3 py-1.5 text-small text-danger hover:bg-bg disabled:opacity-50"><Trash2 className="h-4 w-4" /> حذف</button>}
      </div>
      {editingInfo && (
        <div className="flex flex-col gap-2 rounded-ctl border border-line bg-bg p-3">
          <label className="flex flex-col gap-1 text-small">الاسم<input value={info.name} maxLength={60} onChange={(e) => setInfo({ ...info, name: e.target.value })} className="rounded-ctl border border-line bg-surface p-2 outline-none focus:border-brand" /></label>
          <label className="flex flex-col gap-1 text-small">التصنيف
            <select value={info.category} onChange={(e) => setInfo({ ...info, category: e.target.value })} className="rounded-ctl border border-line bg-surface p-2 outline-none focus:border-brand">
              {categoriesFor(row.kind).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-small">اسم المصمم المعروض<input value={info.designerName} maxLength={60} onChange={(e) => setInfo({ ...info, designerName: e.target.value })} className="rounded-ctl border border-line bg-surface p-2 outline-none focus:border-brand" /></label>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={saveInfo} className="rounded-ctl bg-brand px-4 py-2 text-small font-medium text-white disabled:opacity-50">حفظ</button>
            <button type="button" onClick={() => setEditingInfo(false)} className="rounded-ctl px-4 py-2 text-small text-muted hover:bg-surface">إلغاء</button>
          </div>
        </div>
      )}

      {row.status !== 'approved' && !rejecting && (
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => review('approve')} className="inline-flex items-center gap-1.5 rounded-ctl bg-success px-4 py-2 text-small font-medium text-white hover:opacity-90 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {row.isEdit ? 'قبول التعديل ونشره' : 'قبول ونشر في المعرض'}
          </button>
          {(row.status === 'pending') && (
            <button disabled={busy} onClick={() => setRejecting(true)} className="inline-flex items-center gap-1.5 rounded-ctl border border-line px-4 py-2 text-small font-medium text-danger hover:bg-bg disabled:opacity-50">
              <X className="h-4 w-4" /> رفض
            </button>
          )}
        </div>
      )}
      {row.status === 'approved' && (
        <button disabled={busy} onClick={() => setRejecting(true)} className="self-start rounded-ctl border border-line px-4 py-2 text-small text-danger hover:bg-bg disabled:opacity-50">سحبها من المعرض</button>
      )}
      {rejecting && (
        <div className="flex flex-col gap-2">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} placeholder="سبب الرفض (يُحفظ مع الشريحة)" className="w-full rounded-ctl border border-line bg-surface p-2.5 text-small outline-none focus:border-brand" />
          <div className="flex gap-2">
            <button disabled={busy || reason.trim().length < 3} onClick={() => review('reject')} className="inline-flex items-center gap-1.5 rounded-ctl bg-danger px-4 py-2 text-small font-medium text-white hover:opacity-90 disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} تأكيد الرفض
            </button>
            <button disabled={busy} onClick={() => { setRejecting(false); setReason(''); }} className="rounded-ctl px-4 py-2 text-small text-muted hover:bg-bg">إلغاء</button>
          </div>
        </div>
      )}
    </article>
  );
};

// The «Weelink AI» pages: published here, their photos found on Unsplash by the searches written in the pages.
const SeedBox: React.FC<{ onSessionEnd: () => void; onDone: () => void }> = ({ onSessionEnd, onDone }) => {
  const [status, setStatus] = useState<SeedStatus | null>(null);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(() => adminSeedStatus().then(setStatus).catch((e) => { if ((e as AdminError)?.code === 'session') onSessionEnd(); }), [onSessionEnd]);
  useEffect(() => { refresh(); }, [refresh]);
  if (!status || status.total === 0) return null;

  const run = async (opts: { overwrite?: boolean; publish?: boolean }) => {
    if (opts.overwrite && !window.confirm('إعادة بناء النماذج؟ تُستبدل تصاميمها وتبقى إعجاباتها، وما عدّلته بيدك لا يُمس.')) return;
    if (opts.publish && !window.confirm('نشر كل النماذج في المعرض مباشرة دون مراجعتها واحداً واحداً؟')) return;
    setBusy(true);
    setError('');
    try {
      setResult(await adminSeed(opts));
      await refresh();
      onDone();
    } catch (e) {
      const code = (e as AdminError)?.code;
      if (code === 'session') return onSessionEnd();
      setError(code === 'no-unsplash-key' ? 'مفتاح Unsplash غير مضبوط في Vercel (UNSPLASH_ACCESS_KEY).' : 'تعذّر التنفيذ. جرّب مرة ثانية.');
    }
    setBusy(false);
  };
  const ready = status.published + status.staged;

  return (
    <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
      <p className="text-small font-medium">نماذج Weelink AI: {ready.toLocaleString('ar-SY')} من {status.total.toLocaleString('ar-SY')} جاهزة ({status.published.toLocaleString('ar-SY')} منشورة، {status.staged.toLocaleString('ar-SY')} بانتظار مراجعتك)</p>
      <p className="text-small text-muted leading-relaxed">
        «تجهيز النماذج» يضعها في «بانتظار المراجعة» باسم «Weelink AI» وصورها من Unsplash بكلمات البحث المكتوبة فيها. افتح كل نموذج بزر «دخول الصفحة»، عدّله بزر «تعديل في لوحة المصمم»، ثم اضغط «قبول ونشر في المعرض».
        {status.searchesLeft > 0 ? ` بقي ${status.searchesLeft.toLocaleString('ar-SY')} بحث. مفتاح Unsplash التجريبي يسمح بنحو 50 بحثاً في الساعة، فإن توقف التجهيز اضغط الزر بعد ساعة.` : ' كل الصور وُجدت.'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy || !status.unsplash} onClick={() => run({})} className="inline-flex items-center gap-1.5 rounded-ctl bg-brand px-4 py-2 text-small font-medium text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} تجهيز النماذج للمراجعة</button>
        {ready > 0 && <button type="button" disabled={busy || !status.unsplash} onClick={() => run({ overwrite: true })} className="rounded-ctl border border-line px-4 py-2 text-small text-muted hover:bg-bg disabled:opacity-50">إعادة بناء غير المعدّل</button>}
        {status.staged > 0 && <button type="button" disabled={busy || !status.unsplash} onClick={() => run({ publish: true })} className="rounded-ctl border border-line px-4 py-2 text-small text-muted hover:bg-bg disabled:opacity-50">نشر الكل مباشرة</button>}
        {!status.unsplash && <span className="text-small text-danger">مفتاح Unsplash غير مضبوط.</span>}
      </div>
      {result && (
        <p className="text-small text-muted leading-relaxed">
          جاهز {result.published.length.toLocaleString('ar-SY')}، ينتظر صوره {result.waiting.length.toLocaleString('ar-SY')}، أُجري {result.spent.toLocaleString('ar-SY')} بحثاً.
          {result.limited ? ' وصلنا حد Unsplash: أعد المحاولة بعد ساعة.' : ''}{result.failed.length ? ` تعذّر: ${result.failed.join(' · ')}` : ''}
        </p>
      )}
      {error && <p role="alert" className="text-small text-danger">{error}</p>}
    </div>
  );
};

export const SlidesReviewView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [status, setStatus] = useState<SlideStatus>('pending');
  const [rows, setRows] = useState<GallerySlideRow[] | null>(null);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async (st: SlideStatus) => {
    setError('');
    try {
      const r = await adminSlides(st);
      setRows(r.rows);
      setPending(r.counts.pending);
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل الشرائح.');
      setRows([]);
    }
  }, [onSessionEnd]);

  useEffect(() => {
    setRows(null);
    load(status);
  }, [status, load]);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="flex items-center gap-2 text-title font-semibold"><ShieldCheck className="h-6 w-6 text-brand" /> مراجعة الشرائح</h1>
      <p className="text-small text-muted leading-relaxed">الشرائح التي صدّرها المصممون. لا تظهر في المعرض إلا بعد قبولها.</p>
      <SeedBox onSessionEnd={onSessionEnd} onDone={() => load(status)} />
      <div className="flex flex-wrap gap-2">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setStatus(id)} className={`rounded-full border px-4 py-1.5 text-small ${status === id ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted hover:bg-bg'}`}>
            {label}{id === 'pending' && pending > 0 ? ` (${pending.toLocaleString('ar-SY')})` : ''}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-small text-danger">{error}</p>}
      {rows === null ? <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-muted" /> : rows.length === 0 ? (
        <p className="mt-8 text-center text-muted">لا توجد شرائح هنا.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => <SlideCard key={`${r.id}:${r.isEdit ? 'edit' : 'doc'}`} row={r} onChanged={() => load(status)} onSessionEnd={onSessionEnd} />)}
        </div>
      )}
    </section>
  );
};
