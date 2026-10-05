// الأجهزة والأكواد: the kitchen's sections (which menu catalog each one prepares) and the restaurant's
// tablets and screens. Every device gets a six-digit code; the device opens the devices' address
// once, types its code and from then on shows only its own screen (a kitchen screen for all the
// sections or one, the cashier, a waiter's tablet, the customer's screen).
import React, { useState } from 'react';
import { Plus, Trash2, RefreshCw, Power, Copy, Check, MonitorSmartphone, ChefHat } from 'lucide-react';
import { DEVICE_ROLES, DeviceRole, KitchenStation, STATION_COLORS, StaffDevice, newDeviceCode } from '../restaurantTypes';
import { deviceUrl } from '../restaurantCloud';
import { newId } from '../../shop/shopTypes';
import { Card, Field, inputClass, PrimaryButton, GhostButton, EmptyState } from '../../shop/adminUi';
import { RestaurantTabProps } from './shared';

const selectClass = 'h-10 px-3 rounded-xl border border-neutral-200 bg-white text-sm font-bold';

const CopyLink: React.FC<{ url: string }> = ({ url }) => {
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="flex-1 min-w-[220px] h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center overflow-x-auto whitespace-nowrap" dir="ltr">{url}</code>
      <GhostButton
        className="h-10"
        onClick={() => navigator.clipboard?.writeText(url).then(() => { setDone(true); window.setTimeout(() => setDone(false), 1500); }).catch(() => {})}
      >
        <span className="inline-flex items-center gap-1">{done ? <Check size={14} /> : <Copy size={14} />}{done ? 'نُسخ' : 'نسخ'}</span>
      </GhostButton>
    </div>
  );
};

export const DevicesTab: React.FC<RestaurantTabProps> = ({ data, update, ownerUid }) => {
  const [stationName, setStationName] = useState('');
  const [draft, setDraft] = useState<{ name: string; role: DeviceRole; stationId: string }>({ name: '', role: 'kitchen', stationId: '' });
  const stations = data.stations;

  const setStations = (fn: (s: KitchenStation[]) => KitchenStation[]) => update((d) => ({ ...d, stations: fn(d.stations) }));
  const patchStation = (id: string, p: Partial<KitchenStation>) => setStations((ss) => ss.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const addStation = () => {
    const name = stationName.trim();
    if (!name) return;
    setStations((ss) => [...ss, { id: newId('st'), name, color: STATION_COLORS[ss.length % STATION_COLORS.length] }]);
    setStationName('');
  };
  const removeStation = (s: KitchenStation) => {
    if (stations.length <= 1 || !window.confirm(`حذف قسم «${s.name}»؟ أقسام المنيو التابعة له تنتقل إلى القسم الأول.`)) return;
    update((d) => ({
      ...d,
      stations: d.stations.filter((x) => x.id !== s.id),
      categories: d.categories.map((c) => (c.stationId === s.id ? { ...c, stationId: '' } : c)),
      devices: d.devices.map((v) => (v.stationId === s.id ? { ...v, stationId: '' } : v)),
    }));
  };
  const setCategoryStation = (catId: string, stationId: string) =>
    update((d) => ({ ...d, categories: d.categories.map((c) => (c.id === catId ? { ...c, stationId } : c)) }));

  const patchDevice = (id: string, p: Partial<StaffDevice>) => update((d) => ({ ...d, devices: d.devices.map((v) => (v.id === id ? { ...v, ...p } : v)) }));
  const addDevice = () => {
    const name = draft.name.trim() || DEVICE_ROLES.find((r) => r.id === draft.role)!.label;
    update((d) => ({
      ...d,
      devices: [...d.devices, { id: newId('dev'), name, role: draft.role, stationId: draft.role === 'kitchen' ? draft.stationId : '', code: newDeviceCode(d.devices), active: true, createdAt: new Date().toISOString() }],
    }));
    setDraft({ ...draft, name: '' });
  };
  const removeDevice = (v: StaffDevice) => {
    if (!window.confirm(`حذف «${v.name}»؟ لن يفتح كوده بعد الآن.`)) return;
    update((d) => ({ ...d, devices: d.devices.filter((x) => x.id !== v.id) }));
  };
  const firstStation = stations[0]?.id || '';
  const stationOf = (id: string) => stations.find((s) => s.id === id);

  return (
    <div className="space-y-4">
      <Card title="أقسام المطبخ">
        <p className="text-xs text-neutral-500 leading-relaxed">كل قسم في المنيو يُحضَّر في قسم من المطبخ. شاشة المطبخ تعرض كل الأقسام أو قسمًا واحدًا، فيرى الشوّاء المشاوي فقط ويرى البار المشروبات فقط.</p>
        <div className="space-y-2">
          {stations.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2">
              <span className="w-4 h-4 rounded-full shrink-0" style={{ background: s.color }} />
              <input className={`${inputClass} flex-1 min-w-[160px] font-bold`} value={s.name} onChange={(e) => patchStation(s.id, { name: e.target.value })} aria-label="اسم القسم" />
              <div className="flex gap-1">
                {STATION_COLORS.map((c) => (
                  <button key={c} type="button" aria-label="لون" onClick={() => patchStation(s.id, { color: c })} className={`w-6 h-6 rounded-full cursor-pointer ${s.color === c ? 'ring-2 ring-offset-2 ring-neutral-800' : ''}`} style={{ background: c }} />
                ))}
              </div>
              <button type="button" aria-label="حذف القسم" disabled={stations.length <= 1} onClick={() => removeStation(s)} className="w-9 h-9 rounded-xl text-[#E03131] hover:bg-red-50 flex items-center justify-center cursor-pointer disabled:opacity-25"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[180px]"><Field label="قسم جديد"><input className={inputClass} placeholder="مثلاً: المشاوي، الحلويات" value={stationName} onChange={(e) => setStationName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addStation()} /></Field></div>
          <GhostButton onClick={addStation} disabled={!stationName.trim()}><span className="inline-flex items-center gap-1"><Plus size={14} /> أضف</span></GhostButton>
        </div>
        {data.categories.length > 0 && (
          <Field label="من يحضّر كل قسم من المنيو؟">
            <div className="grid sm:grid-cols-2 gap-2">
              {data.categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-bold">
                  <span className="text-lg">{c.icon || '🍽️'}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <select className={selectClass} value={stationOf(c.stationId) ? c.stationId : firstStation} onChange={(e) => setCategoryStation(c.id, e.target.value)}>
                    {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </Field>
        )}
      </Card>

      <Card title="جهاز جديد">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[160px]"><Field label="اسم الجهاز"><input className={inputClass} placeholder="مثلاً: تابلت الصالة، شاشة المشاوي" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field></div>
          <Field label="عمله">
            <select className={selectClass} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as DeviceRole })}>
              {DEVICE_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </Field>
          {draft.role === 'kitchen' && (
            <Field label="الأقسام">
              <select className={selectClass} value={draft.stationId} onChange={(e) => setDraft({ ...draft, stationId: e.target.value })}>
                <option value="">كل الأقسام</option>
                {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          )}
          <PrimaryButton onClick={addDevice}><span className="inline-flex items-center gap-1"><Plus size={14} /> أضف الجهاز وأنشئ كوده</span></PrimaryButton>
        </div>
        <p className="text-[11px] text-neutral-400">{DEVICE_ROLES.find((r) => r.id === draft.role)?.hint}</p>
      </Card>

      <Card title={`الأجهزة (${data.devices.length})`}>
        <Field label="افتح هذا الرابط على كل جهاز مرة واحدة، ثم أدخل كوده" hint="يتذكر الجهاز كوده، ويعرض شاشته فقط. إذا ضاع جهاز أوقفه أو غيّر كوده من هنا.">
          <CopyLink url={deviceUrl(ownerUid)} />
        </Field>
        {data.devices.length === 0 ? (
          <EmptyState text="لا توجد أجهزة بعد. أضف شاشة المطبخ أو تابلت الكاشير من الأعلى." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.devices.map((v) => {
              const st = stationOf(v.stationId);
              return (
                <div key={v.id} className={`p-3 rounded-2xl border space-y-2 ${v.active ? 'bg-white border-neutral-200' : 'bg-neutral-50 border-neutral-200 opacity-70'}`}>
                  <div className="flex items-center gap-2">
                    {v.role === 'kitchen' ? <ChefHat size={18} className="text-[#E8590C]" /> : <MonitorSmartphone size={18} className="text-[#0071e3]" />}
                    <input className="flex-1 min-w-0 h-8 px-2 rounded-lg border border-transparent hover:border-neutral-200 text-sm font-black bg-transparent" value={v.name} onChange={(e) => patchDevice(v.id, { name: e.target.value })} aria-label="اسم الجهاز" />
                    <span className={`h-6 px-2 rounded-full text-[10px] font-black inline-flex items-center ${v.active ? 'bg-[#EBFBEE] text-[#2F9E44]' : 'bg-neutral-200 text-neutral-500'}`}>{v.active ? 'يعمل' : 'موقوف'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-neutral-500">
                    <select className="h-8 px-2 rounded-lg border border-neutral-200 bg-white text-xs font-bold" value={v.role} onChange={(e) => patchDevice(v.id, { role: e.target.value as DeviceRole })}>
                      {DEVICE_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                    {v.role === 'kitchen' && (
                      <select className="h-8 px-2 rounded-lg border border-neutral-200 bg-white text-xs font-bold" value={st ? v.stationId : ''} onChange={(e) => patchDevice(v.id, { stationId: e.target.value })}>
                        <option value="">كل الأقسام</option>
                        {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-neutral-400">الكود</span>
                    <span className="text-2xl font-black tracking-[0.25em] text-[#1d1d1f]" dir="ltr">{v.code}</span>
                    <div className="mr-auto flex gap-1">
                      <button type="button" title="كود جديد" onClick={() => window.confirm('إنشاء كود جديد؟ الكود القديم يتوقف فورًا.') && patchDevice(v.id, { code: newDeviceCode(data.devices) })} className="w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer"><RefreshCw size={14} /></button>
                      <button type="button" title={v.active ? 'إيقاف الجهاز' : 'تشغيل الجهاز'} onClick={() => patchDevice(v.id, { active: !v.active })} className="w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer"><Power size={14} /></button>
                      <button type="button" title="حذف" onClick={() => removeDevice(v)} className="w-8 h-8 rounded-lg hover:bg-red-50 text-[#E03131] flex items-center justify-center cursor-pointer"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-neutral-400 leading-relaxed">مرحلة تجربة: الكود يفتح شاشة الجهاز الآن، والحماية الكاملة لكل جهاز تأتي مع فصل مستويات الدخول.</p>
      </Card>
    </div>
  );
};
