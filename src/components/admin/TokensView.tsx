// «الاستهلاك والأسعار» in the admin site: what Wee AI cost this month (every Gemini call is logged
// by the server), the heaviest users, and the price per million tokens the cost is worked out from.
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminError, TokensOverview, adminSetPrices, adminTokensOverview } from '../../services/adminApi';

const num = (n: number) => Math.round(n).toLocaleString('ar-SY');
const usd = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 })}`;
const inputCls = 'rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';

export const TokensView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<TokensOverview | null>(null);
  const [error, setError] = useState('');
  const [prices, setPrices] = useState({ in: '', out: '' });
  const [saved, setSaved] = useState('');

  const load = useCallback(async (m: string) => {
    setError('');
    try {
      const r = await adminTokensOverview(m);
      setData(r);
      setPrices({ in: String(r.prices.in), out: String(r.prices.out) });
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل الاستهلاك.');
    }
  }, [onSessionEnd]);

  useEffect(() => { load(month); }, [month, load]);

  const savePrices = async () => {
    setSaved('');
    try {
      await adminSetPrices({ in: Number(prices.in), out: Number(prices.out) });
      setSaved('حُفظت الأسعار. تُطبَّق على الاستدعاءات القادمة فقط.');
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setSaved('الأسعار غير صالحة (رقم بين 0 و1000).');
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-title font-semibold">الاستهلاك والأسعار</h1>
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className={inputCls} />
      </div>
      {error && <p className="text-small text-danger">{error}</p>}
      {!data ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[['التكلفة', usd(data.totals.costUsd)], ['التوكنز', num(data.totals.tokens)], ['الاستدعاءات', num(data.totals.calls)], ['الفاشلة', num(data.totals.failed)]].map(([label, value]) => (
              <div key={label} className="rounded-card border border-line bg-surface p-3">
                <div className="text-small text-muted">{label}</div>
                <div className="text-title font-semibold tabular-nums" dir="ltr">{value}</div>
              </div>
            ))}
          </div>
          {data.truncated && <p className="text-small text-warn">الشهر فيه استدعاءات أكثر من الحد المعروض، فالأرقام جزئية.</p>}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-card border border-line bg-surface p-3">
              <h2 className="mb-2 font-medium">حسب النوع</h2>
              {data.kinds.length ? (
                <table className="w-full text-right text-small">
                  <thead className="text-muted"><tr>{['النوع', 'الاستدعاءات', 'التوكنز', 'التكلفة'].map((h) => <th key={h} className="py-1 font-medium">{h}</th>)}</tr></thead>
                  <tbody>{data.kinds.map((k) => <tr key={k.name} className="border-t border-line"><td className="py-1.5">{k.name}</td><td>{num(k.calls)}</td><td>{num(k.tokens)}</td><td dir="ltr" className="text-right">{usd(k.costUsd)}</td></tr>)}</tbody>
                </table>
              ) : <p className="text-small text-faint">لا استدعاءات في هذا الشهر.</p>}
            </div>

            <div className="rounded-card border border-line bg-surface p-3">
              <h2 className="mb-2 font-medium">الأعلى استهلاكاً</h2>
              {data.top.length ? (
                <table className="w-full text-right text-small">
                  <thead className="text-muted"><tr>{['المشترك', 'الاستدعاءات', 'التوكنز', 'التكلفة'].map((h) => <th key={h} className="py-1 font-medium">{h}</th>)}</tr></thead>
                  <tbody>{data.top.map((u) => <tr key={u.uid} className="border-t border-line"><td className="max-w-[160px] truncate py-1.5">{u.name}</td><td>{num(u.calls)}</td><td>{num(u.tokens)}</td><td dir="ltr" className="text-right">{usd(u.costUsd)}</td></tr>)}</tbody>
                </table>
              ) : <p className="text-small text-faint">لا استدعاءات في هذا الشهر.</p>}
            </div>
          </div>

          <div className="rounded-card border border-line bg-surface p-3">
            <h2 className="mb-1 font-medium">تكاليف تقديرية</h2>
            <p className="text-small text-muted">فواتير أُرسلت بالإيميل هذا الشهر: <b className="text-ink">{num(data.emails)}</b> (تقدير: خدمة الإيميل لا تعطي رقماً دقيقاً). تكلفة Firestore لا تُقاس من هنا، شوفها في لوحة Firebase.</p>
          </div>

          <div className="rounded-card border border-line bg-surface p-3">
            <h2 className="mb-1 font-medium">أسعار Gemini (دولار لكل مليون توكن)</h2>
            <p className="mb-2 text-small text-muted">التكلفة تُحسب من هذه الأرقام وقت كل استدعاء. غيّرها إذا تغيّر النموذج أو سعره.</p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-small text-muted">دخل<input type="number" min={0} step="0.01" value={prices.in} onChange={(e) => setPrices({ ...prices, in: e.target.value })} className={`${inputCls} mt-1 block w-28`} /></label>
              <label className="text-small text-muted">خرج<input type="number" min={0} step="0.01" value={prices.out} onChange={(e) => setPrices({ ...prices, out: e.target.value })} className={`${inputCls} mt-1 block w-28`} /></label>
              <button onClick={savePrices} className="rounded-ctl bg-brand px-3 py-2 text-small text-white hover:bg-brand-hover">حفظ</button>
            </div>
            {saved && <p className="mt-2 text-small text-muted">{saved}</p>}
          </div>
        </>
      )}
    </section>
  );
};
