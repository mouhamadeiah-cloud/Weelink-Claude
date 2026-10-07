// The report of a main cashier session: what was taken (by method), the dishes sold by count and each
// worker's money. Shown when the session is closed or looked at, and in the accounting.
import React from 'react';
import type { CashReport } from '../cashDay';

type Money = (n: number) => string;

export const CashReportView: React.FC<{ report: CashReport; money: Money }> = ({ report: r, money }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="p-3 rounded-2xl bg-[#1d1d1f] text-white"><div className="text-[10px] font-bold text-white/60">المبيعات المحصّلة</div><div className="text-sm font-black mt-0.5">{money(r.sales)}</div></div>
      <div className="p-3 rounded-2xl bg-[#F4FCF5] text-[#2B8A3E]"><div className="text-[10px] font-bold">البخشيش</div><div className="text-sm font-black mt-0.5">{money(r.tips)}</div></div>
      <div className="p-3 rounded-2xl bg-neutral-100"><div className="text-[10px] font-bold text-neutral-500">فواتير مغلقة</div><div className="text-sm font-black mt-0.5">{r.bills}</div></div>
    </div>

    {r.methods.length > 0 && (
      <section className="space-y-1">
        <div className="text-xs font-black text-neutral-500">حسب طريقة الدفع</div>
        {r.methods.map((m) => <div key={m.method} className="flex justify-between p-2.5 rounded-xl bg-neutral-50 text-sm font-black"><span>{m.method}</span><span>{money(m.amount)}</span></div>)}
      </section>
    )}

    <section className="space-y-1">
      <div className="text-xs font-black text-neutral-500">الأطباق المباعة ({r.dishes.reduce((n, d) => n + d.qty, 0)})</div>
      {r.dishes.length === 0 && <div className="text-xs font-bold text-neutral-400">لا توجد مبيعات مغلقة.</div>}
      {r.dishes.map((d) => <div key={d.name} className="flex justify-between gap-2 p-2.5 rounded-xl bg-neutral-50 text-sm font-bold"><span className="truncate">{d.name}</span><span className="font-black whitespace-nowrap">× {d.qty} · {money(d.amount)}</span></div>)}
    </section>

    <section className="space-y-1">
      <div className="text-xs font-black text-neutral-500">العمال</div>
      {r.workers.length === 0 && <div className="text-xs font-bold text-neutral-400">لا توجد حركة.</div>}
      {r.workers.map((w) => (
        <div key={w.workerId} className="p-2.5 rounded-xl bg-neutral-50 text-sm space-y-0.5">
          <div className="flex justify-between font-black"><span>{w.name}</span><span>{money(w.collected)}</span></div>
          <div className="text-[11px] font-bold text-neutral-500">
            نقدي {money(w.cash)} · بخشيش {money(w.tips)} · فواتير {w.bills}
            {w.handover === 'confirmed' ? ` · سلّم ${money(w.handedCash)}` : w.handover === 'skipped' ? ' · أغلق بدون تسليم' : ''}
          </div>
        </div>
      ))}
    </section>
  </div>
);
