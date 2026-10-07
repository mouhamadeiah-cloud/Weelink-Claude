// The ☰ menu of the cashier and the waiters' tablets: the bills of the session, leaving it (a short
// break or ending it) and the settings. Ending a waiter's session hands his money to the main cashier:
// the waiter asks, the cashier counts what he receives and the tips and gets a random four-digit code,
// and the waiter types it on his tablet. That code is the signature of both devices.
import React, { useState } from 'react';
import { ChevronLeft, HandCoins, KeyRound, ListChecks, LogOut, Printer, Settings, ShieldCheck } from 'lucide-react';
import type { RestaurantSettings } from '../restaurantTypes';
import { Handover, Shift, Tab, Worker, tabTitle, tabTotals, tipTotal } from '../staffTypes';
import { closeShift, confirmHandover, receiveHandover, requestHandover, useHandover, useHandovers } from '../staffCloud';
import { NumberPad } from './NumberPad';
import { printHandover } from './receipt';
import { BigButton, Modal, failText } from './posUi';

type Money = (n: number) => string;
const time = (iso: string) => (iso ? new Date(iso).toLocaleTimeString('ar-SY-u-nu-latn', { hour: '2-digit', minute: '2-digit' }) : '');

export const MenuDialog: React.FC<{ cashier: boolean; onClose: () => void; onPick: (what: 'orders' | 'exit' | 'handovers' | 'settings') => void; pending: number }> = ({ cashier, onClose, onPick, pending }) => {
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

export const SettingsDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <Modal title="إعدادات الجهاز" onClose={onClose}>
    <div className="p-4 rounded-2xl bg-neutral-50 text-sm font-bold text-neutral-600 leading-relaxed">إعدادات الجهاز والربط بالطابعات تُضاف في خطوة لاحقة.</div>
  </Modal>
);
