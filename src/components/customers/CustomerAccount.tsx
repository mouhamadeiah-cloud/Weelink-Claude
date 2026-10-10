// «حسابي» on a page's public site: a visitor signs in with their Weelink account (email and password,
// or Google) or makes one, confirms their email with the 6-digit code, and joins the page as its
// customer with their name, phone and address and whether they want its offers by email. A joined
// customer sees their orders here, changes their details or leaves the page. The same account opens
// weelink.de, which lists the pages they joined.
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CheckCircle2, Loader2, LogOut, UserRound, X } from 'lucide-react';
import { auth, loginWithGoogle } from '../../services/firebase';
import { SignInError, registerOwner, signInOwner } from '../../services/accounts';
import { EmailCodeProblem, emailCodeErrorText, sendEmailCode, verifyEmailCode } from '../../services/emailCode';
import {
  CustomerProfile,
  PageCustomer,
  PageKind,
  leavePage,
  listMyRestaurantOrders,
  readMyCustomerProfile,
  saveCustomerProfile,
} from '../../services/pageCustomers';
import { setCustomerSession } from './customerSession';
import { ORDER_STATUSES } from '../restaurant/restaurantTypes';
import { formatMoney } from '../shop/adminUi';

interface CustomerAccountProps {
  ownerUid: string;
  pageName: string;
  kind: PageKind;
  accent: string;
  currency?: string;
}

type Step = 'signin' | 'signup' | 'code' | 'profile' | 'account';

const signInErrorText = (e: unknown, register = false) => {
  const kind = e instanceof SignInError ? e.kind : String((e as any)?.code || '').includes('popup') ? 'popup' : 'network';
  if (kind === 'credentials') return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (kind === 'exists') return 'هذا البريد مسجل مسبقاً في Weelink. ادخل بحسابك.';
  if (kind === 'weak') return 'كلمة المرور 6 أحرف على الأقل.';
  if (kind === 'popup') return 'أُغلقت نافذة Google قبل إتمام الدخول.';
  return register ? 'تعذر إنشاء الحساب. حاول مرة أخرى.' : 'تعذر تسجيل الدخول. تحقق من اتصالك بالإنترنت.';
};

const EMPTY_PROFILE: CustomerProfile = { name: '', phone: '', address: '', marketing: false };

export const CustomerAccount: React.FC<CustomerAccountProps> = ({ ownerUid, pageName, kind, accent, currency = '' }) => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [joined, setJoined] = useState<PageCustomer | null>(null);
  const [step, setStep] = useState<Step>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [code, setCode] = useState('');
  const [resendWait, setResendWait] = useState(0);
  const [profile, setProfile] = useState<CustomerProfile>(EMPTY_PROFILE);
  const [orders, setOrders] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Where a signed-in visitor stands on this page: email still to confirm, details to give, or joined.
  const arrive = async (u: User) => {
    if (!u.emailVerified) {
      setStep('code');
      return;
    }
    try {
      const mine = await readMyCustomerProfile(ownerUid, u);
      setJoined(mine);
      if (mine) {
        setProfile({ name: mine.name, phone: mine.phone, address: mine.address, marketing: mine.marketing });
        setCustomerSession({ uid: u.uid, profile: mine });
        setStep('account');
      } else {
        setProfile((p) => ({ ...p, name: p.name || u.displayName || '' }));
        setCustomerSession(null);
        setStep('profile');
      }
    } catch (e) {
      console.warn('Could not read the customer profile:', e);
      setError('تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.');
      setStep('profile');
    }
  };

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        const real = u && !u.isAnonymous ? u : null;
        setUser(real);
        if (real) arrive(real);
        else {
          setJoined(null);
          setCustomerSession(null);
          setStep('signin');
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ownerUid]
  );

  useEffect(() => {
    if (resendWait <= 0) return;
    const t = window.setTimeout(() => setResendWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendWait]);

  // A joined customer's orders here, each time the window opens.
  useEffect(() => {
    if (!open || step !== 'account' || !user || kind !== 'restaurant') return;
    setOrders(null);
    listMyRestaurantOrders(ownerUid, user.uid)
      .then(setOrders)
      .catch((e) => {
        console.warn('Could not read the orders:', e);
        setOrders([]);
      });
  }, [open, step, user, ownerUid, kind]);

  const sendCode = async (u: User) => {
    try {
      const r = await sendEmailCode(u);
      if (r === 'sent') setResendWait(60);
      if (r === 'skipped') setError('تأكيد البريد غير متاح الآن. حاول لاحقاً.');
      if (r === 'verified') {
        await u.reload();
        await u.getIdToken(true);
        await arrive(u);
      }
    } catch (e) {
      if (e instanceof EmailCodeProblem && e.kind === 'too_soon') setResendWait(e.waitSeconds);
      setError(emailCodeErrorText(e));
    }
  };

  // After any sign-in: a new or unconfirmed email gets its code first.
  const afterSignIn = async () => {
    const u = auth.currentUser;
    if (!u) return;
    if (!u.emailVerified) {
      setCode('');
      setStep('code');
      await sendCode(u);
      return;
    }
    await arrive(u);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () =>
    run(async () => {
      try {
        await loginWithGoogle();
        await afterSignIn();
      } catch (e) {
        setError(signInErrorText(e));
      }
    });

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError('اكتب البريد الإلكتروني وكلمة المرور.');
    run(async () => {
      try {
        await signInOwner(email.trim().toLowerCase(), password);
        await afterSignIn();
      } catch (err) {
        setError(signInErrorText(err));
      }
    });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError('اكتب البريد الإلكتروني وكلمة المرور.');
    if (password.length < 6) return setError('كلمة المرور 6 أحرف على الأقل.');
    if (password !== password2) return setError('كلمتا المرور غير متطابقتين.');
    run(async () => {
      try {
        await registerOwner(email.trim().toLowerCase(), password);
        await afterSignIn();
      } catch (err) {
        setError(signInErrorText(err, true));
      }
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const u = auth.currentUser;
    if (!u) return;
    if (code.length !== 6) return setError('الرمز مكوّن من 6 أرقام.');
    run(async () => {
      try {
        await verifyEmailCode(u, code);
        await arrive(u);
      } catch (err) {
        setError(emailCodeErrorText(err));
      }
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const u = auth.currentUser;
    if (!u) return;
    if (!profile.name.trim()) return setError('اكتب اسمك.');
    if (profile.phone.replace(/\D/g, '').length < 7) return setError('اكتب رقم هاتف صحيح.');
    run(async () => {
      try {
        await saveCustomerProfile(ownerUid, { name: pageName, kind }, u, profile, joined?.joinedAt);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
        await arrive(u);
      } catch (err) {
        console.warn('Could not save the customer profile:', err);
        setError('تعذر الحفظ. تحقق من الإنترنت وحاول مرة أخرى.');
      }
    });
  };

  const handleLeave = () => {
    const u = auth.currentUser;
    if (!u || !window.confirm(`إلغاء اشتراكك في ${pageName || 'هذه الصفحة'}؟ لن يرى المحل بياناتك بعد ذلك.`)) return;
    run(async () => {
      try {
        await leavePage(ownerUid, u.uid);
        setJoined(null);
        setCustomerSession(null);
        setStep('profile');
      } catch {
        setError('تعذر إلغاء الاشتراك. حاول مرة أخرى.');
      }
    });
  };

  const handleSignOut = () => run(async () => {
    await auth.signOut().catch(() => {});
    setEmail('');
    setPassword('');
    setPassword2('');
  });

  const input = 'w-full h-11 px-4 rounded-2xl border border-black/10 bg-white text-sm outline-none focus:border-black/30';
  const primary = 'w-full h-11 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60';
  const link = 'text-xs font-bold text-black/50 hover:text-black underline decoration-black/20 cursor-pointer';
  const firstName = (joined?.name || '').split(' ')[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-[1000] h-10 px-4 rounded-full bg-white/95 backdrop-blur shadow-[0_6px_20px_rgba(0,0,0,0.15)] text-sm font-bold flex items-center gap-2 cursor-pointer"
        style={{ color: accent }}
        dir="rtl"
      >
        <UserRound size={18} />
        {joined ? firstName || 'حسابي' : 'سجّل كزبون'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[1001] bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div
            dir="rtl"
            className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-[#FBFAF8] rounded-t-3xl sm:rounded-3xl p-6 space-y-5 font-sans text-[#1d1d1f]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black">
                  {step === 'account' ? `أهلاً ${firstName}` : step === 'code' ? 'أكّد بريدك الإلكتروني' : `زبائن ${pageName || 'الصفحة'}`}
                </div>
                {(step === 'signin' || step === 'signup') && (
                  <p className="text-xs text-black/50 leading-relaxed mt-1">سجّل لتحفظ بياناتك وترى طلباتك. نفس الحساب يفتح كل صفحات Weelink.</p>
                )}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="w-9 h-9 shrink-0 rounded-full bg-black/5 flex items-center justify-center cursor-pointer" aria-label="إغلاق">
                <X size={18} />
              </button>
            </div>

            {(step === 'signin' || step === 'signup') && (
              <>
                <button type="button" onClick={handleGoogle} disabled={busy} className="w-full h-11 rounded-2xl border border-black/15 bg-white text-sm font-bold cursor-pointer disabled:opacity-60">
                  الدخول بحساب Google
                </button>
                <div className="flex items-center gap-3 text-[11px] font-bold text-black/35">
                  <span className="flex-1 h-px bg-black/10" />
                  {step === 'signin' ? 'أو بحساب Weelink' : 'أو أنشئ حساب Weelink'}
                  <span className="flex-1 h-px bg-black/10" />
                </div>
                <form onSubmit={step === 'signin' ? handleSignIn : handleSignUp} className="space-y-3">
                  <input className={input} type="email" autoComplete="username" placeholder="البريد الإلكتروني" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input className={input} type="password" autoComplete={step === 'signin' ? 'current-password' : 'new-password'} placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
                  {step === 'signup' && (
                    <input className={input} type="password" autoComplete="new-password" placeholder="أعد كلمة المرور" value={password2} onChange={(e) => setPassword2(e.target.value)} />
                  )}
                  {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
                  <button type="submit" disabled={busy} className={primary} style={{ backgroundColor: accent }}>
                    {busy && <Loader2 size={16} className="animate-spin" />}
                    {step === 'signin' ? 'دخول' : 'إنشاء الحساب'}
                  </button>
                </form>
                <div className="text-center">
                  <button type="button" className={link} onClick={() => { setStep(step === 'signin' ? 'signup' : 'signin'); setError(''); }}>
                    {step === 'signin' ? 'ليس لديك حساب؟ أنشئ حساباً' : 'لديك حساب Weelink؟ ادخل'}
                  </button>
                </div>
              </>
            )}

            {step === 'code' && (
              <form onSubmit={handleVerify} className="space-y-3">
                <p className="text-sm text-black/55 leading-relaxed">
                  أرسلنا رمزاً من 6 أرقام إلى <span dir="ltr" className="font-bold text-black">{user?.email}</span>. إن لم تجده فانظر في البريد المزعج.
                </p>
                <input
                  className={`${input} text-center text-xl font-black tracking-[0.5em]`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  dir="ltr"
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
                <button type="submit" disabled={busy} className={primary} style={{ backgroundColor: accent }}>
                  {busy && <Loader2 size={16} className="animate-spin" />}
                  تأكيد
                </button>
                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    disabled={resendWait > 0 || busy}
                    className="text-xs font-bold cursor-pointer disabled:text-black/35 disabled:cursor-default"
                    style={resendWait > 0 ? undefined : { color: accent }}
                    onClick={() => { setError(''); setCode(''); if (auth.currentUser) run(() => sendCode(auth.currentUser!)); }}
                  >
                    {resendWait > 0 ? `رمز جديد بعد ${resendWait} ثانية` : 'إرسال رمز جديد'}
                  </button>
                  <button type="button" className={link} onClick={handleSignOut}>استخدام بريد آخر</button>
                </div>
              </form>
            )}

            {(step === 'profile' || step === 'account') && (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                {step === 'profile' && (
                  <p className="text-sm text-black/55 leading-relaxed">
                    أنت داخل باسم <span dir="ltr" className="font-bold text-black">{user?.email}</span>. أكمل بياناتك لتشترك في {pageName || 'هذه الصفحة'}.
                  </p>
                )}
                <input className={input} autoComplete="name" placeholder="الاسم" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                <input className={input} autoComplete="tel" inputMode="tel" placeholder="رقم الهاتف" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                <input className={input} autoComplete="street-address" placeholder="العنوان (للتوصيل)" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                <label className="flex items-start gap-2.5 text-xs font-bold text-black/65 leading-relaxed cursor-pointer">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 shrink-0" style={{ accentColor: accent }} checked={profile.marketing} onChange={(e) => setProfile({ ...profile, marketing: e.target.checked })} />
                  أوافق على استلام عروض {pageName || 'هذه الصفحة'} على بريدي الإلكتروني (يمكنني إلغاء ذلك في أي وقت).
                </label>
                {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
                <button type="submit" disabled={busy} className={primary} style={{ backgroundColor: accent }}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : null}
                  {step === 'profile' ? 'اشترك' : saved ? 'تم الحفظ' : 'حفظ بياناتي'}
                </button>
              </form>
            )}

            {step === 'account' && kind === 'restaurant' && (
              <div className="space-y-2">
                <div className="text-sm font-black">طلباتي</div>
                {orders === null ? (
                  <div className="flex justify-center py-3"><Loader2 size={20} className="animate-spin text-black/30" /></div>
                ) : orders.length === 0 ? (
                  <p className="text-xs text-black/45">لا طلبات بعد. طلباتك التالية من هنا تظهر في هذه القائمة.</p>
                ) : (
                  orders.map((o) => {
                    const status = ORDER_STATUSES.find((s) => s.id === o.status) || ORDER_STATUSES[0];
                    return (
                      <div key={o.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-black/5 text-xs">
                        <div className="min-w-0">
                          <div className="font-black">طلب #{o.number} · {formatMoney(Number(o.total) || 0, currency)}</div>
                          <div className="text-black/45 truncate">{new Date(o.createdAt).toLocaleDateString('ar')} · {(o.lines || []).map((l: any) => l.name).join('، ')}</div>
                        </div>
                        <span className="shrink-0 px-2.5 h-6 rounded-full text-white font-bold flex items-center" style={{ backgroundColor: status.color }}>{status.label}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {(step === 'profile' || step === 'account') && (
              <div className="flex justify-between gap-3 pt-1">
                {step === 'account' ? <button type="button" className={link} onClick={handleLeave}>إلغاء الاشتراك في الصفحة</button> : <span />}
                <button type="button" className={`${link} flex items-center gap-1`} onClick={handleSignOut}><LogOut size={13} /> خروج</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
