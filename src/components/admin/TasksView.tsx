// «مهامي» and «كل المهام» in the admin site: the workflow board. The owner creates tasks and hands them
// to an admin; the admin moves them جديدة → قيد العمل → انتهت and replies. Everything goes through /api/admin.
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  AdminError, Task, TaskReply, TaskStatus, TasksResult, TeamAdmin,
  adminTask, adminTaskCreate, adminTaskReply, adminTaskStatus, adminTaskUpdate, adminTasks, adminTeam,
} from '../../services/adminApi';

const inputCls = 'rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';
const STATUS: Record<TaskStatus, string> = { new: 'جديدة', doing: 'قيد العمل', done: 'انتهت' };
const STATUS_COLOR: Record<TaskStatus, string> = { new: 'text-brand', doing: 'text-warn', done: 'text-success' };
const when = (ms: number) => (ms ? new Date(ms).toLocaleString('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const ERRORS: Record<string, string> = {
  'bad-title': 'اكتب عنواناً (3 أحرف على الأقل).',
  'bad-assignee': 'اختر أدمن نشطاً.',
  'no-subscriber': 'ما لقيت مشتركاً بهذا الإيميل أو المعرّف.',
};

const TaskPanel: React.FC<{ id: string; owner: boolean; team: TeamAdmin[]; types: Record<string, string>; onClose: () => void; onChanged: () => void; onSessionEnd: () => void }> = ({ id, owner, team, types, onClose, onChanged, onSessionEnd }) => {
  const [data, setData] = useState<{ task: Task; replies: TaskReply[] } | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await adminTask(id));
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل المهمة.');
    }
  }, [id, onSessionEnd]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
      onChanged();
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError(ERRORS[(e as AdminError)?.code] || 'تعذّر تنفيذ الطلب.');
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <aside dir="rtl" onClick={(e) => e.stopPropagation()} className="mr-auto h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-4 text-small shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h2 className="text-heading font-semibold">{data?.task.title || '...'}</h2>
          <button onClick={onClose} className="rounded-ctl p-1 hover:bg-bg" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        {error && <p className="mb-2 text-danger">{error}</p>}
        {!data ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-muted">النوع</dt><dd>{types[data.task.type] || data.task.type}</dd>
              <dt className="text-muted">المسؤول</dt><dd>{data.task.assigneeName || 'بدون'}</dd>
              {data.task.subscriber && (<><dt className="text-muted">المشترك</dt><dd>{data.task.subscriber}</dd></>)}
              <dt className="text-muted">آخر تحديث</dt><dd>{when(data.task.updatedAt)}</dd>
            </dl>
            {data.task.instructions && <p className="whitespace-pre-wrap rounded-ctl bg-bg p-3">{data.task.instructions}</p>}

            <div>
              <h3 className="mb-2 font-medium">الحالة</h3>
              <div className="flex gap-2">
                {(['new', 'doing', 'done'] as TaskStatus[]).map((s) => (
                  <button key={s} disabled={busy || data.task.status === s} onClick={() => run(() => adminTaskStatus(id, s))}
                    className={`rounded-ctl border px-3 py-1.5 ${data.task.status === s ? 'border-brand bg-bg font-medium' : 'border-line hover:bg-bg'} disabled:cursor-default`}>{STATUS[s]}</button>
                ))}
              </div>
            </div>

            {owner && (
              <div>
                <h3 className="mb-2 font-medium">تحويل المهمة</h3>
                <select value={data.task.assignee} disabled={busy} onChange={(e) => run(() => adminTaskUpdate(id, { assignee: e.target.value }))} className={`${inputCls} w-full`}>
                  <option value="">بدون مسؤول</option>
                  {team.filter((a) => a.status === 'active').map((a) => <option key={a.username} value={a.username}>{a.name} ({a.username})</option>)}
                </select>
              </div>
            )}

            <div>
              <h3 className="mb-2 font-medium">الردود</h3>
              {data.replies.length ? (
                <ol className="mb-2 flex flex-col gap-2 border-r border-line pr-3">
                  {data.replies.map((r) => (
                    <li key={r.id}>
                      <div className="text-tiny text-faint">{when(r.at)} · {r.byName}</div>
                      <div className="whitespace-pre-wrap">{r.text}</div>
                    </li>
                  ))}
                </ol>
              ) : <p className="mb-2 text-faint">لا ردود بعد.</p>}
              <div className="flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && text.trim() && run(async () => { await adminTaskReply(id, text); setText(''); })} placeholder="اكتب رداً أو ملاحظة" className={`${inputCls} flex-1`} />
                <button disabled={busy || !text.trim()} onClick={() => run(async () => { await adminTaskReply(id, text); setText(''); })} className="rounded-ctl border border-line px-3 hover:bg-bg disabled:opacity-50">إرسال</button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export const TasksView: React.FC<{ onSessionEnd: () => void; owner: boolean }> = ({ onSessionEnd, owner }) => {
  const [filter, setFilter] = useState({ status: '', q: '', assignee: '' });
  const [data, setData] = useState<TasksResult | null>(null);
  const [team, setTeam] = useState<TeamAdmin[]>([]);
  const [open, setOpen] = useState('');
  const [form, setForm] = useState<{ title: string; instructions: string; type: string; assignee: string; uid: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (f: typeof filter) => {
    setError('');
    try {
      setData(await adminTasks(owner ? f : { ...f, mine: true }));
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل المهام.');
    }
  }, [onSessionEnd, owner]);

  useEffect(() => {
    const t = setTimeout(() => load(filter), filter.q ? 400 : 0);
    return () => clearTimeout(t);
  }, [filter, load]);
  useEffect(() => { if (owner) adminTeam().then((r) => setTeam(r.rows)).catch(() => undefined); }, [owner]);

  const create = async () => {
    if (!form) return;
    setBusy(true);
    setError('');
    try {
      await adminTaskCreate({ ...form, uid: form.uid.trim() || undefined });
      setForm(null);
      await load(filter);
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError(ERRORS[(e as AdminError)?.code] || 'تعذّر إنشاء المهمة.');
    }
    setBusy(false);
  };

  const types = data?.types || {};

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-title font-semibold">{owner ? 'كل المهام' : 'مهامي'}</h1>
        {owner && !form && <button onClick={() => setForm({ title: '', instructions: '', type: 'other', assignee: '', uid: '' })} className="rounded-ctl bg-brand px-3 py-2 text-small text-white hover:bg-brand-hover">مهمة جديدة</button>}
      </div>
      {error && <p className="text-small text-danger">{error}</p>}

      {form && (
        <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="العنوان" className={inputCls} />
          <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="التعليمات (ماذا نريد منه بالضبط؟)" rows={3} className={inputCls} />
          <div className="grid gap-2 sm:grid-cols-3">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
              {Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} className={inputCls}>
              <option value="">المسؤول: بدون</option>
              {team.filter((a) => a.status === 'active').map((a) => <option key={a.username} value={a.username}>{a.name} ({a.username})</option>)}
            </select>
            <input value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })} placeholder="إيميل المشترك (اختياري)" dir="ltr" className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button disabled={busy || form.title.trim().length < 3} onClick={create} className="inline-flex items-center gap-1 rounded-ctl bg-brand px-3 py-1.5 text-small text-white hover:bg-brand-hover disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} إنشاء</button>
            <button onClick={() => setForm(null)} className="rounded-ctl px-3 py-1.5 text-small hover:bg-bg">رجوع</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} placeholder="ابحث بالعنوان أو المشترك" className={`${inputCls} min-w-[200px] flex-1`} />
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className={inputCls}>
          <option value="">كل الحالات</option>
          {(Object.keys(STATUS) as TaskStatus[]).map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
        </select>
        {owner && (
          <select value={filter.assignee} onChange={(e) => setFilter({ ...filter, assignee: e.target.value })} className={inputCls}>
            <option value="">كل الأدمنز</option>
            {team.map((a) => <option key={a.username} value={a.username}>{a.name}</option>)}
          </select>
        )}
      </div>

      {!data ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : (
        <>
          <p className="text-small text-muted">
            {(Object.keys(STATUS) as TaskStatus[]).map((s) => `${STATUS[s]}: ${data.counts[s].toLocaleString('ar-SY')}`).join(' · ')}
          </p>
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[680px] text-right text-small">
              <thead className="border-b border-line text-muted"><tr>{['العنوان', 'النوع', 'المشترك', 'المسؤول', 'الحالة', 'آخر تحديث'].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {data.rows.map((t) => (
                  <tr key={t.id} onClick={() => setOpen(t.id)} className="cursor-pointer border-b border-line last:border-0 hover:bg-bg">
                    <td className="px-3 py-2 font-medium">{t.title}</td>
                    <td className="px-3 py-2">{types[t.type] || t.type}</td>
                    <td className="px-3 py-2">{t.subscriber || '—'}</td>
                    <td className="px-3 py-2">{t.assigneeName || '—'}</td>
                    <td className={`px-3 py-2 ${STATUS_COLOR[t.status]}`}>{STATUS[t.status]}</td>
                    <td className="px-3 py-2">{when(t.updatedAt)}</td>
                  </tr>
                ))}
                {!data.rows.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted">{owner ? 'لا مهام.' : 'ما في مهام عندك.'}</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
      {open && <TaskPanel id={open} owner={owner} team={team} types={types} onClose={() => setOpen('')} onChanged={() => load(filter)} onSessionEnd={onSessionEnd} />}
    </section>
  );
};
