// The «نموذج تواصل» block on a page: name, phone, optional email and a message. On the published page (and
// the owner's view of it) «إرسال» saves the message and emails the owner (/api/contact); in the editor it
// only shows what a visitor would see. The page comes from BookingPageContext.
import React, { useContext, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { BookingPageContext } from '../../services/bookings';
import { contactErrorText, sendInquiry } from '../../services/contact';
import type { CanvasElement } from '../../types';

export const ContactFormWidget: React.FC<{ elem: CanvasElement }> = ({ elem }) => {
  const page = useContext(BookingPageContext);
  const live = !!page?.live;
  const accent = elem.contactAccentColor || '#0071e3';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!live || !page) {
      setSent(true);
      return;
    }
    setBusy(true);
    const out = await sendInquiry({ owner: page.owner, project: page.project, pageName: page.pageName, name, phone, email, message, website });
    setBusy(false);
    if ('error' in out) setError(contactErrorText(out.error));
    else setSent(true);
  };

  const field = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400';

  if (sent) {
    return (
      <div dir="rtl" className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center bg-white" style={{ borderRadius: 'inherit' }}>
        <CheckCircle2 size={40} style={{ color: accent }} />
        <div className="text-base font-black text-neutral-900">وصلتنا رسالتك</div>
        <p className="text-sm text-neutral-500">رح نتواصل معك بأقرب وقت.{!live && ' (معاينة: ما انرسل شي)'}</p>
      </div>
    );
  }

  return (
    <form dir="rtl" onSubmit={submit} className="w-full h-full overflow-y-auto flex flex-col gap-2.5 p-5 bg-white text-right" style={{ borderRadius: 'inherit' }}>
      <div className="text-lg font-black text-neutral-900">{elem.contactTitle || elem.content || 'راسلنا'}</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" required minLength={2} maxLength={80} className={field} />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الهاتف" required type="tel" inputMode="tel" maxLength={30} className={field} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="الإيميل (اختياري)" type="email" dir="ltr" maxLength={120} className={`${field} text-right`} />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="رسالتك" required minLength={3} maxLength={1500} rows={3} className={`${field} flex-1 min-h-[70px] resize-none`} />
      {/* A field real visitors never see: a bot that fills it is dropped by the server. */}
      <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute opacity-0 pointer-events-none h-0 w-0" />
      {error && <div className="text-xs font-bold text-red-600">{error}</div>}
      <button type="submit" disabled={busy} className="h-11 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60" style={{ backgroundColor: accent }}>
        {busy && <Loader2 size={16} className="animate-spin" />} {elem.contactButtonText || 'إرسال'}
      </button>
    </form>
  );
};
