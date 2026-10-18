// «تنظيف البيانات» (owner only): what accounts without a sign-in left behind (server/cleanup.ts). «افحص الآن» only
// counts; «احذف اليتيم» wipes those accounts' photos (Firebase Storage and R2) and records. The daily job scans too.
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminError, CleanupReport, adminCleanup, adminCleanupLast } from '../../services/adminApi';

const when = (ms: number) => (ms ? new Date(ms).toLocaleString('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const size = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export const CleanupView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [report, setReport] = useState<CleanupReport | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const fail = (e: unknown) => ((e as AdminError)?.code === 'session' ? onSessionEnd() : setError('تعذّر التنفيذ.'));
  useEffect(() => { adminCleanupLast().then((r) => setReport(r.report)).catch(fail); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async (apply: boolean) => {
    if (apply && !window.confirm('سيُحذف نهائياً كل ما تركه الحسابات المحذوفة (صور وسجلات). متأكد؟')) return;
    setBusy(apply ? 'apply' : 'scan');
    setError('');
    try { setReport((await adminCleanup(apply)).report); } catch (e) { fail(e); }
    setBusy('');
  };
  const rows: [string, string][] = report ? [
    ['حسابات يتيمة (بلا تسجيل دخول)', String(report.orphanAccounts)],
    ['ملفات صور يتيمة في Firebase', `${report.orphanFiles} · ${size(report.orphanBytes)}`],
    ['ملفات صور يتيمة في R2', String(report.orphanR2Files)],
    ['سجلات يتيمة (تصميم، دليل، صفحات منشورة)', String(report.orphanDocs)],
    ['صور قديمة مشتركة (للعلم فقط، لا تُحذف)', `${report.legacyFiles} · ${size(report.legacyBytes)}`],
    ['حسابات نُظِّفت في آخر تشغيل', String(report.wiped)],
  ] : [];
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">تنظيف البيانات</h1>
      <p className="text-small text-muted">يفحص الحسابات التي اختفى تسجيل دخولها وبقيت لها صور وسجلات. الفحص اليومي يعدّ فقط، والحذف بزرّك.</p>
      <div className="flex flex-wrap gap-2">
        <button disabled={!!busy} onClick={() => run(false)} className="inline-flex items-center gap-1 rounded-ctl border border-line bg-surface px-3 py-1.5 text-small disabled:opacity-50">{busy === 'scan' && <Loader2 className="h-3.5 w-3.5 animate-spin" />} افحص الآن</button>
        <button disabled={!!busy || !report?.orphanAccounts} onClick={() => run(true)} className="inline-flex items-center gap-1 rounded-ctl bg-danger px-3 py-1.5 text-small text-white disabled:opacity-50">{busy === 'apply' && <Loader2 className="h-3.5 w-3.5 animate-spin" />} احذف اليتيم</button>
      </div>
      {error && <p className="text-small text-danger">{error}</p>}
      {report && (
        <div className="rounded-card border border-line bg-surface p-4 text-small">
          <p className="mb-2 text-muted">آخر فحص: {when(report.at)}{report.applied ? ' · مع حذف' : ' · عدّ فقط'}{report.partial ? ' · جزئي (الكمية كبيرة، أعد التشغيل)' : ''}</p>
          <dl className="grid gap-1">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-line py-1 last:border-0"><dt>{k}</dt><dd dir="ltr">{v}</dd></div>)}</dl>
        </div>
      )}
      {!report && !busy && <p className="text-small text-muted">لم يُجرَ فحص بعد.</p>}
    </section>
  );
};
