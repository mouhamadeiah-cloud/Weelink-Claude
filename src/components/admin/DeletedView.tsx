// «الزبائن المحذوفين» in the admin site: the card kept of each customer the team deleted (server/billing.ts):
// name, phone, email, sign-up and end dates, who deleted them and why. Their pages and data are gone.
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminError, DeletedCustomer, adminDeletedList } from '../../services/adminApi';

const day = (ms: number) => (ms ? new Date(ms).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

export const DeletedView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [rows, setRows] = useState<DeletedCustomer[] | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    adminDeletedList().then((r) => setRows(r.rows)).catch((e) => ((e as AdminError)?.code === 'session' ? onSessionEnd() : setError('تعذّر التحميل.')));
  }, [onSessionEnd]);
  const term = q.trim().toLowerCase();
  const shown = (rows || []).filter((r) => !term || [r.name, r.email, r.phone, r.address || ''].some((v) => v.toLowerCase().includes(term)));
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">الزبائن المحذوفين</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الإيميل أو الهاتف" className="rounded-ctl border border-line bg-surface px-3 py-2 text-small outline-none focus:border-brand" />
      {error && <p className="text-small text-danger">{error}</p>}
      {!rows ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[820px] text-right text-small">
            <thead className="border-b border-line text-muted">
              <tr>{['الاسم', 'الهاتف', 'الإيميل', 'العنوان', 'تاريخ التسجيل', 'تاريخ الانتهاء', 'انحذف', 'السبب'].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.uid} className="border-b border-line last:border-0">
                  <td className="px-3 py-2">{r.name || '—'}</td>
                  <td className="px-3 py-2" dir="ltr">{r.phone || '—'}</td>
                  <td className="px-3 py-2" dir="ltr">{r.email || '—'}</td>
                  <td className="px-3 py-2">{r.address || '—'}</td>
                  <td className="px-3 py-2">{day(r.createdAt)}</td>
                  <td className="px-3 py-2">{day(r.endsAt)}</td>
                  <td className="px-3 py-2">{day(r.deletedAt)} · {r.by}</td>
                  <td className="px-3 py-2">{r.reason}</td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={8} className="px-3 py-8 text-center text-muted">لا أحد.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
