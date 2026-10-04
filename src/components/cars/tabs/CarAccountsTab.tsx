// الحسابات: the showroom's cash box and bank (balances per currency, a journal of every amount in or
// out, hand entries and transfers between the two), and the profit of every sold car. Car entries
// come from the cars themselves (purchase, expenses, sale and payments). Both views print as an A4
// report or save as PDF.
import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Plus, Printer, FileDown, Trash2 } from 'lucide-react';
import { CarTransaction, MANUAL_IN_CATEGORIES, MANUAL_OUT_CATEGORIES, MONEY_ACCOUNTS, MoneyAccount, CAR_CURRENCIES } from '../carTypes';
import { carSubtitle, carTitle } from '../carModel';
import {
  accountLabel, addManualTx, balancesOf, canRemoveTx, carCost, carProfit, expectedProfit, removeTx, saleRemaining, todayKey, TX_SOURCE_LABELS,
} from '../carMoney';
import { Card, Field, inputClass, inputFitClass, EmptyState, PrimaryButton, formatDate } from '../../shop/adminUi';
import { printReport } from '../../shop/tabs/accountsReport';
import type { LedgerRow } from '../../shop/tabs/AccountsTab';
import { CarTabProps } from './CarEditor';
import { Segmented, money } from './moneyUi';

type Range = 'today' | '30d' | 'month' | 'year' | 'all' | 'custom';
const RANGES: { id: Range; label: string }[] = [
  { id: 'today', label: 'اليوم' },
  { id: '30d', label: '30 يومًا' },
  { id: 'month', label: 'هذا الشهر' },
  { id: 'year', label: 'هذه السنة' },
  { id: 'all', label: 'الكل' },
  { id: 'custom', label: 'من تاريخ إلى تاريخ' },
];

type Kind = CarTransaction['kind'];
const KINDS: { id: Kind; label: string }[] = [
  { id: 'in', label: 'داخل' },
  { id: 'out', label: 'خارج' },
  { id: 'transfer', label: 'تحويل' },
];

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Car entries already name what they are in their description; hand entries show their category.
const txText = (t: CarTransaction) => (t.source === 'manual' ? [t.category, t.description].filter(Boolean).join(': ') : t.description);
const dateText = (d: string) => (d ? formatDate(`${d}T12:00:00`) : '');

const Stat: React.FC<{ label: string; value: string; color?: string; sub?: string }> = ({ label, value, color, sub }) => (
  <div className="flex-1 min-w-[120px] bg-white border border-neutral-200 rounded-2xl p-3">
    <div className="text-[10px] font-bold text-neutral-400 truncate">{label}</div>
    <div className="text-base font-black truncate" style={{ color }}>{value}</div>
    {sub && <div className="text-[10px] text-neutral-400 font-bold truncate">{sub}</div>}
  </div>
);

export const CarAccountsTab: React.FC<CarTabProps> = ({ data, update }) => {
  const [section, setSection] = useState<'money' | 'profit'>('money');
  const [range, setRange] = useState<Range>('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [accountFilter, setAccountFilter] = useState<MoneyAccount | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<Kind | 'all'>('all');
  const [entry, setEntry] = useState({ kind: 'in' as Kind, account: 'cash' as MoneyAccount, amount: '', category: MANUAL_IN_CATEGORIES[0], description: '', date: todayKey() });
  const [entryCurrency, setEntryCurrency] = useState(data.settings.currency);
  const [entryError, setEntryError] = useState('');

  // Every currency in use, the default first.
  const currencies = useMemo(() => {
    const set = new Set<string>([data.settings.currency]);
    data.transactions.forEach((t) => set.add(t.currency));
    data.cars.forEach((c) => set.add(c.currency));
    return [...set];
  }, [data.transactions, data.cars, data.settings.currency]);
  const [currency, setCurrency] = useState(data.settings.currency);
  const m = (n: number) => money(n, currency);

  const [start, end] = useMemo(() => {
    const now = new Date();
    const today = dayKey(now);
    switch (range) {
      case 'today': return [today, today];
      case '30d': return [dayKey(new Date(now.getTime() - 29 * 86400000)), today];
      case 'month': return [dayKey(new Date(now.getFullYear(), now.getMonth(), 1)), today];
      case 'year': return [`${now.getFullYear()}-01-01`, today];
      case 'custom': return [from || '0000-01-01', to || today];
      default: return ['0000-01-01', '9999-12-31'];
    }
  }, [range, from, to]);
  const inRange = (d: string) => d >= start && d <= end;
  const periodLabel = range === 'all' ? 'كل الفترات' : `${RANGES.find((r) => r.id === range)!.label} (${start.startsWith('0000') ? 'البداية' : start} — ${end})`;

  // ---- cash and bank ----
  const balances = balancesOf(data.transactions);
  const cashBal = balances.cash[currency] || 0;
  const bankBal = balances.bank[currency] || 0;

  const txs = data.transactions
    .filter((t) => t.currency === currency && inRange(t.date))
    .filter((t) => accountFilter === 'all' || t.account === accountFilter || t.toAccount === accountFilter)
    .filter((t) => kindFilter === 'all' || t.kind === kindFilter)
    .sort((a, b) => (b.date === a.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
  // Inflow and outflow of the period (transfers move money between the two accounts, so they only
  // count when one account is shown).
  const flow = (t: CarTransaction) => {
    if (t.kind === 'in') return t.amount;
    if (t.kind === 'out') return -t.amount;
    if (accountFilter === 'all') return 0;
    return t.toAccount === accountFilter ? t.amount : -t.amount;
  };
  const inflow = txs.reduce((s, t) => s + Math.max(0, flow(t)), 0);
  const outflow = txs.reduce((s, t) => s + Math.max(0, -flow(t)), 0);

  const setKind = (kind: Kind) =>
    setEntry({ ...entry, kind, category: kind === 'in' ? MANUAL_IN_CATEGORIES[0] : kind === 'out' ? MANUAL_OUT_CATEGORIES[0] : 'تحويل' });

  const addEntry = () => {
    const amount = parseFloat(entry.amount.replace(/,/g, ''));
    if (!(amount > 0)) return setEntryError('اكتب مبلغًا أكبر من صفر.');
    if (!entry.date) return setEntryError('اختر التاريخ.');
    setEntryError('');
    const toAccount: MoneyAccount = entry.account === 'cash' ? 'bank' : 'cash';
    update((d) => addManualTx(d, {
      date: entry.date,
      kind: entry.kind,
      account: entry.account,
      ...(entry.kind === 'transfer' ? { toAccount } : {}),
      amount,
      currency: entryCurrency,
      category: entry.kind === 'transfer' ? 'تحويل' : entry.category,
      description: entry.description.trim() || (entry.kind === 'transfer' ? `من ${accountLabel(entry.account)} إلى ${accountLabel(toAccount)}` : ''),
    }));
    setEntry({ ...entry, amount: '', description: '' });
  };

  // ---- profit per car ----
  const soldCars = data.cars
    .filter((c) => c.sale && c.currency === currency && inRange(c.sale.date))
    .sort((a, b) => b.sale!.date.localeCompare(a.sale!.date));
  const totals = soldCars.reduce(
    (t, c) => ({ sales: t.sales + c.sale!.price, cost: t.cost + carCost(c), profit: t.profit + carProfit(c), owed: t.owed + saleRemaining(c) }),
    { sales: 0, cost: 0, profit: 0, owed: 0 }
  );
  const stock = data.cars.filter((c) => !c.sale && c.currency === currency);
  const stockCost = stock.reduce((s, c) => s + carCost(c), 0);
  const stockExpected = stock.reduce((s, c) => s + expectedProfit(c), 0);
  const allOwed = data.cars.filter((c) => c.sale && c.currency === currency).reduce((s, c) => s + saleRemaining(c), 0);

  const print = (pdf: boolean) => {
    const name = data.settings.showroomName || 'المعرض';
    if (section === 'money') {
      const ledger: LedgerRow[] = txs.map((t) => ({
        id: t.id,
        kind: t.kind === 'in' ? 'income' : 'expense',
        kindLabel: t.kind === 'transfer' ? 'تحويل' : `${t.kind === 'in' ? 'داخل' : 'خارج'} · ${accountLabel(t.account)}`,
        label: txText(t),
        date: t.date,
        amount: t.kind === 'out' ? -t.amount : t.amount,
      }));
      printReport({
        storeName: name,
        viewLabel: `الصندوق والبنك · ${currency}${accountFilter !== 'all' ? ` · ${accountLabel(accountFilter)}` : ''}`,
        periodLabel,
        stats: [
          { label: 'رصيد الصندوق', value: m(cashBal) },
          { label: 'رصيد البنك', value: m(bankBal) },
          { label: 'المجموع', value: m(cashBal + bankBal) },
          { label: 'الداخل في الفترة', value: m(inflow) },
          { label: 'الخارج في الفترة', value: m(outflow) },
          { label: 'الصافي', value: m(inflow - outflow) },
        ],
        dashboard: null,
        ledger,
        money: m,
        pdf,
      });
    } else {
      printReport({
        storeName: name,
        viewLabel: `ربح السيارات · ${currency}`,
        periodLabel,
        stats: [
          { label: 'سيارات مباعة', value: String(soldCars.length) },
          { label: 'المبيعات', value: m(totals.sales) },
          { label: 'الكلفة', value: m(totals.cost) },
          { label: 'الربح', value: m(totals.profit) },
          { label: 'المتبقي على المشترين', value: m(totals.owed) },
          { label: 'كلفة المخزون الحالي', value: m(stockCost) },
        ],
        dashboard: null,
        ledger: soldCars.map((c) => ({
          id: c.id,
          kind: 'sale',
          kindLabel: carProfit(c) >= 0 ? 'ربح' : 'خسارة',
          label: `${carTitle(c)} ${carSubtitle(c)} (${c.stockNumber}) · الكلفة ${m(carCost(c))} · البيع ${m(c.sale!.price)}`,
          date: c.sale!.date,
          amount: carProfit(c),
        })),
        money: m,
        pdf,
      });
    }
  };

  const txIcon = (t: CarTransaction) =>
    t.kind === 'transfer' ? <ArrowLeftRight size={14} /> : t.kind === 'in' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />;
  const txColor = (t: CarTransaction) => (t.kind === 'transfer' ? 'bg-blue-50 text-[#0071e3]' : t.kind === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600');

  return (
    <div className="space-y-4">
      <div className="flex border-b border-neutral-200" role="tablist" aria-label="أقسام الحسابات">
        {([['money', 'الصندوق والبنك'], ['profit', 'ربح السيارات']] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={section === id} onClick={() => setSection(id)}
            className={`h-10 px-4 -mb-px border-b-2 text-xs font-black transition cursor-pointer ${section === id ? 'border-[#0071e3] text-[#0071e3]' : 'border-transparent text-neutral-500 hover:text-[#1d1d1f]'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {currencies.length > 1 && <Segmented label="العملة" options={currencies.map((c) => ({ id: c, label: c }))} value={currency} onChange={setCurrency} />}
        <div className="flex items-center gap-1.5 mr-auto">
          <button type="button" onClick={() => print(false)} className="h-8 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"><Printer size={13} /> طباعة A4</button>
          <button type="button" onClick={() => print(true)} className="h-8 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"><FileDown size={13} /> تصدير PDF</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button key={r.id} type="button" onClick={() => setRange(r.id)}
            className={`h-8 px-3 rounded-full text-[11px] font-bold border transition cursor-pointer ${range === r.id ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white' : 'bg-white border-neutral-200 text-neutral-600'}`}>
            {r.label}
          </button>
        ))}
        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" aria-label="من تاريخ" className={`${inputClass} h-8 w-36 text-xs`} value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-xs text-neutral-400">إلى</span>
            <input type="date" aria-label="إلى تاريخ" className={`${inputClass} h-8 w-36 text-xs`} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
      </div>

      {section === 'money' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Stat label="رصيد الصندوق" value={m(cashBal)} color={cashBal < 0 ? '#ff3b30' : '#1d1d1f'} />
            <Stat label="رصيد البنك" value={m(bankBal)} color={bankBal < 0 ? '#ff3b30' : '#1d1d1f'} />
            <Stat label="المجموع" value={m(cashBal + bankBal)} color="#0071e3" />
            <Stat label="الداخل في الفترة" value={m(inflow)} color="#34a853" />
            <Stat label="الخارج في الفترة" value={m(outflow)} color="#f29900" />
          </div>

          <Card title="قيد يدوي">
            <div className="flex flex-wrap items-center gap-2">
              <Segmented label="نوع القيد" options={KINDS} value={entry.kind} onChange={setKind} />
              <Segmented label={entry.kind === 'transfer' ? 'من' : 'الحساب'} options={MONEY_ACCOUNTS.map((a) => ({ id: a.id, label: entry.kind === 'transfer' ? `من ${a.label}` : a.label }))} value={entry.account} onChange={(account) => setEntry({ ...entry, account })} />
            </div>
            {entry.kind !== 'transfer' && (
              <div className="flex flex-wrap gap-1.5">
                {(entry.kind === 'in' ? MANUAL_IN_CATEGORIES : MANUAL_OUT_CATEGORIES).map((c) => (
                  <button key={c} type="button" aria-pressed={entry.category === c} onClick={() => setEntry({ ...entry, category: c })}
                    className={`h-8 px-3 rounded-full border text-[11px] font-bold cursor-pointer ${entry.category === c ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-neutral-200 bg-white text-neutral-600'}`}>{c}</button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <Field label="المبلغ"><input className={`${inputFitClass} w-28`} dir="ltr" inputMode="decimal" value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addEntry()} /></Field>
              <Field label="العملة">
                <select className={`${inputFitClass} w-20`} value={entryCurrency} onChange={(e) => setEntryCurrency(e.target.value)}>
                  {[...new Set([...CAR_CURRENCIES, ...currencies])].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <div className="flex-1 min-w-[160px]"><Field label="البيان"><input className={inputClass} value={entry.description} placeholder={entry.kind === 'transfer' ? 'مثال: إيداع غلّة الأسبوع' : 'مثال: إيجار شهر أيار'} onChange={(e) => setEntry({ ...entry, description: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addEntry()} /></Field></div>
              <Field label="التاريخ"><input type="date" className={`${inputFitClass} w-40`} value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} /></Field>
              <PrimaryButton onClick={addEntry} className="flex items-center gap-1"><Plus size={14} /> إضافة</PrimaryButton>
            </div>
            {entryError && <div className="text-[11px] text-red-600 font-bold">{entryError}</div>}
          </Card>

          <Card
            title={`السجل (${txs.length})`}
            actions={
              <div className="flex flex-wrap gap-1.5">
                <Segmented label="الحساب" options={[{ id: 'all' as const, label: 'الكل' }, ...MONEY_ACCOUNTS]} value={accountFilter} onChange={setAccountFilter} />
                <Segmented label="النوع" options={[{ id: 'all' as const, label: 'الكل' }, ...KINDS]} value={kindFilter} onChange={setKindFilter} />
              </div>
            }
          >
            {txs.length === 0 ? (
              <EmptyState text="لا توجد حركة في هذه الفترة." />
            ) : (
              <div className="space-y-1.5">
                {txs.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg border border-neutral-100 bg-[#fbfbfd] text-xs">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${txColor(t)}`}>{txIcon(t)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-bold">{txText(t)}</div>
                      <div className="text-[10px] text-neutral-400 font-bold">
                        {t.kind === 'transfer' ? `من ${accountLabel(t.account)} إلى ${accountLabel(t.toAccount || 'bank')}` : accountLabel(t.account)} · {TX_SOURCE_LABELS[t.source]}
                      </div>
                    </div>
                    <span className="text-neutral-400 shrink-0">{dateText(t.date)}</span>
                    <span className={`font-black shrink-0 ${t.kind === 'in' ? 'text-emerald-600' : t.kind === 'out' ? 'text-amber-600' : 'text-[#0071e3]'}`}>{m(t.kind === 'out' ? -t.amount : t.amount)}</span>
                    {canRemoveTx(data, t) ? (
                      <button type="button" onClick={() => window.confirm('حذف هذا القيد؟') && update((d) => removeTx(d, t.id))} aria-label="حذف القيد" className="text-neutral-300 hover:text-red-500 cursor-pointer"><Trash2 size={13} /></button>
                    ) : (
                      <span className="w-[13px]" title="يتعدل من الملف المالي للسيارة في «المخزون»" />
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-neutral-400 leading-relaxed">قيود السيارات (الشراء والمصاريف والبيع والدفعات) تتعدل أو تُحذف من الملف المالي للسيارة في «المخزون».</p>
          </Card>
        </>
      )}

      {section === 'profit' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Stat label="سيارات مباعة" value={String(soldCars.length)} />
            <Stat label="المبيعات" value={m(totals.sales)} />
            <Stat label="الكلفة" value={m(totals.cost)} sub="شراء ومصاريف" />
            <Stat label="الربح" value={m(totals.profit)} color={totals.profit >= 0 ? '#34a853' : '#ff3b30'} />
            <Stat label="متبقٍ على المشترين" value={m(allOwed)} color="#f29900" sub="كل الفترات" />
          </div>

          <Card title="السيارات المباعة">
            {soldCars.length === 0 ? (
              <EmptyState text="لا توجد سيارات مباعة في هذه الفترة. اضغط «تم البيع» على سيارة في «المخزون»." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] text-neutral-400 font-bold">
                      <th className="text-right py-2 px-2">السيارة</th>
                      <th className="text-right py-2 px-2">تاريخ البيع</th>
                      <th className="text-left py-2 px-2">الكلفة</th>
                      <th className="text-left py-2 px-2">سعر البيع</th>
                      <th className="text-left py-2 px-2">الربح</th>
                      <th className="text-left py-2 px-2">المتبقي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldCars.map((c) => (
                      <tr key={c.id} className="border-t border-neutral-100">
                        <td className="py-2 px-2 font-bold">{carTitle(c)} <span className="text-neutral-400 font-normal">{carSubtitle(c)} · {c.stockNumber}</span></td>
                        <td className="py-2 px-2 text-neutral-500 whitespace-nowrap">{dateText(c.sale!.date)}</td>
                        <td className="py-2 px-2 text-left whitespace-nowrap">{m(carCost(c))}</td>
                        <td className="py-2 px-2 text-left whitespace-nowrap">{m(c.sale!.price)}</td>
                        <td className={`py-2 px-2 text-left font-black whitespace-nowrap ${carProfit(c) >= 0 ? 'text-[#34a853]' : 'text-[#ff3b30]'}`}>{m(carProfit(c))}</td>
                        <td className={`py-2 px-2 text-left whitespace-nowrap ${saleRemaining(c) > 0 ? 'text-[#f29900] font-bold' : 'text-neutral-300'}`}>{m(saleRemaining(c))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title={`المخزون الحالي (${stock.length})`}>
            <div className="flex flex-wrap gap-2">
              <Stat label="كلفة المخزون" value={m(stockCost)} sub="شراء ومصاريف" />
              <Stat label="الربح المتوقع بالأسعار المعروضة" value={m(stockExpected)} color="#34a853" />
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
