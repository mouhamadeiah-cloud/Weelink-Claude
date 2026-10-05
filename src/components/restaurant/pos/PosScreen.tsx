// شاشة الكاشير والنادل: one program for the cashier and the waiters' tablets. A worker signs in with
// his PIN, which opens his till (shift) if it is not open yet; everything he takes is written on his
// name and this device. The table plan shows each hall: free tables, occupied ones with their bill,
// waiter and time, the guests' QR orders waiting to be added and the dishes the kitchen has ready.
// Takeaway bills have their own row. «فواتير اليوم» lists the closed bills (print, reopen with the
// manager's PIN) and «صندوقي» shows the worker's money and closes his till with the cash he counts.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Armchair, ShoppingBag, Lock, LogOut, X, Wallet, ReceiptText, Plus, QrCode, BellRing, Users, Printer, RotateCcw, CheckCircle2, ChefHat } from 'lucide-react';
import { MenuOrder } from '../restaurantTypes';
import type { LiveState } from '../restaurantCloud';
import { Actor, CASH, ScreenDraft, ScreenPaid, ScreenState, Tab, Worker, WORKER_ROLES, byMethod, openTabId, startOfToday, tabTitle, tabTotals, unsentItems } from '../staffTypes';
import { addLog, closeShift, endSession, openShift, openTab, reopenTab, setScreen, startSession, useClosedTabs, useOpenTabs, useShifts, TabPlace } from '../staffCloud';
import { formatMoney } from '../../shop/adminUi';
import { NumberPad } from './NumberPad';
import { TabView, PosMenu, PaidInfo } from './TabView';
import { printReceipt } from './receipt';
import { BigButton, Modal, failText, useManagerGate, useToast } from './posUi';

interface PosScreenProps {
  uid: string;
  menu: PosMenu | null;
  workers: Worker[];
  device: { id: string; name: string };
  live: LiveState<MenuOrder>;
  onClose?: () => void;
  onLogout?: () => void; // on a device: forget its code
  kitchen?: { open: () => void; waiting: number }; // «كاشير ومطبخ» devices: the kitchen screen on the same device
}

const minutesSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));

const KitchenButton: React.FC<{ open: () => void; waiting: number }> = ({ open, waiting }) => (
  <button type="button" onClick={open} className="relative h-10 px-3 rounded-xl bg-[#E8590C] text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer">
    <ChefHat size={15} /> المطبخ
    {waiting > 0 && <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#E03131] text-white text-[11px] font-black flex items-center justify-center">{waiting}</span>}
  </button>
);

const SignIn: React.FC<{ workers: Worker[]; device: string; onSignIn: (w: Worker) => void; onClose?: () => void; onLogout?: () => void; kitchen?: { open: () => void; waiting: number } }> = ({ workers, device, onSignIn, onClose, onLogout, kitchen }) => {
  const [error, setError] = useState('');
  const active = workers.filter((w) => w.active);
  return (
    <div className="absolute inset-0 bg-[#18191c] text-white flex items-center justify-center p-6">
      <div className="absolute top-3 left-3 flex gap-2">
        {kitchen && <KitchenButton {...kitchen} />}
        {onLogout && <button type="button" onClick={onLogout} className="h-10 px-3 rounded-xl bg-white/10 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"><LogOut size={15} /> خروج الجهاز</button>}
        {onClose && <button type="button" onClick={onClose} aria-label="إغلاق" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center cursor-pointer"><X size={18} /></button>}
      </div>
      <div className="w-full max-w-sm text-center space-y-6">
        <div>
          <div className="text-sm font-bold text-white/50">{device}</div>
          <div className="text-2xl font-black mt-1">أدخل رقمك السري</div>
        </div>
        {active.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/10 text-sm font-bold leading-relaxed">لا يوجد عمال بعد. أضف العمال وأرقامهم السرية من الإدارة في «العمال والصناديق».</div>
        ) : (
          <NumberPad
            length={4}
            error={error}
            onSubmit={(pin) => {
              const w = active.find((x) => x.pin === pin);
              if (w) onSignIn(w);
              else setError('الرقم غير صحيح.');
            }}
          />
        )}
      </div>
    </div>
  );
};

export const PosScreen: React.FC<PosScreenProps> = ({ uid, menu, workers, device, live, onClose, onLogout, kitchen }) => {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [hallId, setHallId] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [tabId, setTabId] = useState('');
  const [dialog, setDialog] = useState<'' | 'shift' | 'closed'>('');
  const [thanks, setThanks] = useState<PaidInfo | null>(null);
  const [counted, setCounted] = useState('');
  const [busy, setBusy] = useState(false);
  const openingShift = useRef('');
  const { show: toast, node: toastNode } = useToast();
  const { askManager, dialog: managerDialog } = useManagerGate(workers, worker);

  const openTabs = useOpenTabs(worker ? uid : null);
  const shifts = useShifts(worker ? uid : null);
  const myShift = worker ? shifts.items.find((s) => s.workerId === worker.id && !s.closedAt) : undefined;
  const since = useMemo(() => (myShift && myShift.openedAt < startOfToday() ? myShift.openedAt : startOfToday()), [myShift]);
  const closedTabs = useClosedTabs(worker ? uid : null, since);
  const settings = menu?.settings;
  const money = (n: number) => formatMoney(n, settings?.currency || '');

  const actor: Actor | null = worker ? { workerId: worker.id, workerName: worker.name, deviceId: device.id, deviceName: device.name } : null;

  // Each sign-in is a session, until the worker locks the device (or it locks itself). Its end
  // keeps the bills he still had open, so the manager sees what each session left behind.
  const session = useRef<{ worker: Worker; id: Promise<string | null> } | null>(null);
  const openTabsNow = useRef<Tab[]>([]);
  openTabsNow.current = openTabs.items;
  const beginSession = (w: Worker) => {
    session.current = { worker: w, id: startSession(uid, { workerId: w.id, workerName: w.name, deviceId: device.id, deviceName: device.name }).catch((e) => { console.warn('Could not start the session:', e); return null; }) };
  };
  const finishSession = (reason: string) => {
    const s = session.current;
    session.current = null;
    if (!s) return;
    const left = openTabsNow.current.filter((t) => t.ownerId === s.worker.id).map((t) => ({ title: tabTitle(t), total: tabTotals(t).total, due: tabTotals(t).due }));
    s.id.then((id) => {
      if (id) endSession(uid, id, reason, left);
    });
  };
  useEffect(() => {
    const onHide = () => finishSession('إغلاق الصفحة');
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The worker's till opens with his first sign-in.
  useEffect(() => {
    if (!worker || !actor || !shifts.ready || shifts.error || myShift || openingShift.current === worker.id) return;
    openingShift.current = worker.id;
    openShift(uid, actor).catch((e) => toast(failText(e), true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worker, shifts.ready, myShift]);

  // Back to the PIN after the idle time set by the owner.
  useEffect(() => {
    const mins = settings?.autoLockMinutes || 0;
    if (!worker || !mins) return;
    let last = Date.now();
    const touch = () => { last = Date.now(); };
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    const t = window.setInterval(() => {
      if (Date.now() - last > mins * 60000) {
        finishSession('قفل تلقائي');
        setWorker(null);
        setTabId('');
      }
    }, 10000);
    return () => {
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
      window.clearInterval(t);
    };
  }, [worker, settings?.autoLockMinutes]);

  // The customer's screen tied to this device follows the bill on it: what is being paid now, the
  // part just paid, and a thank-you after the bill is closed.
  const [screenThanks, setScreenThanks] = useState<ScreenState['thanks']>(null);
  const [draft, setDraft] = useState<ScreenDraft | null>(null);
  const [partPaid, setPartPaid] = useState<ScreenPaid | null>(null);
  useEffect(() => {
    if (tabId) setScreenThanks(null);
    setDraft(null);
    setPartPaid(null);
  }, [tabId]);
  useEffect(() => {
    const t = window.setTimeout(() => setScreen(uid, device.id, { tabId, thanks: tabId ? null : screenThanks, draft: tabId ? draft : null, paid: tabId ? partPaid : null }), 150);
    return () => window.clearTimeout(t);
  }, [uid, device.id, tabId, screenThanks, draft, partPaid]);

  const tab = tabId ? openTabs.items.find((t) => t.id === tabId) : undefined;
  // The bill was closed or moved on another device (a bill just opened here may not be listed yet).
  const seen = useRef('');
  useEffect(() => {
    if (tab) seen.current = tab.id;
    else if (tabId && seen.current === tabId) setTabId('');
  }, [tabId, tab]);

  useEffect(() => {
    if (!hallId && menu?.halls[0]) setHallId(menu.halls[0].id);
  }, [menu, hallId]);

  if (!menu || !settings) {
    return <div dir="rtl" className="fixed inset-0 bg-[#18191c] text-white flex items-center justify-center font-sans text-lg font-bold">جاري تحميل المنيو…</div>;
  }

  const signOut = () => {
    finishSession('قفل');
    setWorker(null);
    setTabId('');
    setDialog('');
    openingShift.current = '';
  };

  const shell = (children: React.ReactNode) => (
    <div dir="rtl" className="fixed inset-0 z-[2000002] bg-[#f5f5f7] text-[#1d1d1f] font-sans text-right overflow-hidden">
      {children}
      {managerDialog}
      {toastNode}
    </div>
  );

  if (!worker || !actor) return shell(<SignIn workers={workers} device={device.name} onSignIn={(w) => { beginSession(w); setWorker(w); setOnlyMine(false); }} onClose={onClose} onLogout={onLogout} kitchen={kitchen} />);

  const orders = live.items;
  const byId = new Map(openTabs.items.map((t) => [t.id, t]));
  const qrFor = (table: string) => orders.filter((o) => o.source === 'qr' && o.type === 'table' && o.table === table && !o.tabId && o.status !== 'cancelled').length;
  const readyFor = (t: Tab) => orders.filter((o) => o.tabId === t.id && o.status === 'ready').length;
  const takeaways = openTabs.items.filter((t) => t.kind === 'takeaway').sort((a, b) => a.openedAt.localeCompare(b.openedAt));

  const select = async (place: TabPlace) => {
    const existing = place.tableId ? byId.get(openTabId(place.tableId)) : undefined;
    if (existing) return setTabId(existing.id);
    setBusy(true);
    try {
      setTabId(await openTab(uid, place, actor));
    } catch (e) {
      toast(failText(e), true);
    }
    setBusy(false);
  };

  const onClosedTab = (info: PaidInfo | null) => {
    setScreenThanks(info ? { ...info, at: new Date().toISOString() } : null);
    setTabId('');
    if (info) {
      setThanks(info);
      window.setTimeout(() => setThanks(null), 5000);
    }
  };

  // ---------- The worker's till ----------
  const allTabs = [...openTabs.items, ...closedTabs.items];
  const myPayments = myShift ? allTabs.flatMap((t) => t.payments).filter((p) => p.shiftId === myShift.id) : [];
  const methods = byMethod(myPayments);
  const cashExpected = methods.find((m) => m.method === CASH)?.amount || 0;
  const myOpen = openTabs.items.filter((t) => t.ownerId === worker.id);

  const doCloseShift = async () => {
    if (!myShift) return;
    const n = parseFloat(counted.replace(/[,\s]/g, '')) || 0;
    if (myOpen.length && !window.confirm(`لديك ${myOpen.length} طاولة مفتوحة. حوّلها لعامل آخر قبل إغلاق الصندوق، أو تابع على أي حال؟`)) return;
    setBusy(true);
    try {
      await closeShift(uid, myShift.id, n, cashExpected);
      toast(`أُغلق صندوق ${worker.name}`);
      setCounted('');
      signOut();
    } catch (e) {
      toast(failText(e), true);
    }
    setBusy(false);
  };

  const reopen = async (t: Tab) => {
    const by = await askManager(`إعادة فتح ${tabTitle(t)} المغلقة`);
    if (!by) return;
    setBusy(true);
    try {
      const id = await reopenTab(uid, t);
      addLog(uid, { action: 'إعادة فتح فاتورة', detail: `${tabTitle(t)} · ${money(tabTotals(t).total)}`, workerName: worker.name, approvedBy: by, deviceName: device.name });
      setDialog('');
      setTabId(id);
    } catch (e) {
      toast(failText(e), true);
    }
    setBusy(false);
  };

  const hall = menu.halls.find((h) => h.id === hallId);
  const roleLabel = WORKER_ROLES.find((r) => r.id === worker.role)?.label;
  const cloudError = openTabs.error || shifts.error;

  const tableCard = (t: { id: string; name: string; seats: number }, hallName: string) => {
    const tb = byId.get(openTabId(t.id));
    const qr = qrFor(t.name);
    if (onlyMine && (!tb || tb.ownerId !== worker.id)) return null;
    const totals = tb ? tabTotals(tb) : null;
    const ready = tb ? readyFor(tb) : 0;
    const unsent = tb ? unsentItems(tb).length : 0;
    return (
      <button
        key={t.id}
        type="button"
        disabled={busy}
        onClick={() => select({ kind: 'table', tableId: t.id, table: t.name, hall: hallName })}
        className={`relative min-h-[118px] p-3 rounded-3xl border-2 text-right flex flex-col gap-1 cursor-pointer active:scale-[0.98] transition ${tb ? (tb.ownerId === worker.id ? 'bg-[#FFF4E6] border-[#FD7E14]' : 'bg-[#FFF9DB] border-[#FAB005]') : 'bg-white border-neutral-200'}`}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-black">{t.name}</span>
          <span className="mr-auto text-[11px] font-bold text-neutral-400 inline-flex items-center gap-0.5"><Users size={12} />{tb?.guests || t.seats}</span>
        </div>
        {tb && totals ? (
          <>
            <div className="text-base font-black">{money(totals.due || totals.total)}</div>
            <div className="text-[11px] font-bold text-neutral-600 truncate">{tb.ownerName} · {minutesSince(tb.openedAt)} د</div>
            <div className="flex flex-wrap gap-1 mt-auto">
              {totals.paid > 0 && <span className="h-5 px-1.5 rounded-full bg-[#2F9E44] text-white text-[10px] font-black inline-flex items-center">دفع جزئي</span>}
              {unsent > 0 && <span className="h-5 px-1.5 rounded-full bg-[#E8590C] text-white text-[10px] font-black inline-flex items-center">لم يُرسل {unsent}</span>}
            </div>
          </>
        ) : (
          <div className="text-xs font-bold text-neutral-400 mt-auto">فارغة</div>
        )}
        {(qr > 0 || ready > 0) && (
          <div className="absolute -top-2 -left-2 flex gap-1">
            {qr > 0 && <span className="h-7 px-2 rounded-full bg-[#1971C2] text-white text-xs font-black inline-flex items-center gap-1 shadow"><QrCode size={13} />{qr}</span>}
            {ready > 0 && <span className="h-7 px-2 rounded-full bg-[#2F9E44] text-white text-xs font-black inline-flex items-center gap-1 shadow animate-pulse"><BellRing size={13} />جاهز</span>}
          </div>
        )}
      </button>
    );
  };

  return shell(
    <>
      <div className="absolute inset-0 flex flex-col">
        <header className="shrink-0 bg-[#1d1d1f] text-white px-3 py-2 flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-base font-black truncate">{worker.name} <span className="text-xs font-bold text-white/50">· {roleLabel}</span></div>
            <div className="text-[11px] font-bold text-white/50 truncate">{device.name}{settings.name ? ` · ${settings.name}` : ''}</div>
          </div>
          {kitchen && <KitchenButton {...kitchen} />}
          <button type="button" onClick={() => setDialog('closed')} className="h-10 px-3 rounded-xl bg-white/10 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"><ReceiptText size={15} /> فواتير اليوم</button>
          <button type="button" onClick={() => setDialog('shift')} className="h-10 px-3 rounded-xl bg-white/10 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"><Wallet size={15} /> صندوقي</button>
          <button type="button" onClick={signOut} className="h-10 px-3 rounded-xl bg-white/10 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer" title="تبديل العامل"><Lock size={15} /> قفل</button>
          {onClose && <button type="button" onClick={onClose} aria-label="إغلاق" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center cursor-pointer"><X size={18} /></button>}
        </header>

        <div className="shrink-0 px-3 py-2 flex items-center gap-2 overflow-x-auto bg-white border-b border-neutral-200">
          {menu.halls.map((h) => {
            const n = h.tables.filter((t) => byId.has(openTabId(t.id))).length;
            return (
              <button key={h.id} type="button" onClick={() => setHallId(h.id)} className={`shrink-0 h-11 px-4 rounded-2xl text-sm font-black inline-flex items-center gap-2 cursor-pointer ${hallId === h.id ? 'bg-[#1d1d1f] text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                <Armchair size={16} />{h.name}<span className="text-xs opacity-70">{n}/{h.tables.length}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setHallId('takeaway')} className={`shrink-0 h-11 px-4 rounded-2xl text-sm font-black inline-flex items-center gap-2 cursor-pointer ${hallId === 'takeaway' ? 'bg-[#1d1d1f] text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            <ShoppingBag size={16} />سفري{takeaways.length ? <span className="text-xs opacity-70">{takeaways.length}</span> : null}
          </button>
          <label className="shrink-0 mr-auto h-11 px-3 rounded-2xl bg-neutral-100 text-xs font-bold inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> طاولاتي فقط
          </label>
        </div>

        {cloudError && <div className="shrink-0 m-3 p-3 rounded-2xl bg-[#FFF4E6] text-[#A34A00] text-xs font-bold">{failText({ code: cloudError })}</div>}

        <main className="flex-1 overflow-y-auto p-3">
          {hallId === 'takeaway' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <button type="button" disabled={busy} onClick={() => select({ kind: 'takeaway', tableId: '', table: '', hall: '' })} className="min-h-[118px] rounded-3xl border-2 border-dashed border-neutral-300 text-neutral-500 font-black flex flex-col items-center justify-center gap-1 cursor-pointer">
                <Plus size={22} /> سفري جديد
              </button>
              {takeaways.map((t) => (
                <button key={t.id} type="button" onClick={() => setTabId(t.id)} className="min-h-[118px] p-3 rounded-3xl border-2 bg-[#F3F0FF] border-[#7048E8] text-right flex flex-col gap-1 cursor-pointer">
                  <span className="text-xl font-black">#{t.number}</span>
                  <span className="text-base font-black">{money(tabTotals(t).due)}</span>
                  <span className="text-[11px] font-bold text-neutral-600">{t.ownerName} · {minutesSince(t.openedAt)} د</span>
                  {readyFor(t) > 0 && <span className="mt-auto h-6 px-2 self-start rounded-full bg-[#2F9E44] text-white text-[10px] font-black inline-flex items-center gap-1"><BellRing size={12} />جاهز</span>}
                </button>
              ))}
            </div>
          ) : hall ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">{hall.tables.map((t) => tableCard(t, hall.name))}</div>
          ) : (
            <div className="py-16 text-center text-sm font-bold text-neutral-400">لا توجد صالات. أضفها من «الصالات والطاولات» في الإدارة.</div>
          )}
        </main>
      </div>

      {tab && (
        <TabView
          key={tab.id}
          uid={uid}
          tab={tab}
          menu={menu}
          worker={worker}
          workers={workers}
          actor={actor}
          shiftId={myShift?.id || ''}
          orders={orders}
          openTabs={openTabs.items}
          askManager={askManager}
          toast={toast}
          onBack={() => setTabId('')}
          onMoved={setTabId}
          onClosed={onClosedTab}
          onDraft={setDraft}
          onPartPaid={setPartPaid}
        />
      )}

      {thanks && (
        <div className="absolute inset-0 z-[30] bg-[#2F9E44] text-white flex flex-col items-center justify-center gap-3 text-center p-6" onClick={() => setThanks(null)}>
          <CheckCircle2 size={64} />
          <div className="text-3xl font-black">تم الدفع وأُغلقت الفاتورة</div>
          <div className="text-xl font-bold">{money(thanks.total)}</div>
          {thanks.change > 0 && <div className="mt-2 px-6 py-3 rounded-3xl bg-white text-[#2F9E44] text-3xl font-black">الباقي للزبون {money(thanks.change)}</div>}
        </div>
      )}

      {dialog === 'shift' && (
        <Modal title={`صندوق ${worker.name}`} onClose={() => setDialog('')} footer={<BigButton tone="dark" className="w-full" disabled={busy || !myShift} onClick={doCloseShift}>إغلاق الصندوق وتسليمه</BigButton>}>
          <div className="text-xs font-bold text-neutral-500">{myShift ? `مفتوح منذ ${new Date(myShift.openedAt).toLocaleTimeString('ar-SY-u-nu-latn', { hour: '2-digit', minute: '2-digit' })} على ${myShift.deviceName}` : 'جاري فتح الصندوق…'}</div>
          <div className="space-y-1.5">
            {methods.length === 0 && <div className="text-sm font-bold text-neutral-400">لا توجد تحصيلات بعد.</div>}
            {methods.map((m) => (
              <div key={m.method} className="flex justify-between p-3 rounded-2xl bg-neutral-50 text-sm font-black"><span>{m.method}</span><span>{money(m.amount)}</span></div>
            ))}
            <div className="flex justify-between p-3 rounded-2xl bg-[#1d1d1f] text-white text-base font-black"><span>المجموع ({myPayments.length} دفعة)</span><span>{money(methods.reduce((s, m) => s + m.amount, 0))}</span></div>
          </div>
          {myOpen.length > 0 && <div className="p-3 rounded-2xl bg-[#FFF4E6] text-[#A34A00] text-xs font-bold">لديك {myOpen.length} طاولة مفتوحة: {myOpen.map((t) => tabTitle(t)).join('، ')}</div>}
          <label className="block space-y-1">
            <span className="text-sm font-black">النقد الذي معك (للإغلاق)</span>
            <input className="w-full h-12 px-3 rounded-2xl border border-neutral-200 text-lg font-black outline-none" dir="ltr" inputMode="decimal" placeholder={String(cashExpected)} value={counted} onChange={(e) => setCounted(e.target.value)} />
          </label>
          {counted && (() => {
            const diff = Math.round(((parseFloat(counted.replace(/[,\s]/g, '')) || 0) - cashExpected) * 100) / 100;
            return <div className={`text-sm font-black ${diff === 0 ? 'text-[#2F9E44]' : 'text-[#E03131]'}`}>{diff === 0 ? 'مطابق' : diff > 0 ? `زيادة ${money(diff)}` : `نقص ${money(-diff)}`}</div>;
          })()}
        </Modal>
      )}

      {dialog === 'closed' && (
        <Modal title="فواتير اليوم المغلقة" onClose={() => setDialog('')} wide>
          {closedTabs.items.length === 0 && <div className="text-sm font-bold text-neutral-400">لا توجد فواتير مغلقة اليوم.</div>}
          {[...closedTabs.items].sort((a, b) => b.closedAt.localeCompare(a.closedAt)).map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-neutral-200">
              <div className="flex-1 min-w-[160px]">
                <div className="text-sm font-black">{tabTitle(t)}{t.hall ? ` · ${t.hall}` : ''}</div>
                <div className="text-[11px] font-bold text-neutral-500">{new Date(t.closedAt).toLocaleTimeString('ar-SY-u-nu-latn', { hour: '2-digit', minute: '2-digit' })} · {t.ownerName} · {t.payments.map((p) => p.method).filter((m, i, a) => a.indexOf(m) === i).join('، ') || 'بدون دفع'}</div>
              </div>
              <div className="text-base font-black">{money(tabTotals(t).total)}</div>
              <button type="button" onClick={() => printReceipt(t, settings)} className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center cursor-pointer" aria-label="طباعة"><Printer size={16} /></button>
              <button type="button" disabled={busy} onClick={() => reopen(t)} className="h-10 px-3 rounded-xl bg-neutral-100 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"><RotateCcw size={14} /> إعادة فتح</button>
            </div>
          ))}
        </Modal>
      )}
    </>
  );
};
