// One subscriber in the admin site: profile, pages, status (freeze / cancel / activate, each with
// a reason) and the history of what the team did, with notes.
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  AdminError, SubscriberDetail as Detail, SubscriberStatus,
  adminAddNote, adminSetStatus, adminSubscriber,
} from '../../services/adminApi';

const KIND: Record<string, string> = { free: 'صفحة', restaurant: 'مطعم', shop: 'متجر', cars: 'سيارات' };
const STATUS_LABEL: Record<SubscriberStatus, string> = { active: 'نشط', frozen: 'مجمّد', cancelled: 'ملغى' };
const STATUS_COLOR: Record<SubscriberStatus, string> = { active: 'text-success', frozen: 'text-warn', cancelled: 'text-danger' };
const when = (ms: number) => (ms ? new Date(ms).toLocaleString('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const ACTIONS: Record<SubscriberStatus, { to: SubscriberStatus; label: string; sure: string }[]> = {
  active: [
    { to: 'frozen', label: 'تجميد', sure: 'سيُمنع من الدخول وتظهر صفحاته «غير متاحة مؤقتاً». يمكن التفعيل لاحقاً.' },
    { to: 'cancelled', label: 'إلغاء الاشتراك', sure: 'مثل التجميد مع علامة «ملغى». بياناته تبقى ولا تُحذف.' },
  ],
  frozen: [
    { to: 'active', label: 'تفعيل', sure: 'يعود حسابه وصفحاته كما كانت.' },
    { to: 'cancelled', label: 'إلغاء الاشتراك', sure: 'يصير «ملغى». بياناته تبقى ولا تُحذف.' },
  ],
  cancelled: [{ to: 'active', label: 'إعادة التفعيل', sure: 'يعود حسابه وصفحاته كما كانت.' }],
};

const inputCls = 'w-full rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';

export const SubscriberDetail: React.FC<{ uid: string; onClose: () => void; onChanged: () => void; onSessionEnd: () => void }> = ({ uid, onClose, onChanged, onSessionEnd }) => {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<SubscriberStatus | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const fail = useCallback((e: unknown, fallback: string) => {
    if ((e as AdminError)?.code === 'session') return onSessionEnd();
    setError((e as AdminError)?.code === 'reason' ? 'اكتب سبباً (3 أحرف على الأقل).' : fallback);
  }, [onSessionEnd]);

  const load = useCallback(async () => {
    try {
      setData(await adminSubscriber(uid));
    } catch (e) {
      fail(e, 'تعذّر تحميل المشترك.');
    }
  }, [uid, fail]);
  useEffect(() => { load(); }, [load]);

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    setError('');
    try {
      await adminSetStatus(uid, pending, reason);
      setPending(null);
      setReason('');
      await load();
      onChanged();
    } catch (e) {
      fail(e, 'تعذّر تنفيذ الإجراء. جرّب مرة ثانية.');
    }
    setBusy(false);
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    setError('');
    try {
      await adminAddNote(uid, note);
      setNote('');
      await load();
    } catch (e) {
      fail(e, 'تعذّر حفظ الملاحظة.');
    }
    setBusy(false);
  };

  const p = data?.profile;
  const st = data?.status.status || 'active';
  const action = pending ? ACTIONS[st].find((a) => a.to === pending) : null;

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <aside className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-heading font-semibold">{p ? p.name || p.email || 'مشترك' : 'مشترك'}</h2>
          <button onClick={onClose} className="rounded-ctl p-1 hover:bg-bg" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        {!data && !error && <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin text-muted" />}
        {error && <p className="mb-3 text-small text-danger">{error}</p>}
        {data && p && (
          <div className="flex flex-col gap-5 text-small">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-muted">الإيميل</dt><dd dir="ltr" className="text-right">{p.email || '—'}{p.email && !p.verified && <span className="text-warn"> (غير مؤكَّد)</span>}</dd>
              <dt className="text-muted">الهاتف</dt><dd dir="ltr" className="text-right">{p.phone || '—'}</dd>
              <dt className="text-muted">الاشتراك</dt><dd>{when(p.createdAt)}</dd>
              <dt className="text-muted">آخر نشاط</dt><dd>{when(p.lastActive)}</dd>
              <dt className="text-muted">الحالة</dt><dd className={`font-medium ${STATUS_COLOR[st]}`}>{STATUS_LABEL[st]}{data.status.reason && st !== 'active' ? ` · ${data.status.reason}` : ''}</dd>
            </dl>

            <div>
              <h3 className="mb-1 font-medium">الصفحات المنشورة</h3>
              {data.sites.length ? data.sites.map((x) => <div key={x.name}>{KIND[x.project] || x.project} · <span dir="ltr">{x.name}</span></div>) : <span className="text-faint">لا شيء منشور.</span>}
            </div>

            <div>
              <h3 className="mb-2 font-medium">الإجراءات</h3>
              {!pending ? (
                <div className="flex flex-wrap gap-2">
                  {ACTIONS[st].map((a) => (
                    <button key={a.to} onClick={() => { setPending(a.to); setReason(''); setError(''); }}
                      className={`rounded-ctl border px-3 py-1.5 hover:bg-bg ${a.to === 'cancelled' ? 'border-danger text-danger' : 'border-line'}`}>{a.label}</button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 rounded-ctl border border-line bg-bg p-3">
                  <p>{action?.sure}</p>
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={pending === 'active' ? 'السبب (اختياري)' : 'السبب (مطلوب)'} className={inputCls} />
                  <div className="flex gap-2">
                    <button disabled={busy || (pending !== 'active' && reason.trim().length < 3)} onClick={confirm}
                      className="inline-flex items-center gap-1 rounded-ctl bg-brand px-3 py-1.5 text-white hover:bg-brand-hover disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} تأكيد: {action?.label}</button>
                    <button onClick={() => setPending(null)} className="rounded-ctl px-3 py-1.5 hover:bg-surface">رجوع</button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 font-medium">ملاحظة للإدارة</h3>
              <div className="flex gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} placeholder="اكتب ملاحظة وسجّلها بالتاريخ" className={inputCls} />
                <button disabled={busy || !note.trim()} onClick={addNote} className="rounded-ctl border border-line px-3 hover:bg-bg disabled:opacity-50">حفظ</button>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">السجل</h3>
              {data.events.length ? (
                <ol className="flex flex-col gap-2 border-r border-line pr-3">
                  {data.events.map((e) => (
                    <li key={e.id}>
                      <div className="text-tiny text-faint">{when(e.at)} · {e.admin}</div>
                      <div>{e.type === 'status' ? <span className={`font-medium ${STATUS_COLOR[e.status as SubscriberStatus] || ''}`}>{STATUS_LABEL[e.status as SubscriberStatus] || e.status}</span> : <span className="text-muted">ملاحظة</span>}{e.text ? ` · ${e.text}` : ''}</div>
                    </li>
                  ))}
                </ol>
              ) : <span className="text-faint">لا أحداث بعد.</span>}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
