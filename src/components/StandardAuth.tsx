import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Palette } from 'lucide-react';
import { auth } from '../services/firebase';
import { SignInError, registerOwner, resolveAccountId, signInOwner } from '../services/accounts';
import { EmailCodeProblem, emailCodeErrorText, needsEmailCode, sendEmailCode, verifyEmailCode } from '../services/emailCode';
import { pendingInvite } from '../services/members';
import { DESIGNER_NAME_MAX, becomeDesigner } from '../services/designers';

interface StandardAuthProps {
  onLoginWithGoogle: () => Promise<void>;
  // asDesigner: the account was just made through «انضم لمصممينا»; the app opens the designer's page.
  onAuthSuccess: (userUid: string, isNewUser: boolean, asDesigner?: boolean) => void;
}

const signInErrorText = (e: unknown, register = false) => {
  const kind = e instanceof SignInError ? e.kind : 'network';
  if (kind === 'credentials') return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى مراجعة المدخلات.';
  if (kind === 'exists') return 'البريد الإلكتروني المدخل مسجل مسبقاً بموجب حساب آخر! يرجى الدخول مباشرة.';
  if (kind === 'weak') return 'يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل لحماية حسابك.';
  if (kind === 'disabled') return 'تسجيل الدخول بالبريد غير مفعّل بعد في Firebase (Authentication ← Email/Password).';
  return register ? 'حدث خطأ أثناء إنشاء حسابك. يرجى المحاولة لاحقاً.' : 'تعذر تسجيل الدخول. يرجى التحقق من اتصالك بالإنترنت.';
};

export const StandardAuth: React.FC<StandardAuthProps> = ({
  onLoginWithGoogle,
  onAuthSuccess
}) => {
  // 'login' represents Image 1 (هل لديك حساب), 'signup' represents Image 2 (إنشاء حساب)
  // 'code': a new account confirms its email with the 6-digit code sent to it.
  // 'designer': «انضم لمصممينا», a signup that also makes the account a designer.
  const [mode, setMode] = useState<'login' | 'signup' | 'code' | 'designer'>('login');
  const [designerName, setDesignerName] = useState('');

  // Input States
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // The account to open once the email is confirmed.
  const [pending, setPending] = useState<{ accountId: string; isNew: boolean; designer: boolean } | null>(null);
  const [code, setCode] = useState('');
  const [resendWait, setResendWait] = useState(0);

  useEffect(() => {
    if (resendWait <= 0) return;
    const t = window.setTimeout(() => setResendWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendWait]);

  const sendCode = async () => {
    const user = auth.currentUser;
    if (!user) return 'skipped' as const;
    try {
      const sent = await sendEmailCode(user);
      if (sent === 'sent') setResendWait(60);
      return sent;
    } catch (err) {
      if (err instanceof EmailCodeProblem && err.kind === 'too_soon') setResendWait(err.waitSeconds);
      setError(emailCodeErrorText(err));
      return 'sent' as const;
    }
  };

  // Opens the account, after the email-code step when this is a new registration.
  const finishSignIn = async (accountId: string, isNew: boolean, designer = false) => {
    const user = auth.currentUser;
    if (!user || !needsEmailCode(user, accountId)) {
      onAuthSuccess(accountId, isNew, designer);
      return;
    }
    setError(null);
    if ((await sendCode()) !== 'sent') {
      onAuthSuccess(accountId, isNew, designer);
      return;
    }
    setPending({ accountId, isNew, designer });
    setCode('');
    setMode('code');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !pending) return;
    if (code.replace(/\D/g, '').length !== 6) {
      setError('الرمز مكوّن من 6 أرقام.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyEmailCode(user, code);
      onAuthSuccess(pending.accountId, pending.isNew, pending.designer);
    } catch (err) {
      setError(emailCodeErrorText(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setCode('');
    await sendCode();
  };

  const handleChangeEmail = async () => {
    await auth.signOut().catch(() => {});
    setError(null);
    setMode(pending?.designer ? 'designer' : 'signup');
    setPending(null);
  };

  // "دخول مباشر": back into the account this browser is still signed in to (Firebase keeps the
  // sign-in), without typing the password again.
  const handleDirectLogin = async () => {
    const user = auth.currentUser;
    if (user && !user.isAnonymous) {
      await finishSignIn(await resolveAccountId(user), false);
      return;
    }
    setError('لا يوجد حساب مسجّل الدخول على هذا المتصفح. سجّل الدخول بالبريد وكلمة المرور.');
  };

  // Handle Log In (الصورة الأولى)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await finishSignIn(await signInOwner(email.trim().toLowerCase(), password), false);
    } catch (err) {
      console.warn('Authentication login failure:', err);
      setError(signInErrorText(err));
    } finally {
      setLoading(false);
    }
  };

  // «انضم لمصممينا»: the same account as any owner, plus the designer's profile.
  const handleRegisterDesigner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (designerName.trim().length < 2) {
      setError('اكتب اسمك كما سيظهر للزبائن في معرض المصممين.');
      return;
    }
    if (!email.trim() || !password || !confirmPassword) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور وتأكيدها.');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين. يرجى التحقق وإعادة الإدخال.');
      return;
    }
    if (password.length < 6) {
      setError('يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل لحماية حسابك.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { accountId, isNew } = await registerOwner(email.trim().toLowerCase(), password);
      const user = auth.currentUser;
      if (user) await becomeDesigner(user.uid, designerName);
      await finishSignIn(accountId, isNew, true);
    } catch (err) {
      console.error('Designer registration flow error:', err);
      setError(signInErrorText(err, true));
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration (الصورة الثانية)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !confirmPassword) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور وتأكيدها.');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين. يرجى التحقق وإعادة الإدخال.');
      return;
    }
    if (password.length < 6) {
      setError('يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل لحماية حسابك.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { accountId, isNew } = await registerOwner(email.trim().toLowerCase(), password);
      await finishSignIn(accountId, isNew);
    } catch (err) {
      console.error('Registration flow error:', err);
      setError(signInErrorText(err, true));
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = 'w-full h-11 px-3 rounded-ctl border border-line bg-surface text-sm text-ink placeholder:text-faint focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition';
  const primaryClass = 'w-full h-12 rounded-ctl bg-brand hover:bg-brand-hover text-white text-sm font-bold transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2';
  const errorLine = error && (
    <p role="alert" className="text-xs text-danger font-bold leading-relaxed flex items-start gap-1.5">
      <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
    </p>
  );
  const passwordField = (label: string, value: string, set: (v: string) => void, shown: boolean, toggle: () => void, name: string, autoComplete: string) => (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-muted">{label}</span>
      <span className="relative block">
        <input
          type={shown ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder="••••••••"
          className={`${fieldClass} pl-11`}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={shown ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-ctl flex items-center justify-center text-faint hover:text-ink cursor-pointer"
        >
          {shown ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
  const emailField = (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-muted">إيميل</span>
      <input
        type="email"
        name="email"
        autoComplete="username"
        required
        dir="ltr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="example@email.com"
        className={`${fieldClass} text-left`}
      />
    </label>
  );

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center px-4 py-16 select-none" dir="rtl">
      <div className="w-full max-w-[420px] space-y-5">
        <div className="flex items-center justify-center gap-2">
          <span className="w-8 h-8 rounded-ctl bg-brand text-white flex items-center justify-center font-bold">W</span>
          <span className="text-lg font-bold tracking-tight font-logo">weelink</span>
        </div>

        {pendingInvite() && (
          <div className="p-4 rounded-card bg-brand/5 border border-brand/20 text-sm font-bold text-brand leading-relaxed">
            دُعيت لإدارة مطعم على Weelink. سجّل الدخول أو أنشئ حساباً بنفس البريد الإلكتروني الذي دُعيت به.
          </div>
        )}

        <div className="bg-surface border border-line rounded-card p-6 sm:p-8">
          {mode === 'login' && (
            <div className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <h1 className="text-heading font-bold">هل لديك حساب</h1>
                {emailField}
                {passwordField('كلمة السر', password, setPassword, showPassword, () => setShowPassword(!showPassword), 'password', 'current-password')}
                {errorLine}
                <button type="submit" disabled={loading} className={primaryClass}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'جاري التحقق والدخول...' : 'دخول'}
                </button>
              </form>

              <div className="flex items-center gap-3 text-xs text-faint">
                <span className="flex-1 h-px bg-line" /> أو <span className="flex-1 h-px bg-line" />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onLoginWithGoogle}
                  className="w-full h-11 rounded-ctl border border-line bg-surface hover:bg-bg text-sm font-bold text-ink transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <GoogleMark /> سجّل بحساب Google
                </button>
                <button
                  type="button"
                  onClick={handleDirectLogin}
                  title="دخول سريع للحساب المسجّل الدخول على هذا المتصفح"
                  className="w-full h-11 rounded-ctl text-sm font-bold text-brand hover:bg-brand/5 transition cursor-pointer"
                >
                  دخول مباشر
                </button>
              </div>
            </div>
          )}

          {mode === 'designer' && (
            <form onSubmit={handleRegisterDesigner} className="space-y-4">
              <div className="space-y-1.5">
                <h1 className="text-heading font-bold">انضم لمصممينا</h1>
                <p className="text-sm text-muted leading-relaxed">صفحتك مجانية، وفيها معرض لشرائحك. صمّم شرائح جاهزة، وأضف لها ما تريد، واكسب من تصميم صفحات الزبائن.</p>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-muted">اسمك كما سيظهر للزبائن</span>
                <input
                  type="text"
                  name="designer-name"
                  autoComplete="name"
                  required
                  maxLength={DESIGNER_NAME_MAX}
                  value={designerName}
                  onChange={(e) => setDesignerName(e.target.value)}
                  placeholder="مثال: سارة للتصميم"
                  className={fieldClass}
                />
              </label>
              {emailField}
              {passwordField('كلمة السر', password, setPassword, showPassword, () => setShowPassword(!showPassword), 'password', 'new-password')}
              {passwordField('إعادة كلمة السر', confirmPassword, setConfirmPassword, showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword), 'confirm-password', 'new-password')}
              {errorLine}
              <button type="submit" disabled={loading} className={primaryClass}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'جاري إنشاء حسابك...' : 'انضم كمصمم'}
              </button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <h1 className="text-heading font-bold">إنشاء حساب</h1>
              {emailField}
              {passwordField('كلمة السر', password, setPassword, showPassword, () => setShowPassword(!showPassword), 'password', 'new-password')}
              {passwordField('إعادة كلمة السر', confirmPassword, setConfirmPassword, showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword), 'confirm-password', 'new-password')}
              {errorLine}
              <button type="submit" disabled={loading} className={primaryClass}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'جاري إنشاء حسابك...' : 'إنشاء الحساب'}
              </button>
            </form>
          )}

          {/* Confirm the email of a new account with the code sent to it */}
          {mode === 'code' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-heading font-bold">أكّد بريدك الإلكتروني</h1>
                <p className="text-sm text-muted leading-relaxed">
                  أرسلنا رمزاً من 6 أرقام إلى <span dir="ltr" className="font-bold text-ink">{auth.currentUser?.email}</span>. إن لم تجده فانظر في البريد المزعج (Spam).
                </p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                dir="ltr"
                aria-label="رمز التأكيد"
                className={`${fieldClass} h-14 text-center text-title font-bold tracking-[0.5em]`}
              />
              {errorLine}
              <button type="submit" disabled={loading} className={primaryClass}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'جاري التحقق...' : 'تأكيد'}
              </button>
              <div className="flex justify-between gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendWait > 0}
                  className="text-brand disabled:text-faint cursor-pointer disabled:cursor-default"
                >
                  {resendWait > 0 ? `إرسال رمز جديد بعد ${resendWait} ثانية` : 'إرسال رمز جديد'}
                </button>
                <button type="button" onClick={handleChangeEmail} className="text-muted hover:text-ink cursor-pointer">
                  استخدام بريد آخر
                </button>
              </div>
            </form>
          )}
        </div>

        {mode === 'login' && (
          <p className="text-center text-sm text-muted">
            ما عندك حساب؟{' '}
            <button type="button" onClick={() => { setMode('signup'); setError(null); }} className="font-bold text-brand hover:text-brand-hover cursor-pointer">
              أنشئ حساباً مجانياً
            </button>
          </p>
        )}
        {mode === 'login' && (
          <button
            type="button"
            onClick={() => { setMode('designer'); setError(null); }}
            className="w-full text-right bg-surface border border-line hover:border-brand/40 rounded-card p-4 flex items-center gap-3 transition cursor-pointer"
          >
            <span className="w-11 h-11 rounded-ctl bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Palette size={22} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-ink">انضم لمصممينا</span>
              <span className="block text-xs text-muted leading-relaxed">اعمل صفحتك مجاناً واكسب من التصميم للزبائن</span>
            </span>
            <ArrowLeft size={18} className="text-faint shrink-0" />
          </button>
        )}
        {(mode === 'signup' || mode === 'designer') && (
          <p className="text-center text-sm text-muted">
            عندك حساب؟{' '}
            <button type="button" onClick={() => { setMode('login'); setError(null); }} className="font-bold text-brand hover:text-brand-hover cursor-pointer">
              سجّل دخولك
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

// Google's "G", for the sign-in button.
const GoogleMark = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
    <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
  </svg>
);
