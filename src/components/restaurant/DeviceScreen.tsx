// A restaurant device (?device=<uid>): a tablet or screen types its six-digit code once and from then
// on opens straight on its own screen. The code is checked against the owner's devices on every
// start, so a device that was stopped, deleted or given a new code drops back to the code pad.
// Kitchen devices show the kitchen screen (their section only, if they have one); the cashier and the
// waiters' tablets the cashier program (each worker signs in with his PIN); the customer's screen
// follows the cashier device it is tied to.
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { MonitorSmartphone } from 'lucide-react';
import { auth } from '../../services/firebase';
import { StaffDevice } from './restaurantTypes';
import type { Worker } from './staffTypes';
import { loadStaff, useLiveOrders } from './restaurantCloud';
import { KitchenBoard, usePublishedMenu } from './KitchenScreen';
import { NumberPad } from './pos/NumberPad';
import { PosScreen } from './pos/PosScreen';
import { CustomerDisplay } from './pos/CustomerDisplay';

const storageKey = (uid: string) => `weelink_device_${uid}`;
const readCode = (uid: string) => {
  try {
    return localStorage.getItem(storageKey(uid)) || '';
  } catch {
    return '';
  }
};
const saveCode = (uid: string, code: string) => {
  try {
    if (code) localStorage.setItem(storageKey(uid), code);
    else localStorage.removeItem(storageKey(uid));
  } catch {
    // storage unavailable: the code is asked again next time
  }
};

const CodePad: React.FC<{ busy: boolean; error: string; onSubmit: (code: string) => void }> = ({ busy, error, onSubmit }) => (
  <div dir="rtl" className="fixed inset-0 bg-[#18191c] text-white flex items-center justify-center p-6 font-sans">
    <div className="w-full max-w-sm text-center space-y-6">
      <MonitorSmartphone size={44} className="mx-auto text-[#FF922B]" />
      <div>
        <div className="text-2xl font-black">جهاز المطعم</div>
        <div className="text-sm text-white/50 font-bold mt-1">أدخل كود هذا الجهاز من «الأجهزة والأكواد»</div>
      </div>
      <NumberPad length={6} busy={busy} error={error} onSubmit={onSubmit} />
    </div>
  </div>
);

const KitchenDevice: React.FC<{ uid: string; device: StaffDevice; onLogout: () => void }> = ({ uid, device, onLogout }) => {
  const live = useLiveOrders(uid);
  const menu = usePublishedMenu(uid);
  return <KitchenBoard uid={uid} live={live} menu={menu} title={device.name} lockedStation={device.stationId || undefined} onLogout={onLogout} />;
};

const CashierDevice: React.FC<{ uid: string; device: StaffDevice; workers: Worker[]; onLogout: () => void }> = ({ uid, device, workers, onLogout }) => {
  const live = useLiveOrders(uid);
  const menu = usePublishedMenu(uid);
  return <PosScreen uid={uid} menu={menu} workers={workers} device={{ id: device.id, name: device.name }} live={live} onLogout={onLogout} />;
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

  useEffect(() => onAuthStateChanged(auth, () => setAuthReady(true)), []);

  const check = async (code: string, remembered: boolean) => {
    setBusy(true);
    setError('');
    try {
      const staff = await loadStaff(uid);
      const found = staff.devices.find((d) => d.code === code);
      if (found && found.active) {
        saveCode(uid, code);
        setDevice(found);
        setWorkers(staff.workers);
      } else {
        saveCode(uid, '');
        setError(remembered ? 'تم إيقاف هذا الجهاز أو تغيير كوده. أدخل الكود الجديد.' : found ? 'هذا الجهاز موقوف من الإدارة.' : 'الكود غير صحيح.');
      }
    } catch (e) {
      console.warn('Could not check the device code:', e);
      setError('تعذر التحقق من الكود. تحقق من الإنترنت.');
    }
    setBusy(false);
  };

  useEffect(() => {
    if (!authReady) return;
    const saved = readCode(uid);
    if (saved) check(saved, true);
    else setBusy(false);
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
          saveCode(uid, '');
          setDevice(null);
          setError('تم إيقاف هذا الجهاز أو تغيير كوده. أدخل الكود الجديد.');
          return;
        }
        setWorkers(staff.workers);
        if (now.role !== device.role || now.stationId !== device.stationId || now.displayFor !== device.displayFor || now.name !== device.name) setDevice(now);
      } catch {
        // offline: keep working with what we have
      }
    }, 60000);
    return () => window.clearInterval(t);
  }, [uid, device]);

  const logout = () => {
    if (!window.confirm('خروج هذا الجهاز؟ سيُطلب الكود من جديد.')) return;
    saveCode(uid, '');
    setDevice(null);
  };

  if (!device) return <CodePad busy={busy} error={error} onSubmit={(c) => check(c, false)} />;
  if (device.role === 'kitchen') return <KitchenDevice uid={uid} device={device} onLogout={logout} />;
  if (device.role === 'display') return <DisplayDevice uid={uid} device={device} onLogout={logout} />;
  return <CashierDevice uid={uid} device={device} workers={workers} onLogout={logout} />;
};
