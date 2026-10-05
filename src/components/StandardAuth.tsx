import React, { useState } from 'react';
import { loginWithEmail, registerWithEmail, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// TEMPORARY: used by the "دخول مباشر" testing shortcut below.
const LAST_ACCOUNT_KEY = 'weelink_last_login_account';
const rememberLastAccount = (uid: string, email: string) => {
  try {
    localStorage.setItem(LAST_ACCOUNT_KEY, JSON.stringify({ uid, email }));
  } catch {
    // storage unavailable: the shortcut simply won't find an account
  }
};

interface StandardAuthProps {
  onLoginWithGoogle: () => Promise<void>;
  onAuthSuccess: (userUid: string, isNewUser: boolean) => void;
}

export const StandardAuth: React.FC<StandardAuthProps> = ({
  onLoginWithGoogle,
  onAuthSuccess
}) => {
  // 'login' represents Image 1 (هل لديك حساب), 'signup' represents Image 2 (إنشاء حساب)
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Input States
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // TEMPORARY (testing shortcut, to be removed): "دخول مباشر" signs straight
  // into the last account that logged in with email on this browser. Logout
  // clears weelink_simulated_user_*, so the account is kept in its own key.
  const handleDirectLogin = () => {
    try {
      const last = JSON.parse(localStorage.getItem(LAST_ACCOUNT_KEY) || 'null');
      if (last && last.uid) {
        localStorage.setItem('weelink_simulated_user_uid', last.uid);
        localStorage.setItem('weelink_simulated_user_email', last.email || '');
        onAuthSuccess(last.uid, false);
        return;
      }
    } catch {
      // fall through to the message below
    }
    setError('لا يوجد حساب سابق على هذا المتصفح. سجّل الدخول مرة واحدة بالبريد وكلمة المرور، وبعدها يعمل الدخول المباشر.');
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

    const targetEmail = email.trim().toLowerCase();

    try {
      // 1. Try simulated fallback login in Firestore first (highly resilient)
      const simUserRef = doc(db, 'simulated_users', targetEmail);
      const simUserSnap = await getDoc(simUserRef);

      if (simUserSnap.exists()) {
        const simUserData = simUserSnap.data();
        if (simUserData.password === password) {
          localStorage.setItem('weelink_simulated_user_uid', simUserData.uid);
          localStorage.setItem('weelink_simulated_user_email', targetEmail);
          rememberLastAccount(simUserData.uid, targetEmail);
          onAuthSuccess(simUserData.uid, false);
          setLoading(false);
          return;
        } else {
          setError('كلمة المرور المدخلة غير صحيحة. يرجى المحاولة مجدداً.');
          setLoading(false);
          return;
        }
      }

      // 2. Try standard Firebase Auth Login
      const user = await loginWithEmail(targetEmail, password);
      if (user) {
        onAuthSuccess(user.uid, false);
      }
    } catch (err: any) {
      console.warn('Authentication login failure:', err);
      if (
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/invalid-credential' ||
        err.message?.includes('invalid')
      ) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى مراجعة المدخلات.');
      } else {
        setError('تعذر تسجيل الدخول. يرجى التحقق من اتصالك بالإنترنت.');
      }
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

    const targetEmail = email.trim().toLowerCase();
    const simUid = 'sim_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

    try {
      // 1. Check if email already registered in simulated users
      const simUserRef = doc(db, 'simulated_users', targetEmail);
      const simUserSnap = await getDoc(simUserRef);
      if (simUserSnap.exists()) {
        setError('البريد الإلكتروني المدخل مسجل مسبقاً بموجب حساب آخر! يرجى الدخول مباشرة.');
        setLoading(false);
        return;
      }

      // 2. Try Firebase Auth sign up first
      let firebaseUser = null;
      try {
        firebaseUser = await registerWithEmail(targetEmail, password);
      } catch (authErr: any) {
        console.warn('Firebase registration fallback triggered:', authErr);
        if (authErr.code === 'auth/email-already-in-use') {
          setError('البريد الإلكتروني المدخل مسجل مسبقاً بموجب حساب آخر! يرجى الدخول مباشرة.');
          setLoading(false);
          return;
        }
      }

      const activeUid = firebaseUser ? firebaseUser.uid : simUid;

      // 3. Save user info to the simulated_users collection
      await setDoc(simUserRef, {
        email: targetEmail,
        password: password,
        uid: activeUid,
        createdAt: new Date().toISOString()
      });

      // 4. Set local session credentials
      localStorage.setItem('weelink_simulated_user_uid', activeUid);
      localStorage.setItem('weelink_simulated_user_email', targetEmail);
      rememberLastAccount(activeUid, targetEmail);

      // 5. Complete Onboarding with fresh blank page layout
      onAuthSuccess(activeUid, true);

    } catch (err: any) {
      console.error('Registration flow error:', err);
      setError('حدث خطأ أثناء إنشاء حسابك. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6 py-12 md:py-24 font-sans select-none" dir="rtl">
      <div className="w-full max-w-[420px] space-y-12">
        
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

              {/* TEMPORARY testing shortcut: enter the last account used on this browser. */}
              <button
                type="button"
                onClick={handleDirectLogin}
                className="flex-1 py-3 px-4 border border-[#0071e3] text-[#0071e3] rounded-lg text-xs font-bold hover:bg-[#0071e3]/5 transition-all cursor-pointer text-center"
                title="دخول سريع لآخر حساب سُجّل الدخول به على هذا المتصفح (للتجربة فقط)"
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
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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

      </div>
    </div>
  );
};
