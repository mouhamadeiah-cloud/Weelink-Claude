// «صحة النظام» (owner only): what the server is set up with (yes or no, never the values), how Wee AI
// calls did in the last 24 hours (a Gemini 429 means the free quota is used up), the daily reminder
// runs, and the last email errors.
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { AdminError, Health, adminHealth } from '../../services/adminApi';

const when = (ms: number) => (ms ? new Date(ms).toLocaleString('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const CONFIG: [keyof Health['config'], string, string][] = [
  ['serviceAccount', 'Firebase (FIREBASE_SERVICE_ACCOUNT)', 'بدونه لا يعمل الأدمن ولا الحفظ من السيرفر'],
  ['gemini', 'Wee AI (GEMINI_API_KEY)', 'بدونه لا يعمل «ابن صفحتي»'],
  ['resend', 'الإيميل (RESEND_API_KEY)', 'بدونه لا فواتير ولا تذكيرات'],
  ['emailFrom', 'عنوان المرسل (EMAIL_FROM)', 'يلزم دومين مؤكَّد في Resend للوصول للمشتركين'],
  ['cron', 'المهمة اليومية (CRON_SECRET)', 'بدونها لا تذكير ولا تجميد تلقائي'],
];

const Dot: React.FC<{ ok: boolean }> = ({ ok }) => <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${ok ? 'bg-success' : 'bg-danger'}`} />;

export const HealthView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminHealth());
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل الحالة.');
    }
    setLoading(false);
  }, [onSessionEnd]);
  useEffect(() => { load(); }, [load]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-title font-semibold">صحة النظام</h1>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-ctl border border-line bg-surface px-3 py-2 text-small hover:bg-bg disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> تحديث</button>
      </div>
      {error && <p className="text-small text-danger">{error}</p>}
      {!data ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : (
        <>
          <div className="rounded-card border border-line bg-surface p-3">
            <h2 className="mb-2 font-medium">الإعدادات في Cloudflare</h2>
            <ul className="flex flex-col gap-2 text-small">
              {CONFIG.map(([k, label, hint]) => (
                <li key={k} className="flex items-start gap-2"><Dot ok={data.config[k]} /><div><div>{label}: <b>{data.config[k] ? 'موجود' : 'ناقص'}</b></div>{!data.config[k] && <div className="text-tiny text-faint">{hint}</div>}</div></li>
              ))}
            </ul>
          </div>

          <div className="rounded-card border border-line bg-surface p-3">
            <h2 className="mb-2 font-medium">Wee AI آخر 24 ساعة</h2>
            <p className="flex items-center gap-2 text-small"><Dot ok={!data.ai.quotaHit} /> {data.ai.quotaHit ? 'وصلنا حدّ حصة Gemini (429). أجّل البناء أو ارفع الخطة.' : 'لا أخطاء حصة.'}</p>
            <p className="mt-1 text-small text-muted">{data.ai.calls.toLocaleString('ar-SY')} استدعاء، فشل منها {data.ai.failed.toLocaleString('ar-SY')}{Object.entries(data.ai.reasons).length ? ` (${Object.entries(data.ai.reasons).map(([r, n]) => `${r}: ${n}`).join('، ')})` : ''}</p>
            {data.ai.lastFailures.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 text-tiny text-muted">{data.ai.lastFailures.map((f, i) => <li key={i}>{when(f.at)} · {f.kind} · <span dir="ltr">{f.reason}</span></li>)}</ul>
            )}
          </div>

          <div className="rounded-card border border-line bg-surface p-3">
            <h2 className="mb-2 font-medium">المهمة اليومية (التذكير والتجميد)</h2>
            {data.daily.length ? (
              <table className="w-full text-right text-small">
                <thead className="text-muted"><tr>{['الوقت', 'فُحص', 'جُمّد', 'ذُكّر', 'تخطّى', 'فشل'].map((h) => <th key={h} className="py-1 font-medium">{h}</th>)}</tr></thead>
                <tbody>{data.daily.map((d, i) => <tr key={i} className="border-t border-line"><td className="py-1.5">{when(d.at)}</td><td>{d.checked}</td><td>{d.frozen}</td><td>{d.reminded}</td><td>{d.skipped}</td><td className={d.failed ? 'text-danger' : ''}>{d.failed}</td></tr>)}</tbody>
              </table>
            ) : <p className="text-small text-faint">ما اشتغلت بعد. تحقق من CRON_SECRET في Cloudflare.</p>}
          </div>

          <div className="rounded-card border border-line bg-surface p-3">
            <h2 className="mb-2 font-medium">أخطاء الإرسال والدخول</h2>
            <p className="text-small text-muted">محاولات دخول فاشلة آخر 24 ساعة: <b className="text-ink">{data.loginFails}</b></p>
            {data.mailFails.length ? (
              <ul className="mt-2 flex flex-col gap-1 text-tiny text-muted">{data.mailFails.map((f, i) => <li key={i}>{when(f.at)} · {f.admin} · <span dir="ltr">{f.action}</span></li>)}</ul>
            ) : <p className="mt-1 text-small text-faint">لا أخطاء إيميل مسجّلة.</p>}
          </div>
        </>
      )}
    </section>
  );
};
