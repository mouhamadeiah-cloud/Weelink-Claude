// «الأدمنز والصلاحيات» in the admin site (owner only): the team, each one's specialty, adding an
// admin with a temporary password (shown once), freezing, and resetting a password.
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminError, TeamAdmin, adminAddAdmin, adminResetPassword, adminTeam, adminUpdateAdmin } from '../../services/adminApi';

const inputCls = 'rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';
const GRANTS: Record<string, string> = {
  support: 'يشوف المشتركين ويكتب الملاحظات.',
  finance: 'كالدعم، ويسجّل الدفعات والفواتير ويشحن التوكنز ويؤجّل التجميد، ويشوف الداشبورد ويصدّر CSV ويدير الكوبونات.',
  domains: 'يشوف المشتركين ويكتب الملاحظات (طلبات الدومين تأتي مع سير العمل).',
  content: 'كالدعم، ويراجع بلاغات التقييمات (يبقي التقييم أو يحذفه).',
};
const ERRORS: Record<string, string> = {
  'bad-username': 'اسم الدخول: 3 أحرف أو أكثر، إنكليزي وأرقام و - و _.',
  'bad-name': 'اكتب الاسم.',
  'bad-specialty': 'اختر اختصاصاً.',
  exists: 'اسم الدخول هذا مستعمل.',
  owner: 'المدير الرئيسي لا يُعدَّل من هنا.',
};

export const TeamView: React.FC<{ onSessionEnd: () => void; me: string }> = ({ onSessionEnd, me }) => {
  const [data, setData] = useState<{ rows: TeamAdmin[]; specialties: Record<string, string> } | null>(null);
  const [form, setForm] = useState<{ username: string; name: string; specialty: string } | null>(null);
  const [temp, setTemp] = useState<{ username: string; password: string } | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const fail = useCallback((e: unknown, fallback: string) => {
    const code = (e as AdminError)?.code;
    if (code === 'session') return onSessionEnd();
    setError(ERRORS[code] || fallback);
  }, [onSessionEnd]);

  const load = useCallback(async () => {
    try {
      setData(await adminTeam());
    } catch (e) {
      fail(e, 'تعذّر تحميل الفريق.');
    }
  }, [fail]);
  useEffect(() => { load(); }, [load]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      fail(e, 'تعذّر تنفيذ الطلب.');
    }
    setBusy('');
  };

  const add = () => form && run('add', async () => {
    const r = await adminAddAdmin(form);
    setTemp({ username: r.username, password: r.tempPassword });
    setForm(null);
  });

  if (!data) return error ? <p className="text-small text-danger">{error}</p> : <Loader2 className="h-5 w-5 animate-spin text-muted" />;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-title font-semibold">الأدمنز والصلاحيات</h1>
        {!form && <button onClick={() => { setForm({ username: '', name: '', specialty: 'support' }); setTemp(null); setError(''); }} className="rounded-ctl bg-brand px-3 py-2 text-small text-white hover:bg-brand-hover">إضافة أدمن</button>}
      </div>
      {error && <p className="text-small text-danger">{error}</p>}

      {temp && (
        <div className="rounded-card border border-line bg-surface p-3 text-small">
          <p>كلمة السر المؤقتة لـ <b dir="ltr">{temp.username}</b> (تظهر مرة واحدة فقط، سلّمها له وسيُجبَر على تغييرها عند أول دخول):</p>
          <p className="mt-2 select-all rounded-ctl bg-bg px-3 py-2 text-body font-mono" dir="ltr">{temp.password}</p>
          <button onClick={() => setTemp(null)} className="mt-2 text-brand hover:underline">تم، أخفِها</button>
        </div>
      )}

      {form && (
        <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم" className={inputCls} />
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="اسم الدخول (إنكليزي)" dir="ltr" className={inputCls} />
            <select value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className={inputCls}>
              {Object.entries(data.specialties).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <p className="text-tiny text-faint">{GRANTS[form.specialty]}</p>
          <div className="flex gap-2">
            <button disabled={busy === 'add' || !form.name.trim() || form.username.trim().length < 3} onClick={add} className="inline-flex items-center gap-1 rounded-ctl bg-brand px-3 py-1.5 text-small text-white hover:bg-brand-hover disabled:opacity-50">{busy === 'add' && <Loader2 className="h-3.5 w-3.5 animate-spin" />} إنشاء</button>
            <button onClick={() => setForm(null)} className="rounded-ctl px-3 py-1.5 text-small hover:bg-bg">رجوع</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[640px] text-right text-small">
          <thead className="border-b border-line text-muted"><tr>{['الاسم', 'اسم الدخول', 'الاختصاص', 'الحالة', ''].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {data.rows.map((a) => {
              const owner = a.role === 'owner';
              return (
                <tr key={a.username} className="border-b border-line last:border-0">
                  <td className="px-3 py-2">{a.name}{a.username === me ? ' (أنت)' : ''}</td>
                  <td className="px-3 py-2" dir="ltr">{a.username}</td>
                  <td className="px-3 py-2">
                    {owner ? 'مدير رئيسي (كل الصلاحيات)' : (
                      <select value={a.specialty} disabled={busy === `s${a.username}`} onChange={(e) => run(`s${a.username}`, () => adminUpdateAdmin(a.username, { specialty: e.target.value }).then(() => undefined))} className={inputCls}>
                        {Object.entries(data.specialties).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    )}
                  </td>
                  <td className={`px-3 py-2 ${a.status === 'frozen' ? 'text-warn' : 'text-success'}`}>{a.status === 'frozen' ? 'مجمّد' : a.mustChange ? 'نشط (لم يغيّر كلمة السر)' : 'نشط'}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {!owner && (
                      <>
                        <button disabled={!!busy} onClick={() => run(`f${a.username}`, () => adminUpdateAdmin(a.username, { status: a.status === 'frozen' ? 'active' : 'frozen' }).then(() => undefined))} className="text-brand hover:underline disabled:opacity-50">{a.status === 'frozen' ? 'تفعيل' : 'تجميد'}</button>
                        <button disabled={!!busy} onClick={() => run(`r${a.username}`, async () => { const r = await adminResetPassword(a.username); setTemp({ username: r.username, password: r.tempPassword }); })} className="mr-3 text-brand hover:underline disabled:opacity-50">كلمة سر جديدة</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-tiny text-faint">الصلاحيات تُفحص في السيرفر عند كل طلب. المدير الرئيسي وحده يضيف الأدمنز ويجمّد المشتركين ويغيّر الأسعار وبيانات الفوترة.</p>
    </section>
  );
};
