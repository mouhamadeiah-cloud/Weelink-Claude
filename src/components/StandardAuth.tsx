import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { SignInError, registerOwner, resolveAccountId, signInOwner } from '../services/accounts';
import { EmailCodeProblem, emailCodeErrorText, needsEmailCode, sendEmailCode, verifyEmailCode } from '../services/emailCode';
import { pendingInvite } from '../services/members';

interface StandardAuthProps {
  onLoginWithGoogle: () => Promise<void>;
  onAuthSuccess: (userUid: string, isNewUser: boolean) => void;
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
  const [mode, setMode] = useState<'login' | 'signup' | 'code'>('login');

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
  const [pending, setPending] = useState<{ accountId: string; isNew: boolean } | null>(null);
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
  const finishSignIn = async (accountId: string, isNew: boolean) => {
    const user = auth.currentUser;
    if (!user || !needsEmailCode(user, accountId)) {
      onAuthSuccess(accountId, isNew);
      return;
    }
    setError(null);
    if ((await sendCode()) !== 'sent') {
      onAuthSuccess(accountId, isNew);
      return;
    }
    setPending({ accountId, isNew });
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
      onAuthSuccess(pending.accountId, pending.isNew);
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
    setPending(null);
    setError(null);
    setMode('signup');
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

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6 py-12 md:py-24 font-sans select-none" dir="rtl">
      <div className="w-full max-w-[420px] space-y-12">
        {pendingInvite() && (
          <div className="p-4 rounded-2xl bg-[#0071e3]/5 border border-[#0071e3]/20 text-sm font-bold text-[#0071e3] leading-relaxed text-right">
            دُعيت لإدارة مطعم على Weelink. سجّل الدخول أو أنشئ حساباً بنفس البريد الإلكتروني الذي دُعيت به.
          </div>
        )}
        
        {/* IMAGE 1: LOGIN MODE (هل لديك حساب) */}
        {mode === 'login' && (
          <div className="space-y-10">
            {/* Top row buttons exactly like Image 1 */}
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={onLoginWithGoogle}
                className="flex-1 py-3 px-4 border border-black rounded-lg text-xs font-bold text-black hover:bg-neutral-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <img 
                  src="https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=40&q=80" 
                  alt="Google" 
                  className="w-4 h-4 rounded-full"
                />
                <span>سجل بحساب Google</span>
              </button>

              <button
                type="button"
                onClick={handleDirectLogin}
                className="flex-1 py-3 px-4 border border-[#0071e3] text-[#0071e3] rounded-lg text-xs font-bold hover:bg-[#0071e3]/5 transition-all cursor-pointer text-center"
                title="دخول سريع للحساب المسجّل الدخول على هذا المتصفح"
              >
                دخول مباشر
              </button>
              
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className="flex-1 py-3 px-4 bg-black text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer text-center"
              >
                أنشئ حساباً مجانياً
              </button>
            </div>

            {/* Form Section */}
            <form onSubmit={handleLogin} className="space-y-6 pt-4">
              <div className="space-y-2 text-right">
                <h2 className="text-xl font-black text-neutral-900">هل لديك حساب</h2>
              </div>

              {/* Email Input */}
              <div className="space-y-1 text-right">
                <span className="text-xs font-bold text-neutral-500 block">إيميل</span>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full text-sm font-semibold py-3 px-1 border-b-2 border-neutral-200 focus:border-black bg-transparent focus:outline-none transition-all"
                  />
                  <div className="absolute left-1 bottom-3.5 text-neutral-400 text-xs">
                    ✓
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1 text-right">
                <span className="text-xs font-bold text-neutral-500 block">كلمة السر</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm font-semibold py-3 pl-10 pr-1 border-b-2 border-neutral-200 focus:border-black bg-transparent focus:outline-none transition-all text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-1 bottom-3 text-neutral-400 hover:text-black cursor-pointer text-sm p-1"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 font-bold leading-relaxed text-right animate-fade-in">
                  ⚠️ {error}
                </p>
              )}

              {/* Submit Button exactly as specified */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-sm font-black shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{loading ? 'جاري التحقق والدخول...' : 'بناء صفحة مجاناً مع wee ai'}</span>
              </button>
            </form>
          </div>
        )}

        {/* IMAGE 2: SIGN UP MODE (إنشاء حساب) */}
        {mode === 'signup' && (
          <div className="space-y-8 animate-fade-in">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2 text-right">
                <h2 className="text-xl font-black text-neutral-900">إنشاء حساب</h2>
              </div>

              {/* Email Input */}
              <div className="space-y-1 text-right">
                <span className="text-xs font-bold text-neutral-500 block">إيميل</span>
                <input
                  type="email"
                    name="email"
                    autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full text-sm font-semibold py-3 px-1 border-b-2 border-neutral-200 focus:border-black bg-transparent focus:outline-none transition-all"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1 text-right">
                <span className="text-xs font-bold text-neutral-500 block">كلمة السر</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm font-semibold py-3 pl-10 pr-1 border-b-2 border-neutral-200 focus:border-black bg-transparent focus:outline-none transition-all text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-1 bottom-3 text-neutral-400 hover:text-black cursor-pointer text-sm p-1"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1 text-right">
                <span className="text-xs font-bold text-neutral-500 block">إعادة كلمة السر</span>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm-password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm font-semibold py-3 pl-10 pr-1 border-b-2 border-neutral-200 focus:border-black bg-transparent focus:outline-none transition-all text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-1 bottom-3 text-neutral-400 hover:text-black cursor-pointer text-sm p-1"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 font-bold leading-relaxed text-right animate-fade-in">
                  ⚠️ {error}
                </p>
              )}

              {/* Register Button exactly as specified */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-sm font-black shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{loading ? 'جاري إنشاء حسابك وبناء موقعك السحابي...' : 'بناء الصفحة مجاناً'}</span>
              </button>
            </form>

            {/* Back link to login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="text-xs text-neutral-500 hover:text-black font-bold underline decoration-neutral-300 transition-all cursor-pointer"
              >
                العودة لتسجيل الدخول (« هل لديك حساب)
              </button>
            </div>
          </div>
        )}

        {/* Confirm the email of a new account with the code sent to it */}
        {mode === 'code' && (
          <form onSubmit={handleVerify} className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-right">
              <h2 className="text-xl font-black text-neutral-900">أكّد بريدك الإلكتروني</h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                أرسلنا رمزاً من 6 أرقام إلى <span dir="ltr" className="font-bold text-neutral-900">{auth.currentUser?.email}</span>. إن لم تجده فانظر في البريد المزعج (Spam).
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
              className="w-full text-center text-2xl font-black tracking-[0.5em] py-3 px-1 border-b-2 border-neutral-200 focus:border-black bg-transparent focus:outline-none transition-all"
            />

            {error && (
              <p className="text-xs text-red-600 font-bold leading-relaxed text-right animate-fade-in">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-sm font-black shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{loading ? 'جاري التحقق...' : 'تأكيد'}</span>
            </button>

            <div className="flex justify-between gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendWait > 0}
                className="text-[#0071e3] disabled:text-neutral-400 cursor-pointer disabled:cursor-default"
              >
                {resendWait > 0 ? `إرسال رمز جديد بعد ${resendWait} ثانية` : 'إرسال رمز جديد'}
              </button>
              <button
                type="button"
                onClick={handleChangeEmail}
                className="text-neutral-500 hover:text-black underline decoration-neutral-300 cursor-pointer"
              >
                استخدام بريد آخر
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
