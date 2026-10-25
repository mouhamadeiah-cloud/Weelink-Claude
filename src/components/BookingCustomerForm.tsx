// The customer's details in every kind of booking (Eyad, 25 Oct): full name, address, phone, email, notes
// or a description of the request, and a «سجّلني بحساب Weelink» box. A visitor who already has a Weelink
// account signs in from the line on top and the form fills itself in. A visitor who ticks the box gets an
// account after the booking: a password, then a 6-digit code to their email (the same as «سجّل دخولك»), and
// they join the page as its customer. The booking itself never waits for the account.
import React, { useEffect, useRef, useState } from 'react';
import { auth } from '../services/firebase';
import { SignInError, registerOwner } from '../services/accounts';
import { EmailCodeProblem, emailCodeErrorText, sendEmailCode, verifyEmailCode } from '../services/emailCode';
import { saveCustomerProfile, type PageKind } from '../services/pageCustomers';
import { rememberLogin } from '../services/sharedLogin';
import type { ProjectKey } from '../utils/projectKeys';
import { EMPTY_CUSTOMER, customerProblem, pageKindOf, type CustomerDraft, type CustomerLabels } from '../services/bookingCustomer';
import { canRequestAccount, requestAccountOpen, setCustomerSession, useCustomerPrefill, useCustomerSession } from './customers/customerSession';

export { EMPTY_CUSTOMER, customerProblem, pageKindOf };
export type { CustomerDraft, CustomerLabels };

interface FieldsProps {
  draft: CustomerDraft;
  onChange: React.Dispatch<React.SetStateAction<CustomerDraft>>;
  dark: boolean;
  accent: string;
  labels?: CustomerLabels;
}

export const CustomerFields: React.FC<FieldsProps> = ({ draft, onChange, dark, accent, labels }) => {
  const session = useCustomerSession();
  useCustomerPrefill((c) =>
    onChange((d) => ({ ...d, name: d.name || c.name, phone: d.phone || c.phone, address: d.address || c.address, email: d.email || c.email }))
  );
  const set = (patch: Partial<CustomerDraft>) => onChange((d) => ({ ...d, ...patch }));
  const text = dark ? 'text-white' : 'text-neutral-800';
  const sub = dark ? 'text-white/80' : 'text-neutral-600';
  const field = `w-full text-[10.5px] font-medium px-2.5 py-1.5 rounded-xl border focus:outline-none transition-all ${dark ? 'bg-white/10 border-white/20 text-white focus:border-white' : 'bg-neutral-50 border-neutral-200 focus:border-neutral-400 focus:bg-white'}`;
  const label = (t: string) => <label className={`text-[9.5px] block mb-0.5 ${sub}`}>{t}</label>;

  return (
    <div className="space-y-2">
      {session ? (
        <div className={`text-[10px] font-bold ${text}`}>✓ مسجّل بحساب Weelink{session.profile.name ? ` باسم ${session.profile.name}` : ''}</div>
      ) : canRequestAccount() ? (
        <div className={`text-[10px] ${sub}`}>
          عندك حساب Weelink؟{' '}
          <button type="button" onClick={requestAccountOpen} className="font-bold underline cursor-pointer" style={{ color: dark ? undefined : accent }}>سجّل دخولك</button>{' '}
          وبتتعبى بياناتك تلقائياً.
        </div>
      ) : null}
      <div>
        {label(labels?.name || 'الاسم الكامل')}
        <input type="text" className={field} placeholder="اكتب اسمك الكامل هنا" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div>
        {label(labels?.address || 'العنوان')}
        <input type="text" className={field} placeholder="المدينة، الحي، الشارع" value={draft.address} onChange={(e) => set({ address: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          {label(labels?.phone || 'رقم الهاتف')}
          <input type="tel" dir="ltr" className={`${field} text-left`} placeholder="05xxxxxxxx" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} />
        </div>
        <div>
          {label(labels?.email || 'الإيميل')}
          <input type="email" dir="ltr" className={`${field} text-left`} placeholder="name@domain.com" value={draft.email} onChange={(e) => set({ email: e.target.value })} />
        </div>
      </div>
      <div>
        {label(labels?.desc || 'ملاحظات أو وصف الطلب')}
        <textarea rows={2} className={`${field} resize-none`} placeholder="اكتب هنا ملاحظاتك أو تفاصيل طلبك..." value={draft.desc} onChange={(e) => set({ desc: e.target.value })} />
      </div>
      {!session && (
        <div className="space-y-1.5">
          <label className={`flex items-center gap-2 text-[10.5px] font-bold cursor-pointer ${text}`}>
            <input type="checkbox" checked={draft.register} onChange={(e) => set({ register: e.target.checked, password: '' })} style={{ accentColor: accent }} />
            سجّلني بحساب Weelink
          </label>
          {draft.register && (
            <>
              <input type="password" autoComplete="new-password" className={field} placeholder="كلمة مرور للحساب (6 أحرف على الأقل)" value={draft.password} onChange={(e) => set({ password: e.target.value })} />
              <div className={`text-[9.5px] ${sub}`}>بعد الحجز رح نرسل رمز تأكيد (6 أرقام) لإيميلك لإكمال الحساب.</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

type SignupState = 'working' | 'code' | 'done' | 'exists' | 'skipped' | 'error';

interface SignupProps {
  draft: CustomerDraft;
  owner: string;
  project: ProjectKey;
  pageName: string;
  accent: string;
  dark: boolean;
}

// After the booking: makes the account, sends the code, and joins the page once the email is confirmed.
export const AccountSignup: React.FC<SignupProps> = ({ draft, owner, project, pageName, accent, dark }) => {
  const [state, setState] = useState<SignupState>('working');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const text = dark ? 'text-white' : 'text-neutral-800';
  const sub = dark ? 'text-white/80' : 'text-neutral-600';
  const field = `w-full text-[11px] font-medium px-2.5 py-1.5 rounded-xl border focus:outline-none ${dark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-neutral-200'}`;

  const join = async (u: NonNullable<typeof auth.currentUser>) => {
    const profile = { name: draft.name.trim(), phone: draft.phone.trim(), address: draft.address.trim(), marketing: false };
    await saveCustomerProfile(owner, { name: pageName, kind: pageKindOf(project) }, u, profile);
    setCustomerSession({ uid: u.uid, email: u.email || '', profile });
    rememberLogin(u);
    setState('done');
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        await registerOwner(draft.email.trim().toLowerCase(), draft.password);
        const u = auth.currentUser;
        if (!u) return setState('error');
        const r = await sendEmailCode(u);
        if (r === 'verified') {
          await u.reload();
          await u.getIdToken(true);
          return await join(u);
        }
        setState(r === 'skipped' ? 'skipped' : 'code');
      } catch (e) {
        if (e instanceof SignInError && e.kind === 'exists') return setState('exists');
        if (e instanceof SignInError && e.kind === 'weak') setError('كلمة المرور 6 أحرف على الأقل.');
        else if (e instanceof EmailCodeProblem) setError(emailCodeErrorText(e));
        setState('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = auth.currentUser;
    if (!u) return;
    if (code.length !== 6) return setError('الرمز مكوّن من 6 أرقام.');
    setBusy(true);
    setError('');
    try {
      await verifyEmailCode(u, code);
      await join(u);
    } catch (err) {
      setError(err instanceof EmailCodeProblem ? emailCodeErrorText(err) : 'تعذر إكمال التسجيل. جرّب مرة ثانية من «سجّل دخولك».');
    }
    setBusy(false);
  };

  const resend = async () => {
    const u = auth.currentUser;
    if (!u) return;
    setError('');
    try {
      await sendEmailCode(u);
    } catch (err) {
      setError(emailCodeErrorText(err));
    }
  };

  const box = `w-full rounded-xl border p-2.5 space-y-1.5 text-right text-[10px] ${dark ? 'bg-white/10 border-white/25' : 'bg-neutral-50 border-neutral-100'}`;
  if (state === 'working') return <div className={`${box} ${sub}`}>جاري إنشاء حسابك…</div>;
  if (state === 'done') return <div className={`${box} ${text} font-bold`}>✓ تم تأكيد إيميلك وإنشاء حسابك على Weelink. بياناتك صارت محفوظة هون.</div>;
  if (state === 'exists') {
    return (
      <div className={`${box} ${sub}`}>
        هالإيميل عنده حساب Weelink من قبل. سجّل دخولك بحسابك:{' '}
        <button type="button" onClick={requestAccountOpen} className="font-bold underline cursor-pointer" style={{ color: dark ? undefined : accent }}>سجّل دخولك</button>
      </div>
    );
  }
  if (state === 'skipped') return <div className={`${box} ${sub}`}>تم إنشاء حسابك، لكن تأكيد الإيميل غير متاح الآن. سجّل دخولك لاحقاً من «سجّل دخولك» لإكماله.</div>;
  if (state === 'error') return <div className={`${box} text-red-600 font-bold`}>{error || 'تعذر إنشاء الحساب. تم حجزك بنجاح، وفيك تسجّل حسابك لاحقاً من «سجّل دخولك».'}</div>;
  return (
    <form onSubmit={verify} className={box}>
      <div className={`font-bold ${text}`}>أرسلنا رمزاً من 6 أرقام إلى {draft.email}. اكتبه لتأكيد حسابك:</div>
      <input className={`${field} text-center tracking-widest`} dir="ltr" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
      {error && <div className="text-red-600 font-bold">{error}</div>}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy} className="px-3 py-1.5 text-white rounded-lg font-bold cursor-pointer disabled:opacity-60" style={{ backgroundColor: accent }}>{busy ? '…' : 'تأكيد'}</button>
        <button type="button" onClick={resend} className={`font-bold underline cursor-pointer ${sub}`}>أعد إرسال الرمز</button>
      </div>
    </form>
  );
};
