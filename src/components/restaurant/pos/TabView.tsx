// One table's bill on the cashier or a waiter's tablet: the dishes (new ones not yet sent, the ones in
// the kitchen with their state, the paid and the cancelled ones), the totals, and the menu to add
// from. From here the bill goes to the kitchen, gets paid (all or part), moves to another table or
// merges with it, passes to another worker, gets a discount or a note, and prints.
import React, { useMemo, useState } from 'react';
import { ArrowRight, Send, Wallet, MoveRight, UserRound, Percent, Printer, Minus, Plus, Trash2, Ban, Search, Users, QrCode, StickyNote, X, HandCoins } from 'lucide-react';
import { Dish, MenuOrder, OrderLine, RestaurantAdminData, allTables, dishSubCatalogs } from '../restaurantTypes';
import { Actor, ScreenDraft, ScreenPaid, Tab, Worker, itemTotal, openTabId, tabTitle, tabTotals, unsentItems } from '../staffTypes';
import { addLog, attachOrder, changeTab, closeEmptyTab, moveTab, newItem, payTab, sendToKitchen, TabPlace } from '../staffCloud';
import { formatMoney } from '../../shop/adminUi';
import { DishOptions, lineOfDish } from './DishOptions';
import { PayDialog, PayRequest } from './PayDialog';
import { printReceipt } from './receipt';
import { BigButton, Modal, failText } from './posUi';

export type PosMenu = Pick<RestaurantAdminData, 'dishes' | 'categories' | 'subCatalogs' | 'halls' | 'settings'>;

export interface PaidInfo {
  total: number;
  paid: number;
  change: number;
}

interface TabViewProps {
  uid: string;
  tab: Tab;
  menu: PosMenu;
  worker: Worker;
  workers: Worker[];
  actor: Actor;
  shiftId: string;
  orders: MenuOrder[];
  openTabs: Tab[];
  askManager: (reason: string) => Promise<string | null>;
  toast: (text: string, bad?: boolean) => void;
  onBack: () => void;
  onMoved: (tabId: string) => void;
  onClosed: (info: PaidInfo | null) => void;
  onDraft?: (d: ScreenDraft | null) => void;
  onPartPaid?: (p: ScreenPaid) => void;
}

// How a sent dish stands in the kitchen, as the waiter needs to know it.
const KITCHEN_STATE: Record<string, [string, string]> = {
  new: ['وصل المطبخ', '#868E96'],
  preparing: ['قيد التحضير', '#E8590C'],
  ready: ['جاهز للتقديم', '#2F9E44'],
  done: ['قُدّم', '#1971C2'],
  cancelled: ['ألغاه المطبخ', '#E03131'],
};

const minutesSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));

export const TabView: React.FC<TabViewProps> = ({ uid, tab, menu, worker, workers, actor, shiftId, orders, openTabs, askManager, toast, onBack, onMoved, onClosed, onDraft, onPartPaid }) => {
  const [cat, setCat] = useState('');
  const [search, setSearch] = useState('');
  const [optionsFor, setOptionsFor] = useState<Dish | null>(null);
  const [dialog, setDialog] = useState<'' | 'pay' | 'move' | 'transfer' | 'discount' | 'note' | 'tip'>('');
  const [busy, setBusy] = useState(false);
  const [side, setSide] = useState<'bill' | 'menu'>('bill');
  const [discountText, setDiscountText] = useState('');
  const [discountNote, setDiscountNote] = useState('');
  const [tipText, setTipText] = useState('');
  const currency = menu.settings.currency;
  const money = (n: number) => formatMoney(n, currency);
  const totals = tabTotals(tab);
  const unsent = unsentItems(tab);
  const mine = tab.ownerId === worker.id;
  const canPay = menu.settings.payAnyWorker || mine || worker.role === 'manager';

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try {
      await fn();
      if (ok) toast(ok);
    } catch (e) {
      console.warn(e);
      toast(failText(e), true);
    }
    setBusy(false);
  };

  // ---------- Dishes ----------

  const dishes = useMemo(() => {
    const q = search.trim();
    return menu.dishes.filter((d) => (q ? d.name.includes(q) : !cat || d.categoryId === cat));
  }, [menu.dishes, cat, search]);

  const addLine = (line: OrderLine) =>
    run(() =>
      changeTab(uid, tab.id, (t) => {
        const plain = !line.removed.length && !line.extras.length && !line.notes;
        const same = plain && t.items.find((i) => !i.sentAt && !i.voided && i.dishId === line.dishId && !i.removed.length && !i.extras.length && !i.notes);
        return { items: same ? t.items.map((i) => (i === same ? { ...i, qty: i.qty + line.qty } : i)) : [...t.items, newItem(line, actor)] };
      })
    );

  const pickDish = (d: Dish) => {
    if (!d.available) return;
    if (dishSubCatalogs(d, menu.subCatalogs).length) setOptionsFor(d);
    else addLine(lineOfDish(d));
  };

  const setQty = (itemId: string, qty: number) =>
    run(() => changeTab(uid, tab.id, (t) => ({ items: qty <= 0 ? t.items.filter((i) => i.id !== itemId) : t.items.map((i) => (i.id === itemId ? { ...i, qty } : i)) })));

  const voidItem = async (itemId: string, name: string) => {
    const by = await askManager(`إلغاء «${name}» بعد إرساله للمطبخ`);
    if (!by) return;
    await run(() => changeTab(uid, tab.id, (t) => ({ items: t.items.map((i) => (i.id === itemId ? { ...i, voided: true, voidNote: `ألغاه ${worker.name}، بموافقة ${by}` } : i)) })), 'أُلغي الصنف');
    addLog(uid, { action: 'إلغاء صنف', detail: `${name} · ${tabTitle(tab)}`, workerName: worker.name, approvedBy: by, deviceName: actor.deviceName });
  };

  // ---------- The bill ----------

  const pay = async (r: PayRequest) => {
    setBusy(true);
    try {
      const res = await payTab(uid, tab.id, { amount: r.amount, method: r.method, note: r.note, items: r.items, shiftId }, actor);
      setDialog('');
      const change = r.given > res.paid ? Math.round((r.given - res.paid) * 100) / 100 : 0;
      if (res.left <= 0) onClosed({ total: res.total, paid: res.paid, change });
      else {
        toast(`تم تحصيل ${money(res.paid)}${change ? ` · الباقي للزبون ${money(change)}` : ''}`);
        onPartPaid?.({ amount: res.paid, method: r.method, note: r.note, change, left: res.left, at: new Date().toISOString() });
      }
    } catch (e) {
      console.warn(e);
      toast(failText(e), true);
    }
    setBusy(false);
  };

  const move = async (to: TabPlace, occupied: boolean) => {
    if (occupied && !window.confirm(`الطاولة ${to.table} مشغولة. دمج الفاتورتين في فاتورة واحدة على الطاولة ${to.table}؟`)) return;
    setBusy(true);
    try {
      const id = await moveTab(uid, tab.id, to);
      setDialog('');
      toast(occupied ? `دُمجت مع الطاولة ${to.table}` : `نُقلت إلى الطاولة ${to.table}`);
      onMoved(id);
    } catch (e) {
      toast(failText(e), true);
    }
    setBusy(false);
  };

  const transfer = async (w: Worker) => {
    if (!mine && worker.role !== 'manager') {
      const by = await askManager(`تحويل ${tabTitle(tab)} من ${tab.ownerName} إلى ${w.name}`);
      if (!by) return;
    }
    await run(() => changeTab(uid, tab.id, () => ({ ownerId: w.id, ownerName: w.name })), `أصبحت الطاولة مسؤولية ${w.name}`);
    setDialog('');
  };

  const applyDiscount = async () => {
    const raw = parseFloat(discountText.replace(/[,\s%]/g, ''));
    const n = isFinite(raw) && raw > 0 ? raw : 0;
    const pct = discountText.trim().endsWith('%') ? Math.min(100, n) : 0;
    const label = pct ? `${pct}%` : money(n);
    const by = await askManager(`خصم ${label} على ${tabTitle(tab)}`);
    if (!by) return;
    await run(() => changeTab(uid, tab.id, () => ({ discount: pct ? 0 : n, discountPct: pct, discountNote: discountNote.trim() })), n ? 'طُبق الخصم' : 'أُزيل الخصم');
    addLog(uid, { action: n ? 'خصم' : 'إزالة خصم', detail: `${label} · ${tabTitle(tab)}${discountNote.trim() ? ` · ${discountNote.trim()}` : ''}`, workerName: worker.name, approvedBy: by, deviceName: actor.deviceName });
    setDialog('');
  };

  // A tip goes on the bill as its own line: it is already «sent» (never reaches the kitchen) and the
  // discount does not touch it.
  const addTip = async () => {
    const n = Math.round((parseFloat(tipText.replace(/[,\s]/g, '')) || 0) * 100) / 100;
    if (n <= 0) return;
    const line: OrderLine = { dishId: 'tip', name: 'بخشيش', unitPrice: n, qty: 1, removed: [], extras: [], notes: '' };
    await run(() => changeTab(uid, tab.id, (t) => ({ items: [...t.items, { ...newItem(line, actor), sentAt: new Date().toISOString(), tip: true }] })), 'أُضيف البخشيش إلى الفاتورة');
    setDialog('');
  };

  const qrOrders = tab.kind === 'table' ? orders.filter((o) => o.source === 'qr' && o.type === 'table' && o.table === tab.table && !o.tabId && o.status !== 'cancelled') : [];
  const place: TabPlace = { kind: tab.kind, tableId: tab.tableId, table: tab.table, hall: tab.hall };
  const orderOf = (id: string) => orders.find((o) => o.id === id);

  // ---------- Layout ----------

  const bill = (
    <div className="flex flex-col min-h-0 h-full bg-white">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {qrOrders.map((o) => (
          <div key={o.id} className="p-3 rounded-2xl bg-[#E7F5FF] border border-[#A5D8FF] space-y-2">
            <div className="flex items-center gap-2 text-sm font-black text-[#1864AB]"><QrCode size={16} /> طلب الزبون من QR #{o.number} · {money(o.total)}</div>
            <div className="text-xs font-bold text-[#1864AB]/80">{o.lines.map((l) => `${l.qty}× ${l.name}`).join('، ')}</div>
            <BigButton tone="dark" className="h-10 text-xs" disabled={busy} onClick={() => run(() => attachOrder(uid, o, place, actor), 'أُضيف الطلب إلى الفاتورة')}>أضفه إلى الفاتورة</BigButton>
          </div>
        ))}
        {tab.items.length === 0 && qrOrders.length === 0 && <div className="py-10 text-center text-sm font-bold text-neutral-400">اختر الأطباق من المنيو</div>}
        {tab.items.map((i) => {
          if (i.tip) {
            return (
              <div key={i.id} className={`p-2.5 rounded-2xl border flex items-center gap-2 ${i.voided ? 'border-neutral-100 bg-neutral-50 opacity-60' : 'border-[#8CE99A] bg-[#F4FCF5]'}`}>
                <HandCoins size={16} className="text-[#2F9E44]" />
                <div className="flex-1 text-sm font-black text-[#2B8A3E]">بخشيش{i.addedBy && i.addedBy !== worker.name ? <span className="text-[10px] font-bold text-neutral-400"> · {i.addedBy}</span> : null}</div>
                <div className="text-sm font-black">{money(itemTotal(i))}</div>
                {!i.voided && totals.paid === 0 && (
                  <button type="button" aria-label="حذف البخشيش" disabled={busy} onClick={() => setQty(i.id, 0)} className="w-9 h-9 rounded-xl text-[#E03131] hover:bg-red-50 flex items-center justify-center cursor-pointer"><Trash2 size={15} /></button>
                )}
              </div>
            );
          }
          const o = i.orderId ? orderOf(i.orderId) : undefined;
          const st = o ? KITCHEN_STATE[o.status] : undefined;
          const details = [...i.removed.map((r) => `بدون ${r}`), ...i.extras.map((e) => `+ ${e.name}`)].join('، ');
          return (
            <div key={i.id} className={`p-2.5 rounded-2xl border ${i.voided ? 'border-neutral-100 bg-neutral-50 opacity-60' : !i.sentAt ? 'border-[#FFC078] bg-[#FFF9F2]' : 'border-neutral-200'}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-black ${i.voided ? 'line-through' : ''}`}>{i.qty} × {i.name}</div>
                  {details && <div className="text-[11px] font-bold text-neutral-500">{details}</div>}
                  {i.notes && <div className="text-[11px] font-bold text-[#E8590C]">{i.notes}</div>}
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    {i.voided ? (
                      <span className="text-[10px] font-bold text-neutral-500">ملغى · {i.voidNote}</span>
                    ) : !i.sentAt ? (
                      <span className="h-5 px-2 rounded-full bg-[#FFE8CC] text-[#D9480F] text-[10px] font-black inline-flex items-center">لم يُرسل</span>
                    ) : (
                      <span className="h-5 px-2 rounded-full text-[10px] font-black inline-flex items-center text-white" style={{ background: st?.[1] || '#868E96' }}>{st?.[0] || 'أُرسل للمطبخ'}</span>
                    )}
                    {i.paidQty > 0 && <span className="h-5 px-2 rounded-full bg-[#EBFBEE] text-[#2F9E44] text-[10px] font-black inline-flex items-center">مدفوع {i.paidQty}/{i.qty}</span>}
                    {i.addedBy && i.addedBy !== worker.name && <span className="text-[10px] font-bold text-neutral-400">{i.addedBy}</span>}
                  </div>
                </div>
                <div className="text-sm font-black whitespace-nowrap">{money(itemTotal(i))}</div>
              </div>
              {!i.voided && !i.sentAt && (
                <div className="flex items-center gap-1 mt-2">
                  <button type="button" aria-label="زيادة" disabled={busy} onClick={() => setQty(i.id, i.qty + 1)} className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center cursor-pointer"><Plus size={14} /></button>
                  <button type="button" aria-label="إنقاص" disabled={busy} onClick={() => setQty(i.id, i.qty - 1)} className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center cursor-pointer"><Minus size={14} /></button>
                  <button type="button" aria-label="حذف" disabled={busy} onClick={() => setQty(i.id, 0)} className="w-9 h-9 rounded-xl text-[#E03131] hover:bg-red-50 flex items-center justify-center cursor-pointer mr-auto"><Trash2 size={15} /></button>
                </div>
              )}
              {!i.voided && i.sentAt && i.paidQty === 0 && (
                <button type="button" disabled={busy} onClick={() => voidItem(i.id, i.name)} className="mt-1.5 h-8 px-2 rounded-lg text-[11px] font-bold text-neutral-500 hover:text-[#E03131] hover:bg-red-50 inline-flex items-center gap-1 cursor-pointer"><Ban size={12} /> إلغاء</button>
              )}
            </div>
          );
        })}
      </div>
      <div className="shrink-0 border-t border-neutral-100 p-3 space-y-2">
        <div className="space-y-0.5 text-sm font-bold">
          {totals.discount > 0 && <div className="flex justify-between text-neutral-500"><span>المجموع</span><span>{money(totals.subtotal)}</span></div>}
          {totals.discount > 0 && <div className="flex justify-between text-[#C2255C]"><span>خصم{tab.discountPct ? ` ${tab.discountPct}%` : ''}{tab.discountNote ? ` · ${tab.discountNote}` : ''}</span><span>- {money(totals.discount)}</span></div>}
          <div className="flex justify-between text-lg font-black"><span>الإجمالي</span><span>{money(totals.total)}</span></div>
          {totals.paid > 0 && <div className="flex justify-between text-[#2F9E44]"><span>مدفوع</span><span>{money(totals.paid)}</span></div>}
          {totals.paid > 0 && <div className="flex justify-between text-[#E8590C] font-black"><span>المتبقي</span><span>{money(totals.due)}</span></div>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <BigButton tone="orange" disabled={busy || unsent.length === 0} onClick={() => run(() => sendToKitchen(uid, tab.id, actor), 'أُرسل إلى المطبخ')}><Send size={16} /> للمطبخ{unsent.length ? ` (${unsent.length})` : ''}</BigButton>
          {totals.total > 0 || tab.payments.length ? (
            <div className="flex gap-2">
              <BigButton tone="green" className="flex-1" disabled={busy || !canPay || totals.due <= 0} onClick={() => setDialog('pay')}><Wallet size={16} /> الدفع</BigButton>
              <BigButton tone="light" className="w-12 px-0 text-xl" aria-label="إضافة بخشيش" title="إضافة بخشيش" disabled={busy || totals.due <= 0} onClick={() => { setTipText(''); setDialog('tip'); }}><Plus size={20} strokeWidth={3} /></BigButton>
            </div>
          ) : (
            <BigButton tone="light" disabled={busy} onClick={() => window.confirm('إغلاق الطاولة بدون فاتورة؟') && run(() => closeEmptyTab(uid, tab.id, actor).then(() => onClosed(null)))}>إغلاق الطاولة</BigButton>
          )}
        </div>
        {!canPay && <div className="text-[11px] font-bold text-[#E8590C]">الدفع لهذه الطاولة عند {tab.ownerName} فقط (من الإعدادات).</div>}
      </div>
    </div>
  );

  const menuPane = (
    <div className="flex flex-col min-h-0 h-full">
      <div className="shrink-0 p-3 space-y-2 bg-[#f5f5f7]">
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن طبق" className="w-full h-11 pr-9 pl-3 rounded-2xl border border-neutral-200 bg-white text-sm font-bold outline-none focus:border-neutral-400" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ id: '', name: 'الكل', icon: '' }, ...menu.categories].map((c) => (
            <button key={c.id} type="button" onClick={() => { setCat(c.id); setSearch(''); }} className={`shrink-0 h-10 px-4 rounded-2xl text-sm font-black cursor-pointer inline-flex items-center gap-2 ${cat === c.id && !search ? 'bg-[#1d1d1f] text-white' : 'bg-white text-neutral-600 border border-neutral-200'}`}>{'image' in c && c.image ? <img src={c.image} alt="" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" /> : c.icon ? <span>{c.icon}</span> : null}{c.name}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 pt-0 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 content-start bg-[#f5f5f7]">
        {dishes.map((d) => (
          <button
            key={d.id}
            type="button"
            disabled={!d.available}
            onClick={() => pickDish(d)}
            className="min-h-[86px] p-3 rounded-2xl bg-white border border-neutral-200 text-right flex flex-col justify-between gap-1 cursor-pointer active:scale-[0.97] transition disabled:opacity-40 disabled:cursor-default"
          >
            <span className="text-sm font-black leading-snug">{d.name}</span>
            <span className="text-xs font-bold text-neutral-500">{d.available ? money(d.price) : 'نفد اليوم'}</span>
          </button>
        ))}
        {dishes.length === 0 && <div className="col-span-full py-10 text-center text-sm font-bold text-neutral-400">لا توجد أطباق</div>}
      </div>
    </div>
  );

  const tables = allTables(menu.halls);
  const occupied = new Set(openTabs.map((t) => t.id));

  return (
    <div className="absolute inset-0 z-[20] flex flex-col bg-[#f5f5f7]">
      <header className="shrink-0 bg-white border-b border-neutral-200 px-2 sm:px-3 py-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} aria-label="رجوع" className="w-11 h-11 rounded-2xl bg-neutral-100 flex items-center justify-center cursor-pointer"><ArrowRight size={20} /></button>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-black truncate">{tabTitle(tab)}{tab.hall ? <span className="text-sm text-neutral-400"> · {tab.hall}</span> : null}</div>
          <div className="text-[11px] font-bold text-neutral-500 truncate">{tab.ownerName} · منذ {minutesSince(tab.openedAt)} د{tab.note ? ` · ${tab.note}` : ''}</div>
        </div>
        {tab.kind === 'table' && (
          <div className="flex items-center gap-1 h-11 px-1 rounded-2xl bg-neutral-100" title="عدد الضيوف">
            <Users size={15} className="mx-1 text-neutral-500" />
            <button type="button" aria-label="ضيوف أقل" onClick={() => run(() => changeTab(uid, tab.id, (t) => ({ guests: Math.max(0, t.guests - 1) })))} className="w-8 h-8 rounded-xl bg-white flex items-center justify-center cursor-pointer"><Minus size={13} /></button>
            <span className="w-6 text-center text-sm font-black">{tab.guests}</span>
            <button type="button" aria-label="ضيوف أكثر" onClick={() => run(() => changeTab(uid, tab.id, (t) => ({ guests: t.guests + 1 })))} className="w-8 h-8 rounded-xl bg-white flex items-center justify-center cursor-pointer"><Plus size={13} /></button>
          </div>
        )}
        <div className="flex gap-1.5 overflow-x-auto max-w-full [&>button]:shrink-0 [&>button]:whitespace-nowrap">
          {tab.kind === 'table' && <BigButton tone="light" className="h-11 px-3 text-xs" onClick={() => setDialog('move')}><MoveRight size={15} /> نقل / دمج</BigButton>}
          <BigButton tone="light" className="h-11 px-3 text-xs" onClick={() => setDialog('transfer')}><UserRound size={15} /> عامل آخر</BigButton>
          <BigButton tone="light" className="h-11 px-3 text-xs" onClick={() => { setDiscountText(tab.discountPct ? `${tab.discountPct}%` : tab.discount ? String(tab.discount) : ''); setDiscountNote(tab.discountNote); setDialog('discount'); }}><Percent size={15} /> خصم</BigButton>
          <BigButton tone="light" className="h-11 px-3 text-xs" onClick={() => setDialog('note')}><StickyNote size={15} /> ملاحظة</BigButton>
          <BigButton tone="light" className="h-11 px-3 text-xs" onClick={() => printReceipt(tab, menu.settings)}><Printer size={15} /> طباعة</BigButton>
        </div>
      </header>

      <div className="md:hidden shrink-0 grid grid-cols-2 gap-1 p-2 bg-white border-b border-neutral-200">
        <button type="button" onClick={() => setSide('bill')} className={`h-10 rounded-xl text-sm font-black cursor-pointer ${side === 'bill' ? 'bg-[#1d1d1f] text-white' : 'bg-neutral-100'}`}>الفاتورة · {money(totals.due || totals.total)}</button>
        <button type="button" onClick={() => setSide('menu')} className={`h-10 rounded-xl text-sm font-black cursor-pointer ${side === 'menu' ? 'bg-[#1d1d1f] text-white' : 'bg-neutral-100'}`}>المنيو</button>
      </div>

      <div className="flex-1 min-h-0 md:grid md:grid-cols-[minmax(320px,400px)_1fr]">
        <div className={`h-full min-h-0 md:border-l border-neutral-200 ${side === 'bill' ? '' : 'hidden md:block'}`}>{bill}</div>
        <div className={`h-full min-h-0 ${side === 'menu' ? '' : 'hidden md:block'}`}>{menuPane}</div>
      </div>

      {optionsFor && <DishOptions dish={optionsFor} subCatalogs={menu.subCatalogs} currency={currency} onAdd={addLine} onClose={() => setOptionsFor(null)} />}
      {dialog === 'pay' && <PayDialog tab={tab} currency={currency} busy={busy} onPay={pay} onClose={() => setDialog('')} onDraft={onDraft} />}

      {dialog === 'move' && (
        <Modal title={`نقل ${tabTitle(tab)} أو دمجها`} onClose={() => setDialog('')} wide>
          {menu.halls.map((h) => (
            <section key={h.id} className="space-y-2">
              <div className="text-sm font-black">{h.name}</div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {h.tables.map((t) => {
                  const id = openTabId(t.id);
                  const here = id === tab.id;
                  const busyTable = occupied.has(id);
                  return (
                    <button key={t.id} type="button" disabled={here || busy} onClick={() => move({ kind: 'table', tableId: t.id, table: t.name, hall: h.name }, busyTable)} className={`h-14 rounded-2xl text-base font-black cursor-pointer disabled:opacity-30 ${busyTable ? 'bg-[#FFF4E6] text-[#D9480F] border border-[#FFC078]' : 'bg-neutral-100'}`}>
                      {t.name}
                      {busyTable && !here && <div className="text-[9px] font-bold">دمج</div>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          {tables.length === 0 && <div className="text-sm text-neutral-400 font-bold">لا توجد طاولات. أضفها من «الصالات والطاولات».</div>}
        </Modal>
      )}

      {dialog === 'transfer' && (
        <Modal title="تحويل الطاولة لعامل آخر" onClose={() => setDialog('')}>
          <p className="text-xs font-bold text-neutral-500">العامل الجديد يصبح مسؤولًا عن الطاولة وعن تحصيلها.</p>
          <div className="grid grid-cols-2 gap-2">
            {workers.filter((w) => w.active && w.id !== tab.ownerId).map((w) => (
              <BigButton key={w.id} tone="light" disabled={busy} onClick={() => transfer(w)}>{w.name}</BigButton>
            ))}
          </div>
        </Modal>
      )}

      {dialog === 'discount' && (
        <Modal title="خصم على الفاتورة" onClose={() => setDialog('')} footer={<BigButton tone="dark" className="w-full" disabled={busy} onClick={applyDiscount}>تطبيق الخصم</BigButton>}>
          <label className="block space-y-1">
            <span className="text-sm font-black">المبلغ أو النسبة</span>
            <input autoFocus className="w-full h-12 px-3 rounded-2xl border border-neutral-200 text-lg font-black outline-none" dir="ltr" placeholder="مثلاً 10000 أو 10%" value={discountText} onChange={(e) => setDiscountText(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-black">السبب (اختياري)</span>
            <input className="w-full h-12 px-3 rounded-2xl border border-neutral-200 text-sm font-bold outline-none" value={discountNote} onChange={(e) => setDiscountNote(e.target.value)} placeholder="زبون دائم، تأخير..." />
          </label>
          <p className="text-[11px] font-bold text-neutral-400">يحتاج رقم المدير، ويُسجل في سجل العمليات. ضع 0 لإزالة الخصم.</p>
        </Modal>
      )}

      {dialog === 'tip' && (
        <Modal title="إضافة بخشيش إلى الفاتورة" onClose={() => setDialog('')} footer={<BigButton tone="green" className="w-full" disabled={busy || !(parseFloat(tipText.replace(/[,\s]/g, '')) > 0)} onClick={addTip}>إضافة {parseFloat(tipText.replace(/[,\s]/g, '')) > 0 ? money(parseFloat(tipText.replace(/[,\s]/g, ''))) : ''}</BigButton>}>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((p) => {
              const v = Math.round(((totals.subtotal - totals.tips - totals.discount) * p) / 100);
              return <BigButton key={p} tone="light" className="h-14 flex-col gap-0 text-sm" onClick={() => setTipText(String(v))}>{p}%<span className="text-[10px] font-bold text-neutral-500">{money(v)}</span></BigButton>;
            })}
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-black">المبلغ</span>
            <input autoFocus className="w-full h-12 px-3 rounded-2xl border border-neutral-200 text-lg font-black outline-none" dir="ltr" inputMode="decimal" value={tipText} onChange={(e) => setTipText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTip()} />
          </label>
          <p className="text-[11px] font-bold text-neutral-400">يظهر على الفاتورة كسطر «بخشيش»، ولا يصل للمطبخ، ولا يدخل في الخصم، ويُسلَّم مع الصندوق ويظهر في التقارير.</p>
        </Modal>
      )}

      {dialog === 'note' && (
        <Modal title="ملاحظة الطاولة" onClose={() => setDialog('')}>
          <NoteEditor value={tab.note} onSave={(note) => { run(() => changeTab(uid, tab.id, () => ({ note }))); setDialog(''); }} />
        </Modal>
      )}
    </div>
  );
};

const NoteEditor: React.FC<{ value: string; onSave: (v: string) => void }> = ({ value, onSave }) => {
  const [v, setV] = useState(value);
  return (
    <div className="space-y-3">
      <input autoFocus className="w-full h-12 px-3 rounded-2xl border border-neutral-200 text-sm font-bold outline-none" value={v} maxLength={120} onChange={(e) => setV(e.target.value)} placeholder="مثلاً: عيد ميلاد، كرسي أطفال" />
      <div className="flex gap-2">
        <BigButton tone="dark" className="flex-1" onClick={() => onSave(v.trim())}>حفظ</BigButton>
        {value && <BigButton tone="red" onClick={() => onSave('')}><X size={15} /> حذف</BigButton>}
      </div>
    </div>
  );
};
