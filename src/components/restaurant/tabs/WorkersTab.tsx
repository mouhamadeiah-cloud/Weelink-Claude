// العمال والصناديق: the workers with their PINs and roles, and what the manager follows live for a day
// he picks among the last seven: the money each worker and each device took (by method), the open
// tables, each worker's sessions (every sign-in until he locked the device: what he took, opened and
// added, and the bills he left open), every till with the cash he should have and the cash he counted,
// and the log of cancelled dishes, discounts and reopened bills with the manager who allowed them.
import React, { useMemo, useState } from 'react';
import { Plus, Trash2, RefreshCw, Power, UserRound, MonitorSmartphone, CalendarDays, LogIn } from 'lucide-react';
import { CASH, Tab, Worker, WorkerRole, WorkerSession, WORKER_ROLES, byMethod, dayRange, newWorkerPin, tabTitle, tabTotals } from '../staffTypes';
import { useClosedTabs, useLog, useOpenTabs, useSessions, useShifts } from '../staffCloud';
import { newId } from '../../shop/shopTypes';
import { Card, Field, inputClass, PrimaryButton, EmptyState, formatMoney } from '../../shop/adminUi';
import { RestaurantTabProps, CloudNotice } from './shared';

const selectClass = 'h-10 px-3 rounded-xl border border-neutral-200 bg-white text-sm font-bold';
const time = (iso: string) => (iso ? new Date(iso).toLocaleString('ar-SY-u-nu-latn', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const clock = (iso: string) => (iso ? new Date(iso).toLocaleTimeString('ar-SY-u-nu-latn', { hour: '2-digit', minute: '2-digit' }) : '');
const DAYS = 7;
const dayLabel = (back: number) => {
  const { date } = dayRange(back);
  const d = date.toLocaleDateString('ar-SY-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
  return back === 0 ? `اليوم · ${d}` : back === 1 ? `أمس · ${d}` : d;
};
const within = (iso: string, from: string, to: string) => !!iso && iso >= from && iso < to;

export const WorkersTab: React.FC<RestaurantTabProps> = ({ data, update, ownerUid }) => {
  const [draft, setDraft] = useState<{ name: string; phone: string; role: WorkerRole }>({ name: '', phone: '', role: 'waiter' });
  const [back, setBack] = useState(0);
  const week = useMemo(() => dayRange(DAYS - 1).start, []);
  const { start: dayStart, end: dayEnd } = useMemo(() => dayRange(back), [back]);
  const isToday = back === 0;
  const openTabs = useOpenTabs(ownerUid);
  const closedTabs = useClosedTabs(ownerUid, week);
  const shifts = useShifts(ownerUid, 300);
  const log = useLog(ownerUid, 1000);
  const sessions = useSessions(ownerUid, week);
  const money = (n: number) => formatMoney(n, data.settings.currency);

  const patch = (id: string, p: Partial<Worker>) => update((d) => ({ ...d, workers: d.workers.map((w) => (w.id === id ? { ...w, ...p } : w)) }));
  const add = () => {
    const name = draft.name.trim();
    if (!name) return;
    update((d) => ({ ...d, workers: [...d.workers, { id: newId('wrk'), name, phone: draft.phone.trim(), role: draft.role, pin: newWorkerPin(d.workers), active: true, createdAt: new Date().toISOString() }] }));
    setDraft({ ...draft, name: '', phone: '' });
  };
  const remove = (w: Worker) => window.confirm(`حذف ${w.name}؟ حساباته السابقة تبقى في السجلات.`) && update((d) => ({ ...d, workers: d.workers.filter((x) => x.id !== w.id) }));

  // The day's payments: those of the bills closed since then and of the open ones.
  const allTabs: Tab[] = useMemo(() => [...openTabs.items, ...closedTabs.items], [openTabs.items, closedTabs.items]);
  const payments = useMemo(() => allTabs.flatMap((t) => t.payments).filter((p) => within(p.at, dayStart, dayEnd)), [allTabs, dayStart, dayEnd]);
  const dayShifts = shifts.items.filter((s) => s.openedAt < dayEnd && (!s.closedAt || s.closedAt >= dayStart));
  const dayLog = log.items.filter((e) => within(e.at, dayStart, dayEnd));

  // The day's sessions by worker, oldest first. A session closed without locking (the page was
  // closed, or the power went) is taken to end where the worker's next session starts.
  const daySessions = sessions.items.filter((x) => within(x.startedAt, dayStart, dayEnd)).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const sessionEnd = (x: WorkerSession) => {
    if (x.endedAt) return x.endedAt;
    const next = sessions.items.filter((y) => y.workerId === x.workerId && y.startedAt > x.startedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt))[0];
    return next ? next.startedAt : isToday ? new Date().toISOString() : dayEnd;
  };
  const sessionWork = (x: WorkerSession) => {
    const to = sessionEnd(x);
    const paid = allTabs.flatMap((t) => t.payments).filter((p) => p.workerId === x.workerId && within(p.at, x.startedAt, to));
    const opened = allTabs.filter((t) => t.ownerId === x.workerId && within(t.openedAt, x.startedAt, to));
    const dishes = allTabs.flatMap((t) => t.items).filter((i) => i.addedBy === x.workerName && within(i.addedAt, x.startedAt, to)).reduce((n, i) => n + i.qty, 0);
    // Still signed in: the bills he has open now.
    const left = x.endedAt
      ? x.openAtEnd
      : openTabs.items.filter((t) => t.ownerId === x.workerId).map((t) => ({ title: tabTitle(t), total: tabTotals(t).total, due: tabTotals(t).due }));
    return { paid, total: paid.reduce((n, p) => n + p.amount, 0), opened, dishes, left };
  };
  const sessionWorkers = [...new Set(daySessions.map((x) => x.workerId))].map((id) => ({ id, name: daySessions.find((x) => x.workerId === id)!.workerName, list: daySessions.filter((x) => x.workerId === id) }));
  const total = payments.reduce((s, p) => s + p.amount, 0);
  const groups = (key: 'workerName' | 'deviceName') => {
    const m = new Map<string, typeof payments>();
    payments.forEach((p) => m.set(p[key] || '—', [...(m.get(p[key] || '—') || []), p]));
    return [...m.entries()].map(([name, ps]) => ({ name, total: ps.reduce((s, p) => s + p.amount, 0), methods: byMethod(ps), count: ps.length })).sort((a, b) => b.total - a.total);
  };
  const shiftCash = (id: string) => allTabs.flatMap((t) => t.payments).filter((p) => p.shiftId === id && p.method === CASH).reduce((s, p) => s + p.amount, 0);
  const error = openTabs.error || closedTabs.error || shifts.error || sessions.error;

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

      <div className="sticky -top-3 sm:-top-6 z-10 -mx-1 px-1 py-2 bg-[#f5f5f7] flex flex-wrap items-center gap-2">
        <CalendarDays size={18} className="text-neutral-500" />
        <span className="text-sm font-black">الحركة ليوم</span>
        <select className={selectClass} value={back} onChange={(e) => setBack(Number(e.target.value))} aria-label="اليوم">
          {Array.from({ length: DAYS }, (_, i) => <option key={i} value={i}>{dayLabel(i)}</option>)}
        </select>
        <span className="text-[11px] font-bold text-neutral-400">آخر {DAYS} أيام</span>
      </div>

      <Card title={`حركة ${isToday ? 'اليوم' : dayLabel(back)} · ${money(total)}`}>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          {byMethod(payments).map((m) => <span key={m.method} className="h-8 px-3 rounded-full bg-neutral-100 inline-flex items-center gap-1.5">{m.method} <b>{money(m.amount)}</b></span>)}
          {isToday && <span className="h-8 px-3 rounded-full bg-[#FFF4E6] text-[#D9480F] inline-flex items-center">{openTabs.items.length} طاولة مفتوحة · {money(openTabs.items.reduce((s, t) => s + tabTotals(t).due, 0))} غير محصّل</span>}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {(['workerName', 'deviceName'] as const).map((key) => (
            <div key={key} className="space-y-2">
              <div className="text-xs font-black text-neutral-500 inline-flex items-center gap-1.5">{key === 'workerName' ? <><UserRound size={14} /> حسب العامل</> : <><MonitorSmartphone size={14} /> حسب الجهاز</>}</div>
              {groups(key).length === 0 && <div className="text-xs text-neutral-400 font-bold">لا توجد تحصيلات في هذا اليوم.</div>}
              {groups(key).map((g) => (
                <div key={g.name} className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center justify-between text-sm font-black"><span>{g.name}</span><span>{money(g.total)}</span></div>
                  <div className="text-[11px] font-bold text-neutral-500 mt-0.5">{g.methods.map((m) => `${m.method} ${money(m.amount)}`).join(' · ')} · {g.count} دفعة</div>
                  {key === 'workerName' && isToday && <div className="text-[11px] font-bold text-[#D9480F]">{openTabs.items.filter((t) => t.ownerName === g.name).length || ''}{openTabs.items.some((t) => t.ownerName === g.name) ? ' طاولة مفتوحة' : ''}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Card title={`الجلسات (${daySessions.length})`}>
        {daySessions.length === 0 ? (
          <EmptyState text="كل دخول للعامل برقمه السري جلسة، حتى يقفل الجهاز. لا توجد جلسات في هذا اليوم." />
        ) : (
          <div className="space-y-4">
            {sessionWorkers.map((g) => (
              <div key={g.id} className="space-y-2">
                <div className="text-sm font-black inline-flex items-center gap-1.5"><UserRound size={15} /> {g.name} <span className="h-6 px-2 rounded-full bg-neutral-100 text-[11px] inline-flex items-center">{g.list.length === 1 ? 'جلسة واحدة' : g.list.length === 2 ? 'جلستان' : `${g.list.length} ${g.list.length <= 10 ? 'جلسات' : 'جلسة'}`}</span></div>
                {g.list.map((x, n) => {
                  const w = sessionWork(x);
                  const live = !x.endedAt && isToday && !sessions.items.some((y) => y.workerId === x.workerId && y.startedAt > x.startedAt);
                  return (
                    <div key={x.id} className="p-3 rounded-2xl border border-neutral-200 bg-white space-y-1.5 text-xs font-bold">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#1d1d1f] text-white text-[11px] font-black inline-flex items-center justify-center">{n + 1}</span>
                        <LogIn size={14} className="text-neutral-400" />
                        <span className="text-sm font-black tabular-nums">من {clock(x.startedAt)} {live ? 'حتى الآن' : `إلى ${clock(x.endedAt || sessionEnd(x))}`}</span>
                        <span className="text-neutral-500">{x.deviceName}</span>
                        <span className={`mr-auto h-6 px-2 rounded-full inline-flex items-center ${live ? 'bg-[#EBFBEE] text-[#2F9E44]' : x.endedAt ? 'bg-neutral-100 text-neutral-600' : 'bg-[#FFF4E6] text-[#D9480F]'}`}>{live ? 'داخل الآن' : x.endReason || 'خرج بدون قفل'}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-neutral-600">
                        <span>حصّل <b className="text-[#1d1d1f]">{money(w.total)}</b>{w.paid.length ? ` (${w.paid.length} دفعة${byMethod(w.paid).length > 1 ? ': ' + byMethod(w.paid).map((m) => `${m.method} ${money(m.amount)}`).join('، ') : ''})` : ''}</span>
                        <span>فتح {w.opened.length} {w.opened.length === 1 ? 'طاولة' : 'طاولات'}</span>
                        <span>أضاف {w.dishes} صنف</span>
                      </div>
                      {w.left.length > 0 ? (
                        <div className="text-[#D9480F]">بقي مفتوحًا من حسابه{live ? ' الآن' : ''}: {w.left.map((t) => `${t.title} (${t.due < t.total ? `باقي ${money(t.due)} من ${money(t.total)}` : money(t.due)})`).join('، ')} · المجموع {money(w.left.reduce((n, t) => n + t.due, 0))}</div>
                      ) : (
                        <div className="text-[#2F9E44]">{live ? 'لا طاولات مفتوحة باسمه الآن.' : 'لم يترك طاولات مفتوحة.'}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="الصناديق">
        {dayShifts.length === 0 ? (
          <EmptyState text="يُفتح صندوق العامل عند أول دخول له برقمه السري. لا صناديق في هذا اليوم." />
        ) : (
          <div className="space-y-2">
            {dayShifts.map((s) => {
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
        {dayLog.length === 0 ? (
          <EmptyState text="هنا تظهر الأصناف الملغاة بعد إرسالها، والخصومات، والفواتير المعاد فتحها، ومن وافق عليها." />
        ) : (
          <div className="space-y-1.5">
            {dayLog.map((e) => (
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
