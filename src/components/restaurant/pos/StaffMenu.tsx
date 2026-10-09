// The ☰ menu of the cashier and the waiters' tablets: the bills of the session, leaving it (a short
// break or ending it) and the settings. Ending a waiter's session hands his money to the main cashier:
// the waiter asks, the cashier counts what he receives and the tips and gets a random four-digit code,
// and the waiter types it on his tablet. That code is the signature of both devices.
import React, { useMemo, useState } from 'react';
import { doc, getDocFromServer, runTransaction, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { ChevronLeft, FileBarChart, HandCoins, KeyRound, ListChecks, LogOut, Printer, Settings, ShieldCheck, Wallet } from 'lucide-react';
import type { RestaurantSettings } from '../restaurantTypes';
import { Handover, Shift, Tab, Worker, tabTitle, tabTotals, tipTotal } from '../staffTypes';
import { closeCashDay, closeShift, confirmHandover, receiveHandover, requestHandover, useClosedCashDays, useClosedTabs, useHandover, useHandovers, useOpenTabs, useShifts } from '../staffCloud';
import { CashDay, REPORT_KEEP_DAYS, buildReport, expectedDrawer } from '../cashDay';
import { CashReportView } from './CashReportView';
import { NumberPad } from './NumberPad';
import { printCashReport, printHandover } from './receipt';
import { BigButton, Modal, failText } from './posUi';

type Money = (n: number) => string;
const time = (iso: string) => (iso ? new Date(iso).toLocaleTimeString('ar-SY-u-nu-latn', { hour: '2-digit', minute: '2-digit' }) : '');

export const MenuDialog: React.FC<{ cashier: boolean; onClose: () => void; onPick: (what: 'orders' | 'exit' | 'handovers' | 'closeDay' | 'reports' | 'settings') => void; pending: number }> = ({ cashier, onClose, onPick, pending }) => {
  const row = 'w-full h-14 px-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 text-sm font-black inline-flex items-center gap-3 cursor-pointer';
  return (
    <Modal title="القائمة" onClose={onClose}>
      <button type="button" className={row} onClick={() => onPick('orders')}><ListChecks size={18} />الطلبات في هذه الجلسة<ChevronLeft size={16} className="mr-auto text-neutral-400" /></button>
      {cashier && (
        <button type="button" className={row} onClick={() => onPick('handovers')}>
          <HandCoins size={18} />إنهاء جلسة نادل
          {pending > 0 && <span className="h-6 min-w-6 px-1.5 rounded-full bg-[#E03131] text-white text-xs font-black inline-flex items-center justify-center">{pending}</span>}
          <ChevronLeft size={16} className="mr-auto text-neutral-400" />
        </button>
      )}
      {cashier && <button type="button" className={row} onClick={() => onPick('closeDay')}><Wallet size={18} />إنهاء جلسة الكاشير<ChevronLeft size={16} className="mr-auto text-neutral-400" /></button>}
      {cashier && <button type="button" className={row} onClick={() => onPick('reports')}><FileBarChart size={18} />تقارير الجلسات السابقة<ChevronLeft size={16} className="mr-auto text-neutral-400" /></button>}
      <button type="button" className={row} onClick={() => onPick('exit')}><LogOut size={18} />خروج من الجلسة<ChevronLeft size={16} className="mr-auto text-neutral-400" /></button>
      <button type="button" className={row} onClick={() => onPick('settings')}><Settings size={18} />إعدادات<ChevronLeft size={16} className="mr-auto text-neutral-400" /></button>
    </Modal>
  );
};

// ---------- The bills of the session ----------

const tabState = (t: Tab) => {
  const { paid } = tabTotals(t);
  if (t.status === 'closed') return { label: 'منتهية · محصّلة', color: '#2F9E44' };
  if (paid > 0) return { label: 'محصّلة جزئيًا', color: '#E8590C' };
  return { label: 'مفعّلة', color: '#1971C2' };
};

export const SessionOrdersDialog: React.FC<{ tabs: Tab[]; money: Money; onClose: () => void }> = ({ tabs, money, onClose }) => {
  const [openId, setOpenId] = useState('');
  const sorted = [...tabs].sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  return (
    <Modal title="الطلبات في هذه الجلسة" onClose={onClose} wide>
      {sorted.length === 0 && <div className="text-sm font-bold text-neutral-400">لا توجد طلبات في هذه الجلسة بعد.</div>}
      {sorted.map((t) => {
        const st = tabState(t);
        const totals = tabTotals(t);
        const open = openId === t.id;
        return (
          <div key={t.id} className={`rounded-2xl border ${open ? 'border-[#1d1d1f] bg-neutral-50' : 'border-neutral-200'}`}>
            <button type="button" onClick={() => setOpenId(open ? '' : t.id)} className="w-full p-3 flex items-center gap-2 text-right cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black">{tabTitle(t)}{t.hall ? ` · ${t.hall}` : ''}</div>
                <div className="text-[11px] font-bold text-neutral-500">{time(t.openedAt)}{t.closedAt ? ` ← ${time(t.closedAt)}` : ''}</div>
              </div>
              <span className="h-6 px-2 rounded-full text-white text-[10px] font-black inline-flex items-center" style={{ background: st.color }}>{st.label}</span>
              <span className="text-sm font-black">{money(totals.total)}</span>
            </button>
            {open && (
              <div className="px-3 pb-3 space-y-1 text-xs font-bold">
                {t.items.filter((i) => !i.voided).map((i) => (
                  <div key={i.id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{money(i.unitPrice * i.qty)}</span></div>
                ))}
                {tipTotal(t) > 0 && <div className="flex justify-between text-[#2F9E44]"><span>منها بخشيش</span><span>{money(tipTotal(t))}</span></div>}
                <div className="flex justify-between pt-1 border-t border-neutral-200"><span>المدفوع</span><span>{money(totals.paid)}</span></div>
                {totals.due > 0 && <div className="flex justify-between text-[#E8590C]"><span>المتبقي</span><span>{money(totals.due)}</span></div>}
              </div>
            )}
          </div>
        );
      })}
    </Modal>
  );
};

// ---------- Leaving the session ----------

export const ExitDialog: React.FC<{ waiter: boolean; openCount: number; onBreak: () => void; onEnd: () => void; onClose: () => void }> = ({ waiter, openCount, onBreak, onEnd, onClose }) => (
  <Modal title="الخروج من الجلسة" onClose={onClose}>
    <button type="button" onClick={onBreak} className="w-full p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 text-right cursor-pointer">
      <div className="text-sm font-black">خروج مؤقت</div>
      <div className="text-xs font-bold text-neutral-500 mt-0.5">يقفل الجهاز ويبقى صندوقك مفتوحًا. ترجع برقمك السري وتكمل.</div>
    </button>
    <button type="button" onClick={onEnd} className="w-full p-4 rounded-2xl bg-[#FFF4E6] hover:bg-[#FFE8CC] text-right cursor-pointer">
      <div className="text-sm font-black text-[#D9480F]">إنهاء الجلسة</div>
      <div className="text-xs font-bold text-[#A34A00] mt-0.5">{waiter ? 'تسلّم المبالغ التي حصّلتها للكاشير، أو تغلق بدون تسليم.' : 'يغلق صندوقك بالنقد الذي تعدّه.'}</div>
    </button>
    {openCount > 0 && <div className="p-3 rounded-2xl bg-[#FFF4E6] text-[#A34A00] text-xs font-bold">لديك {openCount} طاولة مفتوحة. حوّلها لعامل آخر قبل إنهاء الجلسة.</div>}
  </Modal>
);

// ---------- The waiter hands his money over ----------

export const WaiterHandoverDialog: React.FC<{
  uid: string;
  shift: Shift | undefined;
  expectedCash: number;
  expectedTips: number;
  money: Money;
  onDone: () => void; // the handover is complete: sign out
  onClose: () => void;
  toast: (t: string, bad?: boolean) => void;
}> = ({ uid, shift, expectedCash, expectedTips, money, onDone, onClose, toast }) => {
  const h = useHandover(uid, shift?.id || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const waiting = h && (h.status === 'requested' || h.status === 'received') ? h : null;

  const ask = async (skipped: boolean) => {
    if (!shift) return;
    setBusy(true);
    try {
      await requestHandover(uid, shift, expectedCash, expectedTips, skipped);
      if (skipped) {
        
        await closeShift(uid, shift.id, 0, expectedCash);
        toast('أُغلق الصندوق بدون تسليم');
        onDone();
      }
    } catch (e) {
      toast(failText(e), true);
    }
    setBusy(false);
  };

  const typed = async (code: string) => {
    if (!waiting || !shift) return;
    if (waiting.status !== 'received') return setError('الكاشير لم يستلم المبلغ بعد.');
    if (code !== waiting.code) return setError('الرقم غير صحيح. اطلبه من الكاشير.');
    setBusy(true);
    try {
      await confirmHandover(uid, waiting);
      toast('تم التسليم وأُغلق صندوقك');
      onDone();
    } catch (e) {
      toast(failText(e), true);
      setBusy(false);
    }
  };

  return (
    <Modal title="تسليم المبالغ للكاشير" onClose={onClose}>
      <div className="space-y-1.5">
        <div className="flex justify-between p-3 rounded-2xl bg-neutral-50 text-sm font-black"><span>المبلغ الواجب تسليمه (نقدي)</span><span>{money(waiting?.expectedCash ?? expectedCash)}</span></div>
        <div className="flex justify-between p-3 rounded-2xl bg-[#F4FCF5] text-sm font-black text-[#2B8A3E]"><span>منه بخشيش</span><span>{money(waiting?.expectedTips ?? expectedTips)}</span></div>
      </div>
      {!waiting ? (
        <>
          <p className="text-xs font-bold text-neutral-500">اضغط «تسليم» ثم اذهب إلى الكاشير الرئيسي: يختار «إنهاء جلسة نادل» ويسجّل ما استلمه.</p>
          <BigButton tone="green" className="w-full" disabled={busy || !shift} onClick={() => ask(false)}><HandCoins size={17} /> تسليم</BigButton>
          <BigButton tone="light" className="w-full" disabled={busy || !shift} onClick={() => window.confirm('إغلاق الصندوق بدون تسليم؟ يُسجَّل المبلغ كغير مسلَّم.') && ask(true)}>إغلاق بدون تسليم</BigButton>
        </>
      ) : (
        <>
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#E7F5FF] text-[#1864AB] text-xs font-bold leading-relaxed"><KeyRound size={16} className="shrink-0 mt-0.5" />
            {waiting.status === 'requested' ? 'بانتظار الكاشير ليسجل ما استلمه. بعد الاستلام يظهر عنده رقم من أربع خانات.' : 'استلم الكاشير المبلغ. أدخل الرقم الذي يظهر على شاشته لإنهاء التسليم.'}
          </div>
          <NumberPad length={4} dark={false} busy={busy} error={error} onSubmit={typed} />
        </>
      )}
    </Modal>
  );
};

// ---------- The main cashier ends a waiter's session ----------

export const CashierHandoverDialog: React.FC<{ uid: string; worker: Worker; since: string; money: Money; settings: RestaurantSettings; onClose: () => void; toast: (t: string, bad?: boolean) => void }> = ({ uid, worker, since, money, settings, onClose, toast }) => {
  const list = useHandovers(uid, since);
  const [pickId, setPickId] = useState('');
  const [cash, setCash] = useState('');
  const [tips, setTips] = useState('');
  const [busy, setBusy] = useState(false);
  const items = [...list.items].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const picked = items.find((h) => h.id === pickId);
  const parse = (s: string, fallback: number) => (s.trim() === '' ? fallback : parseFloat(s.replace(/[,\s]/g, '')) || 0);

  const label = { requested: ['بانتظار الاستلام', '#E8590C'], received: ['بانتظار رقم النادل', '#1971C2'], confirmed: ['تم التسليم', '#2F9E44'], skipped: ['أُغلق بدون تسليم', '#868E96'] } as const;

  const receive = async (h: Handover) => {
    setBusy(true);
    try {
      await receiveHandover(uid, h.id, parse(cash, h.expectedCash), parse(tips, h.expectedTips), worker.name);
    } catch (e) {
      toast(failText(e), true);
    }
    setBusy(false);
  };

  if (picked) {
    const rc = picked.status === 'requested' ? parse(cash, picked.expectedCash) : picked.receivedCash;
    const rt = picked.status === 'requested' ? parse(tips, picked.expectedTips) : picked.receivedTips;
    const diff = Math.round((rc - picked.expectedCash) * 100) / 100;
    return (
      <Modal title={`جلسة ${picked.workerName}`} onClose={() => setPickId('')}>
        <div className="text-xs font-bold text-neutral-500">{picked.deviceName} · منذ {time(picked.shiftOpenedAt)}</div>
        <div className="space-y-1.5">
          <div className="flex justify-between p-3 rounded-2xl bg-neutral-50 text-sm font-black"><span>المبلغ الواجب تحصيله</span><span>{money(picked.expectedCash)}</span></div>
          <div className="flex justify-between p-3 rounded-2xl bg-[#F4FCF5] text-sm font-black text-[#2B8A3E]"><span>البخشيش</span><span>{money(picked.expectedTips)}</span></div>
        </div>
        {picked.status === 'requested' ? (
          <>
            <label className="block space-y-1"><span className="text-sm font-black">المبلغ المحصَّل (الذي استلمته)</span>
              <input className="w-full h-12 px-3 rounded-2xl border border-neutral-200 text-lg font-black outline-none" dir="ltr" inputMode="decimal" placeholder={String(picked.expectedCash)} value={cash} onChange={(e) => setCash(e.target.value)} /></label>
            <label className="block space-y-1"><span className="text-sm font-black">مبلغ البخشيش</span>
              <input className="w-full h-12 px-3 rounded-2xl border border-neutral-200 text-lg font-black outline-none" dir="ltr" inputMode="decimal" placeholder={String(picked.expectedTips)} value={tips} onChange={(e) => setTips(e.target.value)} /></label>
            <div className={`text-sm font-black ${diff === 0 ? 'text-[#2F9E44]' : 'text-[#E03131]'}`}>{diff === 0 ? 'مطابق' : diff > 0 ? `زيادة ${money(diff)}` : `نقص ${money(-diff)}`}</div>
            <BigButton tone="green" className="w-full" disabled={busy} onClick={() => receive(picked)}>استلام</BigButton>
          </>
        ) : picked.status === 'received' ? (
          <div className="p-4 rounded-3xl bg-[#1d1d1f] text-white text-center space-y-2">
            <div className="text-xs font-bold text-white/60">اعرض هذا الرقم على {picked.workerName} ليدخله في تابلته</div>
            <div className="text-5xl font-black tracking-[0.3em]" dir="ltr">{picked.code}</div>
            <div className="text-xs font-bold text-white/60">استلمت {money(picked.receivedCash)} وبخشيش {money(picked.receivedTips)}</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-[#EBFBEE] text-[#2B8A3E] text-sm font-black">{picked.status === 'confirmed' ? `تم التسليم ${time(picked.confirmedAt)}: ${money(picked.receivedCash)} وبخشيش ${money(picked.receivedTips)}` : 'أُغلق الصندوق بدون تسليم.'}</div>
            {picked.status === 'confirmed' && <BigButton tone="light" className="w-full" onClick={() => printHandover(picked, settings)}><Printer size={16} /> طباعة إيصال التسليم</BigButton>}
          </div>
        )}
      </Modal>
    );
  }

  return (
    <Modal title="إنهاء جلسة نادل" onClose={onClose} wide>
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#F8F9FA] text-neutral-600 text-xs font-bold leading-relaxed"><ShieldCheck size={16} className="shrink-0 mt-0.5" />يظهر هنا النادل الذي ضغط «تسليم» على تابلته. سجّل ما استلمته فيظهر لك رقم، يدخله النادل ليكتمل التسليم.</div>
      {items.length === 0 && <div className="text-sm font-bold text-neutral-400">لا يوجد نادل طلب التسليم اليوم.</div>}
      {items.map((h) => (
        <button key={h.id} type="button" onClick={() => setPickId(h.id)} className="w-full p-3 rounded-2xl border border-neutral-200 flex items-center gap-2 text-right cursor-pointer hover:bg-neutral-50">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black">{h.workerName}</div>
            <div className="text-[11px] font-bold text-neutral-500">{h.deviceName} · {time(h.requestedAt)}</div>
          </div>
          <span className="h-6 px-2 rounded-full text-white text-[10px] font-black inline-flex items-center" style={{ background: label[h.status][1] }}>{label[h.status][0]}</span>
          <span className="text-sm font-black">{money(h.status === 'confirmed' || h.status === 'received' ? h.receivedCash : h.expectedCash)}</span>
        </button>
      ))}
    </Modal>
  );
};

// Times a trip to the database: a small read and a small write (what every tap on a bill costs).
const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const verdict = (ms: number) => (ms < 150 ? ['سريع', '#2F9E44'] : ms < 400 ? ['مقبول', '#E8590C'] : ['بطيء', '#E03131']);

export const SettingsDialog: React.FC<{ uid: string; deviceId: string; onClose: () => void }> = ({ uid, deviceId, onClose }) => {
  const [running, setRunning] = useState(false);
  const [res, setRes] = useState<{ read: number; write: number; tx: number } | null>(null);
  const [err, setErr] = useState('');
  const test = async () => {
    setRunning(true);
    setErr('');
    setRes(null);
    try {
      const probe = doc(db, 'restaurants', uid, 'log', `speed_${deviceId.replace(/[^a-zA-Z0-9_-]/g, '')}`);
      const reads: number[] = [];
      const writes: number[] = [];
      const txs: number[] = [];
      for (let i = 0; i < 3; i++) {
        let t = performance.now();
        await getDocFromServer(doc(db, 'restaurants', uid)).catch(() => null);
        reads.push(performance.now() - t);
        t = performance.now();
        await setDoc(probe, { action: 'فحص السرعة', at: new Date().toISOString(), n: i });
        writes.push(performance.now() - t);
        t = performance.now();
        await runTransaction(db, async (tx) => {
          await tx.get(probe);
          tx.update(probe, { n: i + 10 });
        });
        txs.push(performance.now() - t);
      }
      setRes({ read: Math.round(median(reads)), write: Math.round(median(writes)), tx: Math.round(median(txs)) });
    } catch (e) {
      setErr(failText(e));
    }
    setRunning(false);
  };
  const row = (label: string, ms: number) => {
    const [word, color] = verdict(ms);
    return (
      <div key={label} className="flex justify-between p-3 rounded-2xl bg-neutral-50 text-sm font-black">
        <span>{label}</span>
        <span style={{ color }}>{ms} مللي ثانية · {word}</span>
      </div>
    );
  };
  return (
    <Modal title="إعدادات الجهاز" onClose={onClose}>
      <div className="p-4 rounded-2xl bg-neutral-50 text-sm font-bold text-neutral-600 leading-relaxed">إعدادات الجهاز والربط بالطابعات تُضاف في خطوة لاحقة.</div>
      <div className="space-y-2">
        <div className="text-sm font-black">سرعة الاتصال بقاعدة البيانات</div>
        <div className="text-xs font-bold text-neutral-500 leading-relaxed">يقيس كم يستغرق وصول الجهاز إلى فايربيس. إن كانت الأرقام فوق ٤٠٠ مللي ثانية فالبطء من الإنترنت أو بُعد الخادم، لا من البرنامج.</div>
        {res && (
          <div className="space-y-1.5">
            {row('قراءة', res.read)}
            {row('كتابة', res.write)}
            {row('عملية دفع أو تعديل (قراءة وكتابة)', res.tx)}
          </div>
        )}
        {err && <div className="p-3 rounded-2xl bg-[#FFF0F0] text-[#E03131] text-xs font-bold">{err}</div>}
        <BigButton tone="dark" className="w-full" disabled={running} onClick={test}>{running ? 'جاري القياس…' : 'فحص السرعة'}</BigButton>
      </div>
    </Modal>
  );
};


// ---------- The main cashier's session ----------

const parseMoney = (s: string, fallback: number) => (s.trim() === '' ? fallback : parseFloat(s.replace(/[,\s]/g, '')) || 0);

// Opening: the amount put in the drawer. It cannot be skipped: every sale of the session is counted from here.
export const OpenDayDialog: React.FC<{ onOpen: (amount: number) => Promise<void>; money: Money; onLogout: () => void }> = ({ onOpen, onLogout }) => {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-[45] bg-black/60 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 text-[#1d1d1f]">
        <h3 className="text-lg font-black">افتتاح جلسة الكاشير</h3>
        <label className="block space-y-1">
          <span className="text-sm font-black">مبلغ الافتتاح في الدرج (اختياري)</span>
          <input autoFocus className="w-full h-12 px-3 rounded-2xl border border-neutral-200 text-lg font-black outline-none" dir="ltr" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <BigButton tone="green" className="w-full" disabled={busy} onClick={async () => { setBusy(true); await onOpen(parseMoney(amount, 0)); setBusy(false); }}>افتتاح</BigButton>
        <BigButton tone="light" className="w-full" onClick={onLogout}>رجوع</BigButton>
      </div>
    </div>
  );
};

// Ending the session: the report so far (printable without closing), the drawer against what it
// should hold, and the closing that saves the report and ends the session.
export const CloseDayDialog: React.FC<{
  uid: string;
  day: CashDay;
  worker: Worker;
  workers: Worker[];
  money: Money;
  settings: RestaurantSettings;
  onClose: () => void;
  onClosed: () => void;
  toast: (t: string, bad?: boolean) => void;
}> = ({ uid, day, worker, workers, money, settings, onClose, onClosed, toast }) => {
  const openTabs = useOpenTabs(uid);
  const closedTabs = useClosedTabs(uid, day.openedAt);
  const handovers = useHandovers(uid, day.openedAt);
  const shifts = useShifts(uid);
  const [counted, setCounted] = useState('');
  const [busy, setBusy] = useState(false);
  const waiterIds = useMemo(() => new Set(workers.filter((w) => w.role === 'waiter').map((w) => w.id)), [workers]);
  const report = useMemo(
    () => buildReport([...openTabs.items, ...closedTabs.items], handovers.items, shifts.items, waiterIds, day.openedAt, new Date().toISOString()),
    [openTabs.items, closedTabs.items, handovers.items, shifts.items, waiterIds, day.openedAt]
  );
  const expected = expectedDrawer(day.openingAmount, report);
  const hasCount = counted.trim() !== '';
  const real = parseMoney(counted, expected);
  const diff = Math.round((real - expected) * 100) / 100;
  const openWaiters = shifts.items.filter((s) => !s.closedAt && waiterIds.has(s.workerId) && s.openedAt >= day.openedAt);
  const pendingHandovers = handovers.items.filter((h) => h.status === 'requested' || h.status === 'received');
  const pending = [...new Set([...openWaiters.map((s) => s.workerName), ...pendingHandovers.map((h) => h.workerName)])];
  const ready = openTabs.ready && closedTabs.ready && handovers.ready && shifts.ready;

  const print = () => printCashReport(report, settings, { title: 'تقرير جلسة الكاشير', opening: day.openingAmount, expected, counted: hasCount ? real : null, by: worker.name });

  const close = async () => {
    if (pending.length && !window.confirm(`لم تنتهِ جلسة: ${pending.join('، ')}. تُحسب مبالغهم غير المسلَّمة خارج الدرج. إغلاق الجلسة على أي حال؟`)) return;
    if (openTabs.items.length && !window.confirm(`يوجد ${openTabs.items.length} طاولة مفتوحة. تبقى مفتوحة وتُحسب في الجلسة التالية. متابعة؟`)) return;
    setBusy(true);
    try {
      await closeCashDay(uid, day, worker.name, expected, real, report);
      toast('أُغلقت جلسة الكاشير وحُفظ تقريرها');
      onClosed();
    } catch (e) {
      toast(failText(e), true);
      setBusy(false);
    }
  };

  return (
    <Modal title="إنهاء جلسة الكاشير" onClose={onClose} wide footer={
      <div className="grid grid-cols-2 gap-2">
        <BigButton tone="light" disabled={!ready} onClick={print}><Printer size={16} /> طباعة بدون إغلاق</BigButton>
        <BigButton tone="dark" disabled={busy || !ready} onClick={close}>إغلاق الجلسة</BigButton>
      </div>
    }>
      <div className="text-xs font-bold text-neutral-500">مفتوحة منذ {new Date(day.openedAt).toLocaleString('ar-SY-u-nu-latn')} · افتتحها {day.openedBy}</div>
      {pending.length > 0 && <div className="p-3 rounded-2xl bg-[#FFF4E6] text-[#A34A00] text-xs font-bold">لم يسلّم بعد: {pending.join('، ')}</div>}
      <section className="space-y-1.5">
        <div className="text-xs font-black text-neutral-500">الدرج</div>
        <div className="flex justify-between p-2.5 rounded-xl bg-neutral-50 text-sm font-bold"><span>مبلغ الافتتاح</span><span>{money(day.openingAmount)}</span></div>
        <div className="flex justify-between p-2.5 rounded-xl bg-neutral-50 text-sm font-bold"><span>نقد الكاشير</span><span>{money(report.cashDirect)}</span></div>
        <div className="flex justify-between p-2.5 rounded-xl bg-neutral-50 text-sm font-bold"><span>نقد مستلَم من النُّدُل</span><span>{money(report.cashFromWaiters)}</span></div>
        <div className="flex justify-between p-3 rounded-2xl bg-[#1d1d1f] text-white text-base font-black"><span>الواجب وجوده في الدرج</span><span>{money(expected)}</span></div>
        <label className="block space-y-1">
          <span className="text-sm font-black">الموجود فعلًا في الدرج</span>
          <input className="w-full h-12 px-3 rounded-2xl border border-neutral-200 text-lg font-black outline-none" dir="ltr" inputMode="decimal" placeholder={String(expected)} value={counted} onChange={(e) => setCounted(e.target.value)} />
        </label>
        {hasCount && <div className={`text-sm font-black ${diff === 0 ? 'text-[#2F9E44]' : 'text-[#E03131]'}`}>{diff === 0 ? 'الدرج مطابق' : diff > 0 ? `زيادة ${money(diff)}` : `نقص ${money(-diff)}`}</div>}
      </section>
      <CashReportView report={report} money={money} />
      <p className="text-[11px] font-bold text-neutral-400">يُحفظ التقرير عند الإغلاق {Math.round(REPORT_KEEP_DAYS / 365)} سنتين ويمكن استدعاؤه وطباعته لاحقًا. الجلسة التالية تُفتتح بمبلغ افتتاح جديد.</p>
    </Modal>
  );
};

// Looking at the reports of the closed sessions, by date, and printing them again.
export const ReportsArchiveDialog: React.FC<{ uid: string; money: Money; settings: RestaurantSettings; worker: Worker; onClose: () => void }> = ({ uid, money, settings, worker, onClose }) => {
  const since = useMemo(() => new Date(Date.now() - REPORT_KEEP_DAYS * 86400000).toISOString(), []);
  const days = useClosedCashDays(uid, since);
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(today);
  const [pickId, setPickId] = useState('');
  const rows = days.items.filter((d) => d.closedAt.slice(0, 10) >= from && d.closedAt.slice(0, 10) <= to).sort((a, b) => b.closedAt.localeCompare(a.closedAt));
  const picked = rows.find((d) => d.id === pickId) || days.items.find((d) => d.id === pickId);
  const when = (iso: string) => new Date(iso).toLocaleString('ar-SY-u-nu-latn', { dateStyle: 'short', timeStyle: 'short' });

  if (picked?.report) {
    return (
      <Modal title="تقرير جلسة" onClose={() => setPickId('')} wide footer={<BigButton tone="light" className="w-full" onClick={() => printCashReport(picked.report!, settings, { title: 'تقرير جلسة الكاشير', opening: picked.openingAmount, expected: picked.expectedDrawer, counted: picked.counted, by: worker.name })}><Printer size={16} /> طباعة</BigButton>}>
        <div className="text-xs font-bold text-neutral-500">{when(picked.openedAt)} ← {when(picked.closedAt)} · أغلقها {picked.closedBy}</div>
        <div className="flex justify-between p-2.5 rounded-xl bg-neutral-50 text-sm font-bold"><span>الدرج: واجب {money(picked.expectedDrawer)}</span><span>موجود {money(picked.counted)}</span></div>
        <CashReportView report={picked.report} money={money} />
      </Modal>
    );
  }

  return (
    <Modal title="تقارير جلسات الكاشير" onClose={onClose} wide>
      <div className="flex gap-2 items-center text-xs font-bold">
        <span>من</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 px-2 rounded-xl border border-neutral-200" />
        <span>إلى</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 px-2 rounded-xl border border-neutral-200" />
      </div>
      {!days.ready ? <div className="text-sm font-bold text-neutral-400">جاري التحميل…</div> : rows.length === 0 && <div className="text-sm font-bold text-neutral-400">لا توجد جلسات مغلقة في هذه الفترة.</div>}
      {rows.map((d) => (
        <button key={d.id} type="button" onClick={() => setPickId(d.id)} className="w-full p-3 rounded-2xl border border-neutral-200 flex items-center gap-2 text-right cursor-pointer hover:bg-neutral-50">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black">{when(d.openedAt)} ← {when(d.closedAt)}</div>
            <div className="text-[11px] font-bold text-neutral-500">أغلقها {d.closedBy}{d.counted !== d.expectedDrawer ? ` · فرق الدرج ${money(Math.round((d.counted - d.expectedDrawer) * 100) / 100)}` : ''}</div>
          </div>
          <span className="text-sm font-black">{money(d.report?.sales || 0)}</span>
        </button>
      ))}
    </Modal>
  );
};
