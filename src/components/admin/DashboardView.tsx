// «الداشبورد» in the admin site: how the subscribers and the money are doing (new subscribers and
// revenue per month, renewals, who is about to expire), the heaviest Wee AI users, and the exports.
import React, { useCallback, useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { SubscriberDetail } from './SubscriberDetail';
import { AdminError, Dashboard, adminBackup, adminDashboard, adminExport, saveTextFile } from '../../services/adminApi';

const num = (n: number) => Math.round(n).toLocaleString('ar-SY');
const money = (n: number) => `${num(n)} ل.س`;
const day = (ms: number) => new Date(ms).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' });
// The month's number (1 to 12): twelve bars leave no room for the names.
const monthName = (m: string) => Number(m.slice(5)).toLocaleString('ar-SY');

// Bars drawn on one scale: the tallest value fills the height, every label is the bar's own value.
const BarChart: React.FC<{ title: string; rows: { label: string; value: number }[]; format: (n: number) => string }> = ({ title, rows, format }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-card border border-line bg-surface p-3">
      <h2 className="mb-3 font-medium">{title}</h2>
      <div className="flex h-40 items-end gap-1.5" dir="ltr">
        {rows.map((r) => (
          <div key={r.label} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${r.label}: ${format(r.value)}`}>
            <div className="mb-0.5 truncate text-center text-tiny tabular-nums text-muted">{r.value ? format(r.value) : ''}</div>
            <div className="w-full rounded-t bg-brand" style={{ height: `${(r.value / max) * 100}%`, minHeight: r.value ? 3 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5" dir="ltr">{rows.map((r) => <div key={r.label} className="min-w-0 flex-1 truncate text-center text-tiny text-faint">{r.label}</div>)}</div>
    </div>
  );
};

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

export const DashboardView: React.FC<{ onSessionEnd: () => void; can: string[] }> = ({ onSessionEnd, can }) => {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [openUid, setOpenUid] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await adminDashboard());
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل الداشبورد.');
    }
  }, [onSessionEnd]);
  useEffect(() => { load(); }, [load]);

  const download = async (what: 'subscribers' | 'payments' | 'backup') => {
    setBusy(what);
    setError('');
    try {
      if (what === 'backup') {
        const r = await adminBackup();
        saveTextFile(r.filename, r.json, 'application/json');
      } else {
        const r = await adminExport(what);
        saveTextFile(r.filename, r.csv, 'text/csv;charset=utf-8', true);
      }
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر التصدير.');
    }
    setBusy('');
  };

  const t = data?.totals;
  const tiles: [string, string, string?][] = t && data ? [
    ['مشتركون جدد هذا الشهر', num(t.newThisMonth)],
    ['إيراد هذا الشهر', money(t.revenueThisMonth)],
    ['اشتراكات فعّالة', num(t.paidActive), `من ${num(t.users)} حساب`],
    ['تنتهي خلال 30 يوماً', num(t.expiring30), t.overdue ? `و${num(t.overdue)} انتهت ولم تُجمَّد` : undefined],
    ['مستحق خلال 30 يوماً', money(t.due30), 'تقدير من آخر دفعة لكل مشترك'],
    ['نسبة التجديد', data.renewal.rate === null ? '—' : `${Math.round(data.renewal.rate * 100)}%`, data.renewal.matured ? `${num(data.renewal.renewed)} من ${num(data.renewal.matured)} خلال ${data.renewal.days} يوماً` : 'لا اشتراكات انتهت بعد'],
  ] : [];

  const btn = 'inline-flex items-center gap-1.5 rounded-ctl border border-line bg-surface px-3 py-2 text-small hover:bg-bg disabled:opacity-50';
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-title font-semibold">الداشبورد</h1>
        <div className="flex flex-wrap gap-2">
          {can.includes('export') && <button disabled={!!busy} onClick={() => download('subscribers')} className={btn}>{busy === 'subscribers' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} المشتركون CSV</button>}
          {can.includes('export') && <button disabled={!!busy} onClick={() => download('payments')} className={btn}>{busy === 'payments' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} الدفعات CSV</button>}
          {can.includes('backup') && <button disabled={!!busy} onClick={() => download('backup')} className={btn}>{busy === 'backup' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} نسخة احتياطية كاملة</button>}
        </div>
      </div>
      {error && <p className="text-small text-danger">{error}</p>}
      {!data ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {tiles.map(([label, value, hint]) => (
              <div key={label} className="rounded-card border border-line bg-surface p-3">
                <div className="text-small text-muted">{label}</div>
                <div className="text-title font-semibold tabular-nums">{value}</div>
                {hint && <div className="text-tiny text-faint">{hint}</div>}
              </div>
            ))}
          </div>
          {data.truncated && <p className="text-small text-warn">البيانات أكبر من الحد المعروض، فبعض الأرقام جزئية.</p>}
          {t!.reportsOpen > 0 && <p className="text-small text-warn">فيه {num(t!.reportsOpen)} بلاغ عن تقييمات ينتظر المراجعة (قسم «بلاغات التقييمات»).</p>}

          <div className="grid gap-4 lg:grid-cols-2">
            <BarChart title="مشتركون جدد (آخر 12 شهراً، حسب رقم الشهر)" rows={data.chart.map((c) => ({ label: monthName(c.month), value: c.newUsers }))} format={(n) => num(n)} />
            <BarChart title="الإيراد بالليرة (آخر 12 شهراً، حسب رقم الشهر)" rows={data.chart.map((c) => ({ label: monthName(c.month), value: c.revenue }))} format={compact} />
          </div>
          <p className="text-tiny text-faint">مجموع إيراد 12 شهراً: {money(t!.revenue12)} · مجمّدون: {num(t!.frozen)} · ملغون: {num(t!.cancelled)}</p>

          <div className="rounded-card border border-line bg-surface p-3">
            <h2 className="mb-2 font-medium">ينتهي قريباً</h2>
            {data.expiring.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-right text-small">
                  <thead className="text-muted"><tr>{['المشترك', 'الباقة', 'يُجمَّد في', 'المتبقي', 'آخر دفعة'].map((h) => <th key={h} className="py-1 font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {data.expiring.map((x) => (
                      <tr key={x.uid} onClick={() => setOpenUid(x.uid)} className="cursor-pointer border-t border-line hover:bg-bg">
                        <td className="max-w-[200px] truncate py-1.5">{x.name || x.email || x.uid}</td>
                        <td>{x.planName || '—'}</td>
                        <td>{day(x.freezeAt)}</td>
                        <td className={x.left <= 0 ? 'text-danger' : x.left < 7 * 86400000 ? 'text-warn' : ''}>{x.left <= 0 ? 'انتهى' : `${Math.ceil(x.left / 86400000)} يوم`}</td>
                        <td className="tabular-nums">{x.amount ? money(x.amount) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-small text-faint">لا اشتراكات تنتهي خلال 30 يوماً.</p>}
          </div>

          <div className="rounded-card border border-line bg-surface p-3">
            <h2 className="mb-2 font-medium">الأعلى استهلاكاً لتوكنز Wee AI (إجمالي)</h2>
            {data.top.length ? (
              <table className="w-full text-right text-small">
                <thead className="text-muted"><tr>{['المشترك', 'المستهلك', 'الرصيد'].map((h) => <th key={h} className="py-1 font-medium">{h}</th>)}</tr></thead>
                <tbody>{data.top.map((u) => <tr key={u.uid} onClick={() => setOpenUid(u.uid)} className="cursor-pointer border-t border-line hover:bg-bg"><td className="max-w-[220px] truncate py-1.5">{u.name}</td><td className="tabular-nums">{num(u.used)}</td><td className="tabular-nums">{num(u.balance)}</td></tr>)}</tbody>
              </table>
            ) : <p className="text-small text-faint">لا استهلاك مسجّل بعد.</p>}
          </div>
        </>
      )}
      {openUid && <SubscriberDetail can={can} uid={openUid} onClose={() => setOpenUid('')} onChanged={load} onSessionEnd={onSessionEnd} />}
    </section>
  );
};
