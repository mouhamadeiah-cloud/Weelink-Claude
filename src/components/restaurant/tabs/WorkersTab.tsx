// العمال والصناديق: the workers with their PINs and roles, and what the manager follows live: the money
// each worker and each device took today (by method), the open tables, every worker's till with the
// cash he should have and the cash he counted, and the log of cancelled dishes, discounts and reopened
// bills with the manager who allowed them.
import React, { useMemo, useState } from 'react';
import { Plus, Trash2, RefreshCw, Power, UserRound, MonitorSmartphone } from 'lucide-react';
import { CASH, Worker, WorkerRole, WORKER_ROLES, byMethod, newWorkerPin, startOfToday, tabTotals } from '../staffTypes';
import { useClosedTabs, useLog, useOpenTabs, useShifts } from '../staffCloud';
import { newId } from '../../shop/shopTypes';
import { Card, Field, inputClass, PrimaryButton, EmptyState, formatMoney } from '../../shop/adminUi';
import { RestaurantTabProps, CloudNotice } from './shared';

const selectClass = 'h-10 px-3 rounded-xl border border-neutral-200 bg-white text-sm font-bold';
const time = (iso: string) => (iso ? new Date(iso).toLocaleString('ar-SY-u-nu-latn', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export const WorkersTab: React.FC<RestaurantTabProps> = ({ data, update, ownerUid }) => {
  const [draft, setDraft] = useState<{ name: string; phone: string; role: WorkerRole }>({ name: '', phone: '', role: 'waiter' });
  const today = useMemo(() => startOfToday(), []);
  const openTabs = useOpenTabs(ownerUid);
  const closedTabs = useClosedTabs(ownerUid, today);
  const shifts = useShifts(ownerUid, 60);
  const log = useLog(ownerUid, 100);
  const money = (n: number) => formatMoney(n, data.settings.currency);

  const patch = (id: string, p: Partial<Worker>) => update((d) => ({ ...d, workers: d.workers.map((w) => (w.id === id ? { ...w, ...p } : w)) }));
  const add = () => {
    const name = draft.name.trim();
    if (!name) return;
    update((d) => ({ ...d, workers: [...d.workers, { id: newId('wrk'), name, phone: draft.phone.trim(), role: draft.role, pin: newWorkerPin(d.workers), active: true, createdAt: new Date().toISOString() }] }));
    setDraft({ ...draft, name: '', phone: '' });
  };
  const remove = (w: Worker) => window.confirm(`حذف ${w.name}؟ حساباته السابقة تبقى في السجلات.`) && update((d) => ({ ...d, workers: d.workers.filter((x) => x.id !== w.id) }));

  // Today's payments: those of the bills closed today and of the open ones.
  const payments = useMemo(
    () => [...openTabs.items, ...closedTabs.items].flatMap((t) => t.payments).filter((p) => p.at >= today),
    [openTabs.items, closedTabs.items, today]
  );
  const total = payments.reduce((s, p) => s + p.amount, 0);
  const groups = (key: 'workerName' | 'deviceName') => {
    const m = new Map<string, typeof payments>();
    payments.forEach((p) => m.set(p[key] || '—', [...(m.get(p[key] || '—') || []), p]));
    return [...m.entries()].map(([name, ps]) => ({ name, total: ps.reduce((s, p) => s + p.amount, 0), methods: byMethod(ps), count: ps.length })).sort((a, b) => b.total - a.total);
  };
  const shiftCash = (id: string) => [...openTabs.items, ...closedTabs.items].flatMap((t) => t.payments).filter((p) => p.shiftId === id && p.method === CASH).reduce((s, p) => s + p.amount, 0);
  const error = openTabs.error || closedTabs.error || shifts.error;

  return (
    <div className="space-y-4">
      <CloudNotice error={error} />

      <Card title="عامل جديد">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[150px]"><Field label="الاسم"><input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="مثلاً: أحمد" /></Field></div>
          <div className="w-44"><Field label="الهاتف"><input className={inputClass} dir="ltr" inputMode="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field></div>
          <Field label="عمله">
            <select className={selectClass} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as WorkerRole })}>
              {WORKER_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </Field>
          <PrimaryButton onClick={add} disabled={!draft.name.trim()}><span className="inline-flex items-center gap-1"><Plus size={14} /> أضف وأنشئ رقمه السري</span></PrimaryButton>
        </div>
        <p className="text-[11px] text-neutral-400">{WORKER_ROLES.find((r) => r.id === draft.role)?.hint} يدخل العامل برقمه على جهاز الكاشير أو التابلت، فيُفتح صندوقه باسمه.</p>
      </Card>

      <Card title={`العمال (${data.workers.length})`}>
        {data.workers.length === 0 ? (
          <EmptyState text="لا يوجد عمال بعد. أضف أول عامل من الأعلى، وأضف مديرًا لتصبح عمليات الإلغاء والخصم بموافقته." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.workers.map((w) => (
              <div key={w.id} className={`p-3 rounded-2xl border space-y-2 ${w.active ? 'bg-white border-neutral-200' : 'bg-neutral-50 border-neutral-200 opacity-70'}`}>
                <div className="flex items-center gap-2">
                  <UserRound size={18} className={w.role === 'manager' ? 'text-[#C2255C]' : 'text-[#0071e3]'} />
                  <input className="flex-1 min-w-0 h-8 px-2 rounded-lg border border-transparent hover:border-neutral-200 text-sm font-black bg-transparent" value={w.name} onChange={(e) => patch(w.id, { name: e.target.value })} aria-label="اسم العامل" />
                  <span className={`h-6 px-2 rounded-full text-[10px] font-black inline-flex items-center ${w.active ? 'bg-[#EBFBEE] text-[#2F9E44]' : 'bg-neutral-200 text-neutral-500'}`}>{w.active ? 'يعمل' : 'موقوف'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select className="h-8 px-2 rounded-lg border border-neutral-200 bg-white text-xs font-bold" value={w.role} onChange={(e) => patch(w.id, { role: e.target.value as WorkerRole })}>
                    {WORKER_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <input className="flex-1 min-w-[120px] h-8 px-2 rounded-lg border border-neutral-200 text-xs font-bold" dir="ltr" inputMode="tel" placeholder="الهاتف" value={w.phone} onChange={(e) => patch(w.id, { phone: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-neutral-400">الرقم السري</span>
                  <span className="text-2xl font-black tracking-[0.3em] text-[#1d1d1f]" dir="ltr">{w.pin}</span>
                  <div className="mr-auto flex gap-1">
                    <button type="button" title="رقم جديد" onClick={() => window.confirm(`رقم سري جديد لـ ${w.name}؟`) && patch(w.id, { pin: newWorkerPin(data.workers) })} className="w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer"><RefreshCw size={14} /></button>
                    <button type="button" title={w.active ? 'إيقاف' : 'تشغيل'} onClick={() => patch(w.id, { active: !w.active })} className="w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer"><Power size={14} /></button>
                    <button type="button" title="حذف" onClick={() => remove(w)} className="w-8 h-8 rounded-lg hover:bg-red-50 text-[#E03131] flex items-center justify-center cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-neutral-400 leading-relaxed">الأجهزة تقرأ قائمة العمال كل دقيقة، فالعامل الجديد أو الرقم الجديد يعمل بعد دقيقة على الأكثر.</p>
      </Card>

      <Card title={`حركة اليوم · ${money(total)}`}>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          {byMethod(payments).map((m) => <span key={m.method} className="h-8 px-3 rounded-full bg-neutral-100 inline-flex items-center gap-1.5">{m.method} <b>{money(m.amount)}</b></span>)}
          <span className="h-8 px-3 rounded-full bg-[#FFF4E6] text-[#D9480F] inline-flex items-center">{openTabs.items.length} طاولة مفتوحة · {money(openTabs.items.reduce((s, t) => s + tabTotals(t).due, 0))} غير محصّل</span>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {(['workerName', 'deviceName'] as const).map((key) => (
            <div key={key} className="space-y-2">
              <div className="text-xs font-black text-neutral-500 inline-flex items-center gap-1.5">{key === 'workerName' ? <><UserRound size={14} /> حسب العامل</> : <><MonitorSmartphone size={14} /> حسب الجهاز</>}</div>
              {groups(key).length === 0 && <div className="text-xs text-neutral-400 font-bold">لا توجد تحصيلات اليوم.</div>}
              {groups(key).map((g) => (
                <div key={g.name} className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center justify-between text-sm font-black"><span>{g.name}</span><span>{money(g.total)}</span></div>
                  <div className="text-[11px] font-bold text-neutral-500 mt-0.5">{g.methods.map((m) => `${m.method} ${money(m.amount)}`).join(' · ')} · {g.count} دفعة</div>
                  {key === 'workerName' && <div className="text-[11px] font-bold text-[#D9480F]">{openTabs.items.filter((t) => t.ownerName === g.name).length || ''}{openTabs.items.some((t) => t.ownerName === g.name) ? ' طاولة مفتوحة' : ''}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Card title="الصناديق">
        {shifts.items.length === 0 ? (
          <EmptyState text="يُفتح صندوق العامل عند أول دخول له برقمه السري." />
        ) : (
          <div className="space-y-2">
            {shifts.items.map((s) => {
              const expected = s.closedAt ? s.expectedCash : shiftCash(s.id);
              const diff = Math.round((s.counted - expected) * 100) / 100;
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-neutral-200 text-xs font-bold">
                  <span className="text-sm font-black min-w-[90px]">{s.workerName}</span>
                  <span className="text-neutral-500">{s.deviceName} · {time(s.openedAt)}{s.closedAt ? ` ← ${time(s.closedAt)}` : ''}</span>
                  <span className="mr-auto">النقد المتوقع {money(expected)}</span>
                  {s.closedAt ? (
                    <span className={`h-7 px-2.5 rounded-full inline-flex items-center ${diff === 0 ? 'bg-[#EBFBEE] text-[#2F9E44]' : 'bg-[#FFF5F5] text-[#E03131]'}`}>سلّم {money(s.counted)}{diff ? ` · ${diff > 0 ? 'زيادة' : 'نقص'} ${money(Math.abs(diff))}` : ' · مطابق'}</span>
                  ) : (
                    <span className="h-7 px-2.5 rounded-full bg-[#E7F5FF] text-[#1971C2] inline-flex items-center">مفتوح</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="سجل العمليات">
        {log.items.length === 0 ? (
          <EmptyState text="هنا تظهر الأصناف الملغاة بعد إرسالها، والخصومات، والفواتير المعاد فتحها، ومن وافق عليها." />
        ) : (
          <div className="space-y-1.5">
            {log.items.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-neutral-50 text-xs font-bold">
                <span className="h-6 px-2 rounded-full bg-[#1d1d1f] text-white inline-flex items-center">{e.action}</span>
                <span className="flex-1 min-w-[160px]">{e.detail}</span>
                <span className="text-neutral-500">{e.workerName}{e.approvedBy && e.approvedBy !== e.workerName ? ` · بموافقة ${e.approvedBy}` : ''} · {e.deviceName} · {time(e.at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
