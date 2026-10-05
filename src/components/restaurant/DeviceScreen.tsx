// A restaurant device (?device=<uid>): a tablet or screen types its six-digit code once and from then
// on opens straight on its own screen. The code is checked against the owner's devices on every
// start, so a device that was stopped, deleted or given a new code drops back to the code pad.
// Kitchen devices show the kitchen screen (their section only, if they have one); the cashier,
// waiter and customer screens come next.
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Delete, Loader2, MonitorSmartphone, LogOut } from 'lucide-react';
import { auth } from '../../services/firebase';
import { DEVICE_ROLES, StaffDevice } from './restaurantTypes';
import { loadDevices, useLiveOrders } from './restaurantCloud';
import { KitchenBoard, usePublishedMenu } from './KitchenScreen';

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

const CodePad: React.FC<{ busy: boolean; error: string; onSubmit: (code: string) => void }> = ({ busy, error, onSubmit }) => {
  const [code, setCode] = useState('');
  const press = (d: string) => {
    if (busy) return;
    const next = (code + d).slice(0, 6);
    setCode(next);
    if (next.length === 6) onSubmit(next);
  };
  useEffect(() => {
    if (error) setCode('');
  }, [error]);
  return (
    <div dir="rtl" className="fixed inset-0 bg-[#18191c] text-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm text-center space-y-6">
        <MonitorSmartphone size={44} className="mx-auto text-[#FF922B]" />
        <div>
          <div className="text-2xl font-black">جهاز المطعم</div>
          <div className="text-sm text-white/50 font-bold mt-1">أدخل كود هذا الجهاز من «الأجهزة والأكواد»</div>
        </div>
        <div className="flex justify-center gap-2" dir="ltr">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={`w-11 h-14 rounded-xl text-2xl font-black flex items-center justify-center ${i < code.length ? 'bg-white text-[#18191c]' : 'bg-white/10'}`}>{code[i] ? '•' : ''}</span>
          ))}
        </div>
        <div className="h-5 text-sm font-bold text-[#FF8787]">{busy ? <Loader2 size={18} className="mx-auto animate-spin text-white/60" /> : error}</div>
        <div className="grid grid-cols-3 gap-3" dir="ltr">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" onClick={() => press(d)} className="h-16 rounded-2xl bg-white/10 text-2xl font-black cursor-pointer active:scale-95">{d}</button>
          ))}
          <span />
          <button type="button" onClick={() => press('0')} className="h-16 rounded-2xl bg-white/10 text-2xl font-black cursor-pointer active:scale-95">0</button>
          <button type="button" aria-label="مسح" onClick={() => setCode(code.slice(0, -1))} className="h-16 rounded-2xl bg-white/5 flex items-center justify-center cursor-pointer active:scale-95"><Delete size={24} /></button>
        </div>
      </div>
    </div>
  );
};

const KitchenDevice: React.FC<{ uid: string; device: StaffDevice; onLogout: () => void }> = ({ uid, device, onLogout }) => {
  const live = useLiveOrders(uid);
  const menu = usePublishedMenu(uid);
  return <KitchenBoard uid={uid} live={live} menu={menu} title={device.name} lockedStation={device.stationId || undefined} onLogout={onLogout} />;
};

const ComingSoon: React.FC<{ device: StaffDevice; onLogout: () => void }> = ({ device, onLogout }) => (
  <div dir="rtl" className="fixed inset-0 bg-[#18191c] text-white flex items-center justify-center p-6 font-sans text-center">
    <div className="space-y-3 max-w-md">
      <MonitorSmartphone size={44} className="mx-auto text-[#4DABF7]" />
      <div className="text-2xl font-black">{device.name}</div>
      <div className="text-base font-bold text-white/60">{DEVICE_ROLES.find((r) => r.id === device.role)?.label}: هذه الشاشة تأتي في الخطوة التالية. الجهاز مربوط وجاهز.</div>
      <button type="button" onClick={onLogout} className="h-11 px-4 rounded-xl bg-white/10 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"><LogOut size={16} /> خروج الجهاز</button>
    </div>
  </div>
);

export const DevicePage: React.FC<{ uid: string }> = ({ uid }) => {
  const [authReady, setAuthReady] = useState(false);
  const [device, setDevice] = useState<StaffDevice | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(auth, () => setAuthReady(true)), []);

  const check = async (code: string, remembered: boolean) => {
    setBusy(true);
    setError('');
    try {
      const found = (await loadDevices(uid)).find((d) => d.code === code);
      if (found && found.active) {
        saveCode(uid, code);
        setDevice(found);
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

  const logout = () => {
    if (!window.confirm('خروج هذا الجهاز؟ سيُطلب الكود من جديد.')) return;
    saveCode(uid, '');
    setDevice(null);
  };

  if (!device) return <CodePad busy={busy} error={error} onSubmit={(c) => check(c, false)} />;
  if (device.role === 'kitchen') return <KitchenDevice uid={uid} device={device} onLogout={logout} />;
  return <ComingSoon device={device} onLogout={logout} />;
};
