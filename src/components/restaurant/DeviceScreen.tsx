// A restaurant device (?device=<uid>&id=<device>): a tablet or screen types its six-digit code once and from then
// on opens straight on its own screen. The browser signs in anonymously and links that sign-in to the
// restaurant with the code; the database rules accept only the code of a working device and check it
// again on every read and write, so a device that was stopped, deleted or given a new code is cut off
// and drops back to the code pad.
// Kitchen devices show the kitchen screen (their section only, if they have one); the cashier and the
// waiters' tablets the cashier program (each worker signs in with his PIN); the customer's screen
// follows the cashier device it is tied to; the waiting screen shows the guests which orders are ready.
// A «كاشير ومطبخ» device (a small restaurant) has both the cashier and the kitchen screen, with a button to switch.
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { MonitorSmartphone, X } from 'lucide-react';
import { auth, loginAnonymously } from '../../services/firebase';
import { DEVICE_ROLES, DeviceRole, StaffDevice } from './restaurantTypes';
import type { Worker } from './staffTypes';
import { linkDevice, loadStaff, useLiveOrders } from './restaurantCloud';
import { KitchenBoard, usePublishedMenu } from './KitchenScreen';
import { NumberPad } from './pos/NumberPad';
import { PosScreen } from './pos/PosScreen';
import { CustomerDisplay } from './pos/CustomerDisplay';
import { OrderBoard } from './pos/OrderBoard';
import { startOfToday } from './staffTypes';

// One browser can hold several devices of the restaurant (for trying them out, or one computer that
// is both cashier and kitchen in two tabs). Each device remembers its code under its own id, and the
// tab's address carries that id (&id=...), so every tab, and a screen that reopens its last page after
// a power cut, opens straight on its own device.
interface Remembered { code: string; name: string; role: DeviceRole }
const storageKey = (uid: string) => `weelink_devices_${uid}`;
const readAll = (uid: string): Record<string, Remembered> => {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(uid)) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
};
const writeAll = (uid: string, all: Record<string, Remembered>) => {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(all));
  } catch {
    // storage unavailable: the code is asked again next time
  }
};
const remember = (uid: string, d: StaffDevice) => writeAll(uid, { ...readAll(uid), [d.id]: { code: d.code, name: d.name, role: d.role } });
const forget = (uid: string, id: string) => {
  const all = readAll(uid);
  delete all[id];
  writeAll(uid, all);
};
// The single code saved before devices were kept by id.
const legacyKey = (uid: string) => `weelink_device_${uid}`;
const takeLegacyCode = (uid: string) => {
  try {
    const code = localStorage.getItem(legacyKey(uid)) || '';
    localStorage.removeItem(legacyKey(uid));
    return code;
  } catch {
    return '';
  }
};

const urlDeviceId = () => new URLSearchParams(window.location.search).get('id') || '';
const setUrlDeviceId = (id: string) => {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('id', id);
  else url.searchParams.delete('id');
  window.history.replaceState(null, '', url.toString());
};

const CodePad: React.FC<{ busy: boolean; error: string; onSubmit: (code: string) => void; onBack?: () => void }> = ({ busy, error, onSubmit, onBack }) => (
  <div dir="rtl" className="fixed inset-0 bg-[#18191c] text-white flex items-center justify-center p-6 font-sans">
    <div className="w-full max-w-sm text-center space-y-6">
      <MonitorSmartphone size={44} className="mx-auto text-[#FF922B]" />
      <div>
        <div className="text-2xl font-black">جهاز المطعم</div>
        <div className="text-sm text-white/50 font-bold mt-1">أدخل كود هذا الجهاز من «الأجهزة والأكواد»</div>
      </div>
      <NumberPad length={6} busy={busy} error={error} onSubmit={onSubmit} />
      {onBack && <button type="button" onClick={onBack} className="text-sm font-bold text-white/60 hover:text-white underline cursor-pointer">الأجهزة المحفوظة في هذا المتصفح</button>}
    </div>
  </div>
);

// Shown when the address names no device and this browser already knows some: pick one, or add
// another. With a single known device it opens by itself after a few seconds, so a fixed screen
// opened from the plain link still starts on its own.
const DevicePicker: React.FC<{ known: [string, Remembered][]; onPick: (id: string) => void; onNew: () => void; onForget: (id: string) => void }> = ({ known, onPick, onNew, onForget }) => {
  const [left, setLeft] = useState(known.length === 1 ? 5 : 0);
  useEffect(() => {
    if (!left) return;
    const t = window.setTimeout(() => (left === 1 ? onPick(known[0][0]) : setLeft(left - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [left, known, onPick]);
  return (
    <div dir="rtl" className="fixed inset-0 bg-[#18191c] text-white flex items-center justify-center p-6 font-sans" onPointerDown={() => setLeft(0)}>
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <MonitorSmartphone size={44} className="mx-auto text-[#FF922B]" />
          <div className="text-2xl font-black mt-3">أي جهاز هذا؟</div>
          <div className="text-sm text-white/50 font-bold mt-1">أجهزة محفوظة في هذا المتصفح</div>
        </div>
        {known.map(([id, d]) => (
          <div key={id} className="flex items-center gap-2">
            <button type="button" onClick={() => onPick(id)} className="flex-1 min-w-0 text-right rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-3 cursor-pointer">
              <div className="font-black truncate">{d.name || 'جهاز'}</div>
              <div className="text-xs text-white/50 font-bold">{DEVICE_ROLES.find((r) => r.id === d.role)?.label || ''}</div>
            </button>
            <button type="button" onClick={() => onForget(id)} aria-label="إزالة من هذا المتصفح" className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 flex items-center justify-center cursor-pointer"><X size={16} /></button>
          </div>
        ))}
        <button type="button" onClick={onNew} className="w-full rounded-2xl border border-dashed border-white/30 hover:border-white/60 px-4 py-3 font-black cursor-pointer">+ جهاز آخر بكود جديد</button>
        {left > 0 && <div className="text-center text-sm text-white/50 font-bold">يفتح «{known[0][1].name}» بعد {left} ثوانٍ… المس الشاشة للإلغاء</div>}
      </div>
    </div>
  );
};

const KitchenDevice: React.FC<{ uid: string; device: StaffDevice; onLogout: () => void }> = ({ uid, device, onLogout }) => {
  const live = useLiveOrders(uid);
  const menu = usePublishedMenu(uid);
  return <KitchenBoard uid={uid} live={live} menu={menu} title={device.name} lockedStation={device.stationId || undefined} onLogout={onLogout} />;
};

const CashierDevice: React.FC<{ uid: string; device: StaffDevice; workers: Worker[]; onLogout: () => void }> = ({ uid, device, workers, onLogout }) => {
  const live = useLiveOrders(uid);
  const menu = usePublishedMenu(uid);
  return <PosScreen uid={uid} menu={menu} workers={workers} device={{ id: device.id, name: device.name }} live={live} deviceRole={device.role} onLogout={onLogout} />;
};

// Both screens stay mounted, so switching keeps the signed-in worker and the open bill, and the
// kitchen still rings for new orders while the cashier is shown.
const ComboDevice: React.FC<{ uid: string; device: StaffDevice; workers: Worker[]; onLogout: () => void }> = ({ uid, device, workers, onLogout }) => {
  const live = useLiveOrders(uid);
  const menu = usePublishedMenu(uid);
  const [view, setView] = useState<'pos' | 'kitchen'>('pos');
  const since = startOfToday();
  const waiting = live.items.filter((o) => o.status === 'new' && o.createdAt >= since).length;
  return (
    <>
      <div className={view === 'pos' ? '' : 'hidden'}>
        <PosScreen uid={uid} menu={menu} workers={workers} device={{ id: device.id, name: device.name }} live={live} deviceRole={device.role} onLogout={onLogout} kitchen={{ open: () => setView('kitchen'), waiting }} />
      </div>
      <div className={view === 'kitchen' ? '' : 'hidden'}>
        <KitchenBoard uid={uid} live={live} menu={menu} title={device.name} onLogout={onLogout} onSwitch={() => setView('pos')} />
      </div>
    </>
  );
};

const BoardDevice: React.FC<{ uid: string; onLogout: () => void }> = ({ uid, onLogout }) => {
  const live = useLiveOrders(uid);
  const menu = usePublishedMenu(uid, 120000);
  return <OrderBoard live={live} settings={menu?.settings || null} onLogout={onLogout} />;
};

const DisplayDevice: React.FC<{ uid: string; device: StaffDevice; onLogout: () => void }> = ({ uid, device, onLogout }) => {
  const menu = usePublishedMenu(uid);
  return <CustomerDisplay uid={uid} cashierId={device.displayFor} name={menu?.settings.name || ''} currency={menu?.settings.currency || ''} onLogout={onLogout} />;
};

export const DevicePage: React.FC<{ uid: string }> = ({ uid }) => {
  const [authReady, setAuthReady] = useState(false);
  const [device, setDevice] = useState<StaffDevice | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [known, setKnown] = useState<[string, Remembered][]>([]);
  const [picking, setPicking] = useState(false);

  // An owner signed in on this browser works with the owner's access; anyone else gets an anonymous sign-in.
  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setAuthReady(true);
          return;
        }
        loginAnonymously().catch(() => {
          setError('تسجيل الأجهزة غير مفعّل بعد في Firebase (Authentication ← Anonymous).');
          setBusy(false);
        });
      }),
    []
  );

  const refreshKnown = () => {
    const list = Object.entries(readAll(uid));
    setKnown(list);
    return list;
  };

  // `rememberedId` is the device this browser had saved under that code, or '' for a typed code.
  const check = async (code: string, rememberedId: string) => {
    setBusy(true);
    setError('');
    setPicking(false);
    try {
      let linked = true;
      try {
        await linkDevice(uid, code);
      } catch (e: any) {
        if (e?.code !== 'permission-denied') throw e;
        linked = false;
      }
      const staff = linked ? await loadStaff(uid) : { devices: [], workers: [] };
      const found = staff.devices.find((d) => d.code === code);
      if (found && found.active) {
        if (rememberedId && rememberedId !== found.id) forget(uid, rememberedId);
        remember(uid, found);
        setUrlDeviceId(found.id);
        setDevice(found);
        setWorkers(staff.workers);
      } else {
        if (rememberedId) forget(uid, rememberedId);
        setUrlDeviceId('');
        refreshKnown();
        setError(rememberedId ? 'تم إيقاف هذا الجهاز أو تغيير كوده. أدخل الكود الجديد.' : found ? 'هذا الجهاز موقوف من الإدارة.' : 'الكود غير صحيح.');
      }
    } catch (e) {
      console.warn('Could not check the device code:', e);
      setError('تعذر التحقق من الكود. تحقق من الإنترنت.');
    }
    setBusy(false);
  };

  const open = (id: string) => {
    const d = readAll(uid)[id];
    if (d) check(d.code, id);
  };

  useEffect(() => {
    if (!authReady) return;
    const legacy = takeLegacyCode(uid);
    if (legacy) {
      check(legacy, '');
      return;
    }
    const list = refreshKnown();
    const id = urlDeviceId();
    const mine = list.find(([k]) => k === id);
    if (mine) check(mine[1].code, mine[0]);
    else {
      if (id) setUrlDeviceId('');
      setPicking(list.length > 0);
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, uid]);

  // The owner may add workers, stop the device or change its code meanwhile: look again every minute.
  useEffect(() => {
    if (!device) return;
    const t = window.setInterval(async () => {
      try {
        const staff = await loadStaff(uid);
        const now = staff.devices.find((d) => d.id === device.id);
        if (!now || !now.active || now.code !== device.code) {
          forget(uid, device.id);
          setUrlDeviceId('');
          refreshKnown();
          setDevice(null);
          setError('تم إيقاف هذا الجهاز أو تغيير كوده. أدخل الكود الجديد.');
          return;
        }
        setWorkers(staff.workers);
        if (now.role !== device.role || now.stationId !== device.stationId || now.displayFor !== device.displayFor || now.name !== device.name) {
          remember(uid, now);
          setDevice(now);
        }
      } catch (e: any) {
        // The rules no longer accept this device's code (stopped, deleted or a new code).
        if (e?.code === 'permission-denied') {
          forget(uid, device.id);
          setUrlDeviceId('');
          refreshKnown();
          setDevice(null);
          setError('تم إيقاف هذا الجهاز أو تغيير كوده. أدخل الكود الجديد.');
        }
        // otherwise offline: keep working with what we have
      }
    }, 60000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, device]);

  const logout = () => {
    if (!device || !window.confirm('خروج هذا الجهاز من هذا المتصفح؟ سيُطلب الكود من جديد.')) return;
    forget(uid, device.id);
    setUrlDeviceId('');
    setDevice(null);
    setPicking(refreshKnown().length > 0);
  };

  if (!device) {
    if (picking && !busy && known.length > 0) {
      return (
        <DevicePicker
          known={known}
          onPick={open}
          onNew={() => setPicking(false)}
          onForget={(id) => {
            forget(uid, id);
            if (!refreshKnown().length) setPicking(false);
          }}
        />
      );
    }
    return <CodePad busy={busy} error={error} onSubmit={(c) => check(c, '')} onBack={known.length ? () => { setError(''); setPicking(true); } : undefined} />;
  }
  if (device.role === 'kitchen') return <KitchenDevice uid={uid} device={device} onLogout={logout} />;
  if (device.role === 'display') return <DisplayDevice uid={uid} device={device} onLogout={logout} />;
  if (device.role === 'board') return <BoardDevice uid={uid} onLogout={logout} />;
  if (device.role === 'combo') return <ComboDevice uid={uid} device={device} workers={workers} onLogout={logout} />;
  return <CashierDevice uid={uid} device={device} workers={workers} onLogout={logout} />;
};
