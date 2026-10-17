// «إعلان بالإيميل» (owner only): one email to a group of subscribers (only active accounts with a
// confirmed email). The owner writes it, sends a test copy to himself, sees how many will get it and
// confirms; the server refuses if that count changed meanwhile. Every send is kept in the list below.
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminError, AnnouncePreview, adminAnnounce, adminAnnouncePreview } from '../../services/adminApi';

const inputCls = 'w-full rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';
const ERRORS: Record<string, string> = {
  short: 'اكتب عنواناً (3 أحرف) ونصاً (10 أحرف على الأقل).',
  'email-not-configured': 'الإيميل غير مُعدّ في Cloudflare (EMAIL_FROM و RESEND_API_KEY).',
  refused: 'رفض مزوّد الإيميل الإرسال. غالباً دومين الإرسال غير مؤكَّد في Resend.',
  nobody: 'لا أحد في هذه الفئة.',
  'too-many': 'العدد أكبر من الحد المسموح بدفعة واحدة. ضيّق الفئة.',
  'bad-email': 'إيميل التجربة غير صالح.',
};

export const AnnounceView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [audience, setAudience] = useState('all');
  const [info, setInfo] = useState<AnnouncePreview | null>(null);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [testTo, setTestTo] = useState('');
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fail = useCallback((e: unknown, fallback: string) => {
    if ((e as AdminError)?.code === 'session') return onSessionEnd();
    const code = (e as AdminError)?.code;
    setError(code === 'count-changed' ? `تغيّر عدد المستلمين إلى ${(e as AdminError).extra.count}. راجع وأكّد من جديد.` : ERRORS[code] || fallback);
  }, [onSessionEnd]);
  const load = useCallback(async (a: string) => {
    try {
      setInfo(await adminAnnouncePreview(a));
    } catch (e) {
      fail(e, 'تعذّر تحميل الفئة.');
    }
  }, [fail]);
  useEffect(() => { load(audience); setSure(false); }, [audience, load]);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      setNotice(await fn());
    } catch (e) {
      fail(e, 'تعذّر الإرسال.');
      await load(audience);
    }
    setSure(false);
    setBusy(false);
  };
  const sendTest = () => run(async () => { await adminAnnounce({ audience, subject, text, testTo }); return `أُرسلت نسخة تجريبية إلى ${testTo}.`; });
  const sendAll = () => run(async () => {
    const r = await adminAnnounce({ audience, subject, text, confirm: info?.count });
    await load(audience);
    return `أُرسل الإعلان إلى ${r.sent} مشترك${r.failed ? ` وفشل ${r.failed}` : ''}.`;
  });

  const ready = subject.trim().length >= 3 && text.trim().length >= 10;
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">إعلان بالإيميل</h1>
      {error && <p className="text-small text-danger">{error}</p>}
      {notice && <p className="text-small text-success">{notice}</p>}

      <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3">
        <label className="text-small text-muted">إلى مين
          <select value={audience} onChange={(e) => setAudience(e.target.value)} className={`${inputCls} mt-1`}>
            {Object.entries(info?.audiences || { all: 'كل المشتركين' }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <p className="text-small text-muted">{info ? <>رح يوصل لـ <b className="text-ink">{info.count.toLocaleString('ar-SY')}</b> مشترك (حسابات فعّالة بإيميل مؤكَّد فقط). الحد {info.max.toLocaleString('ar-SY')} بالدفعة.</> : 'جارٍ العدّ…'}</p>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} placeholder="العنوان" className={inputCls} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} maxLength={4000} placeholder="نص الرسالة" className={inputCls} />
        <div className="flex flex-wrap items-center gap-2">
          <input dir="ltr" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="إيميلك لنسخة تجريبية" className={`${inputCls} max-w-xs`} />
          <button disabled={busy || !ready || !testTo.includes('@')} onClick={sendTest} className="rounded-ctl border border-line px-3 py-2 text-small hover:bg-bg disabled:opacity-50">أرسل تجربة</button>
        </div>
        {sure ? (
          <div className="flex flex-wrap items-center gap-2 rounded-ctl border border-line bg-bg p-3 text-small">
            <span>تأكيد: إرسال «{subject}» إلى {info?.count.toLocaleString('ar-SY')} مشترك؟ لا رجعة بعدها.</span>
            <button disabled={busy} onClick={sendAll} className="inline-flex items-center gap-1 rounded-ctl bg-brand px-3 py-1.5 text-white hover:bg-brand-hover disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} نعم، أرسل</button>
            <button onClick={() => setSure(false)} className="rounded-ctl px-3 py-1.5 hover:bg-surface">رجوع</button>
          </div>
        ) : (
          <button disabled={busy || !ready || !info?.count} onClick={() => setSure(true)} className="self-start rounded-ctl bg-brand px-4 py-2 text-small text-white hover:bg-brand-hover disabled:opacity-50">إرسال للجميع</button>
        )}
      </div>

      <div className="rounded-card border border-line bg-surface p-3">
        <h2 className="mb-2 font-medium">آخر الإعلانات</h2>
        {info?.history.length ? (
          <ul className="flex flex-col gap-1.5 text-small">
            {info.history.map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-2 border-t border-line pt-1.5 first:border-0 first:pt-0">
                <span>{h.subject} <span className="text-tiny text-faint">· {info.audiences[h.audience] || h.audience}</span></span>
                <span className="text-tiny text-muted">{new Date(h.at).toLocaleDateString('ar-SY', { dateStyle: 'medium' })} · وصل {h.sent}/{h.count}{h.failed ? ` · فشل ${h.failed}` : ''} · {h.by}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-small text-faint">ما أُرسل شيء بعد.</p>}
      </div>
    </section>
  );
};
