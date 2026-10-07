// تقارير الكاشير: the reports the main cashier saves when it closes a session, added up over a period:
// the money by method, the dishes sold by count and each worker's sales, tips and handovers. The
// reports are kept for two years (the cashier deletes older ones by itself).
import React, { useMemo, useState } from 'react';
import { REPORT_KEEP_DAYS, sumReports } from '../cashDay';
import { useClosedCashDays } from '../staffCloud';
import { Card, EmptyState, formatMoney } from '../../shop/adminUi';
import { CashReportView } from '../pos/CashReportView';
import { CloudNotice, RestaurantTabProps } from './shared';

type Period = 'today' | 'week' | 'month' | 'all';
const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: 'today', label: 'اليوم', days: 0 },
  { id: 'week', label: 'آخر 7 أيام', days: 6 },
  { id: 'month', label: 'آخر 30 يومًا', days: 29 },
  { id: 'all', label: 'كل ما هو محفوظ', days: REPORT_KEEP_DAYS },
];

export const SalesReportsTab: React.FC<RestaurantTabProps> = ({ data, ownerUid }) => {
  const [period, setPeriod] = useState<Period>('week');
  const [openId, setOpenId] = useState('');
  const since = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (PERIODS.find((p) => p.id === period)?.days || 0));
    return d.toISOString();
  }, [period]);
  const days = useClosedCashDays(ownerUid, since);
  const money = (n: number) => formatMoney(n, data.settings.currency);
  const sorted = [...days.items].sort((a, b) => b.closedAt.localeCompare(a.closedAt));
  const sum = useMemo(() => sumReports(days.items), [days.items]);
  const when = (iso: string) => new Date(iso).toLocaleString('ar-SY-u-nu-latn', { dateStyle: 'short', timeStyle: 'short' });
  const maxQty = Math.max(1, ...sum.dishes.map((d) => d.qty));

  return (
    <div className="space-y-4">
      <CloudNotice error={days.error} />
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={`h-9 px-3 rounded-xl text-xs font-black cursor-pointer ${period === p.id ? 'bg-[#1d1d1f] text-white' : 'bg-neutral-100 text-neutral-600'}`}>{p.label}</button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <EmptyState text="لا توجد جلسات كاشير مغلقة في هذه الفترة. يُحفظ تقرير كل جلسة عندما يضغط الكاشير الرئيسي «إنهاء جلسة الكاشير» من قائمة ☰." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-[#1d1d1f] text-white"><div className="text-[10px] font-bold text-white/60">المبيعات</div><div className="text-sm font-black mt-0.5">{money(sum.sales)}</div></div>
            <div className="p-3 rounded-2xl bg-[#F4FCF5] text-[#2B8A3E]"><div className="text-[10px] font-bold">البخشيش</div><div className="text-sm font-black mt-0.5">{money(sum.tips)}</div></div>
            <div className="p-3 rounded-2xl bg-neutral-100"><div className="text-[10px] font-bold text-neutral-500">فواتير</div><div className="text-sm font-black mt-0.5">{sum.bills}</div></div>
            <div className="p-3 rounded-2xl bg-neutral-100"><div className="text-[10px] font-bold text-neutral-500">جلسات</div><div className="text-sm font-black mt-0.5">{sorted.length}</div></div>
          </div>

          <Card title="الأطباق المباعة بالعدد">
            <div className="space-y-1.5">
              {sum.dishes.map((d) => (
                <div key={d.name} className="space-y-0.5">
                  <div className="flex justify-between text-sm font-bold"><span>{d.name}</span><span className="font-black">× {d.qty} · {money(d.amount)}</span></div>
                  <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden"><div className="h-full bg-[#E8590C] rounded-full" style={{ width: `${(d.qty / maxQty) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="العمال">
            <div className="space-y-1.5">
              {sum.workers.map((w) => (
                <div key={w.workerId} className="p-3 rounded-xl bg-neutral-50 text-sm space-y-0.5">
                  <div className="flex justify-between font-black"><span>{w.name}</span><span>{money(w.collected)}</span></div>
                  <div className="text-[11px] font-bold text-neutral-500">نقدي {money(w.cash)} · بخشيش {money(w.tips)} · فواتير {w.bills} · سلّم للكاشير {money(w.handedCash)}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="جلسات الكاشير">
            <div className="space-y-2">
              {sorted.map((d) => (
                <div key={d.id} className="rounded-2xl border border-neutral-200">
                  <button type="button" onClick={() => setOpenId(openId === d.id ? '' : d.id)} className="w-full p-3 flex items-center gap-2 text-right cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black">{when(d.openedAt)} ← {when(d.closedAt)}</div>
                      <div className="text-[11px] font-bold text-neutral-500">أغلقها {d.closedBy} · الدرج: واجب {money(d.expectedDrawer)}، موجود {money(d.counted)}</div>
                    </div>
                    <span className="text-sm font-black">{money(d.report?.sales || 0)}</span>
                  </button>
                  {openId === d.id && d.report && <div className="p-3 pt-0"><CashReportView report={d.report} money={money} /></div>}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
