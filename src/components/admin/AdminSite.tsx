// The platform admin site (admin.testweelink.de, or ?admin on any Weelink address): sign in,
// choose a new password the first time, then the subscribers list with search and filters.
// All data comes from /api/admin; nothing here reads Firebase directly.
import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, ChevronDown, Coins, CreditCard, KeyRound, Loader2, LogOut, Menu, Palette, Search, ShieldCheck, UserCog, Users, X } from 'lucide-react';
import { SubscriberDetail } from './SubscriberDetail';
import { PaymentsView } from './PaymentsView';
import { BillingSettings } from './BillingSettings';
import { TokensView } from './TokensView';
import { TeamView } from './TeamView';
import { TasksView } from './TasksView';
import { ChatView } from './ChatView';
import { PageLawView } from './PageLawView';
import { SlidesReviewView } from './SlidesReviewView';
import { DesignOrdersView } from './DesignOrdersView';
import {
  AdminError, AdminInfo, SubscriberQuery, SubscribersResult,
  adminChangePassword, adminLogin, adminMe, adminSubscribers, getAdminToken, setAdminToken,
} from '../../services/adminApi';

const LOGIN_ERRORS: Record<string, string> = {
  wrong: 'اسم المستخدم أو كلمة السر غير صحيحة.',
  frozen: 'هذا الحساب مجمّد. تواصل مع المدير.',
  network: 'تعذّر الاتصال. جرّب مرة ثانية.',
  'not-configured': 'الخادم غير مُعدّ بعد (FIREBASE_SERVICE_ACCOUNT غير موجود في Vercel).',
};
const loginError = (e: unknown) => {
  if (e instanceof AdminError && e.code === 'locked') return `محاولات كثيرة خاطئة. جرّب بعد ${e.extra.minutes} دقيقة.`;
  return LOGIN_ERRORS[(e as AdminError)?.code] || 'حدث خطأ. جرّب مرة ثانية.';
};

const inputCls = 'w-full rounded-ctl border border-line bg-surface px-3 py-2.5 text-body text-ink outline-none focus:border-brand';
const btnCls = 'inline-flex items-center justify-center gap-2 rounded-ctl bg-brand px-4 py-2.5 text-body font-medium text-white hover:bg-brand-hover disabled:opacity-50';

const Shell: React.FC<{ children: React.ReactNode; admin?: AdminInfo | null; onLogout?: () => void; menu?: React.ReactNode }> = ({ children, admin, onLogout, menu }) => {
  const [drawer, setDrawer] = useState(false);
  return (
    <div dir="rtl" className="min-h-screen bg-bg font-sans text-ink">
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 font-logo text-heading font-semibold">
          {menu && <button onClick={() => setDrawer(true)} className="rounded-ctl p-1 hover:bg-bg lg:hidden" aria-label="القائمة"><Menu className="h-5 w-5" /></button>}
          <ShieldCheck className="h-5 w-5 text-brand" /> Weelink · الإدارة
        </div>
        {admin && (
          <div className="flex items-center gap-3 text-small text-muted">
            <span>{admin.name} ({admin.username})</span>
            <button onClick={onLogout} className="inline-flex items-center gap-1 rounded-ctl px-2 py-1 hover:bg-bg" title="تسجيل الخروج"><LogOut className="h-4 w-4" /> خروج</button>
          </div>
        )}
      </header>
      {/* The menu bar is on the left (the second child of an RTL row); on a phone it slides in. */}
      <div className="flex">
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6"><div className="mx-auto max-w-6xl">{children}</div></main>
        {menu && (
          <>
            {drawer && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setDrawer(false)} />}
            <aside dir="rtl" className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-line bg-surface p-3 transition-transform lg:static lg:z-auto lg:min-h-[calc(100vh-57px)] lg:translate-x-0 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
              <button onClick={() => setDrawer(false)} className="mb-2 rounded-ctl p-1 hover:bg-bg lg:hidden" aria-label="إغلاق"><X className="h-5 w-5" /></button>
              <div onClick={() => setDrawer(false)}>{menu}</div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
};

type View = 'subscribers' | 'payments' | 'billing' | 'tokens' | 'team' | 'my-tasks' | 'all-tasks' | 'chat' | 'page-law' | 'slides' | 'design-orders' | 'password';
interface MenuGroup { id: string; title: string; icon: React.ElementType; items: { id: string; label: string; view?: View; needs?: string }[] }
// Every group starts folded; the admin opens what he needs. Items without a view are the next phases.
const MENU: MenuGroup[] = [
  { id: 'subs', title: 'المشتركون', icon: Users, items: [{ id: 'list', label: 'قائمة المشتركين', view: 'subscribers' }] },
  { id: 'pay', title: 'الاشتراك والدفع', icon: CreditCard, items: [{ id: 'payments', label: 'كل الدفعات والفواتير', view: 'payments', needs: 'payments' }, { id: 'billing', label: 'إعدادات الفوترة', view: 'billing', needs: 'get-company' }] },
  { id: 'tokens', title: 'التوكنز والتكلفة', icon: Coins, items: [{ id: 'usage', label: 'الاستهلاك والأسعار', view: 'tokens', needs: 'tokens-overview' }] },
  { id: 'team', title: 'فريق الإدارة', icon: UserCog, items: [{ id: 'admins', label: 'الأدمنز والصلاحيات', view: 'team', needs: 'admins-list' }, { id: 'my-tasks', label: 'مهامي', view: 'my-tasks' }, { id: 'all-tasks', label: 'كل المهام', view: 'all-tasks', needs: 'task-create' }, { id: 'chat', label: 'لوحة التواصل', view: 'chat' }] },
  { id: 'designers', title: 'معرض المصممين', icon: Palette, items: [{ id: 'slides', label: 'مراجعة الشرائح', view: 'slides', needs: 'slides-review-list' }, { id: 'orders', label: 'طلبات التصميم', view: 'design-orders', needs: 'design-orders' }, { id: 'law', label: 'قانون الصفحة', view: 'page-law', needs: 'page-law-get' }] },
  { id: 'books', title: 'الحسابات والداشبورد', icon: BarChart3, items: [{ id: 'dash', label: 'الداشبورد' }] },
  { id: 'me', title: 'حسابي', icon: KeyRound, items: [{ id: 'pw', label: 'تغيير كلمة السر', view: 'password' }] },
];

const SideMenu: React.FC<{ view: View | null; onView: (v: View) => void; can: string[] }> = ({ view, onView, can }) => {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setOpen((o) => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <nav className="flex flex-col gap-1">
      {MENU.map((g) => ({ ...g, items: g.items.filter((it) => !it.needs || can.includes(it.needs)) })).filter((g) => g.items.length).map((g) => {
        const Icon = g.icon;
        const isOpen = open.has(g.id);
        return (
          <div key={g.id}>
            <button onClick={(e) => { e.stopPropagation(); toggle(g.id); }} aria-expanded={isOpen} className="flex w-full items-center gap-2 rounded-ctl px-3 py-2 text-body hover:bg-bg">
              <Icon className="h-4 w-4 text-muted" />
              <span className="flex-1 text-right">{g.title}</span>
              <ChevronDown className={`h-4 w-4 text-faint transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="mr-4 flex flex-col border-r border-line pr-2">
                {g.items.map((it) => it.view ? (
                  <button key={it.id} onClick={() => onView(it.view!)} className={`rounded-ctl px-3 py-1.5 text-right text-small hover:bg-bg ${view === it.view ? 'bg-bg font-medium text-brand' : 'text-muted'}`}>{it.label}</button>
                ) : (
                  <span key={it.id} className="flex items-center justify-between px-3 py-1.5 text-small text-faint">{it.label}<span className="text-tiny">قريباً</span></span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const LoginForm: React.FC<{ onDone: (a: AdminInfo) => void }> = ({ onDone }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await adminLogin(username, password);
      setAdminToken(r.token);
      onDone(r.admin);
    } catch (err) {
      setError(loginError(err));
    }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="mx-auto mt-10 flex max-w-sm flex-col gap-3 rounded-card border border-line bg-surface p-6">
      <h1 className="text-heading font-semibold">تسجيل دخول الإدارة</h1>
      <label className="text-small text-muted">اسم المستخدم<input dir="ltr" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} className={`${inputCls} mt-1`} /></label>
      <label className="text-small text-muted">كلمة السر<input dir="ltr" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} mt-1`} /></label>
      {error && <p className="text-small text-danger">{error}</p>}
      <button disabled={busy || !password} className={btnCls}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} دخول</button>
    </form>
  );
};

const ChangePassword: React.FC<{ forced: boolean; onDone: (a: AdminInfo) => void }> = ({ forced, onDone }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== again) return setError('كلمتا السر الجديدتان غير متطابقتين.');
    setBusy(true);
    setError('');
    try {
      const r = await adminChangePassword(current, next);
      setAdminToken(r.token);
      onDone(r.admin);
    } catch (err) {
      const code = (err as AdminError)?.code;
      setError(code === 'wrong' ? 'كلمة السر الحالية غير صحيحة.' : code === 'short' ? 'كلمة السر الجديدة 8 أحرف على الأقل.' : code === 'same' ? 'اختر كلمة سر مختلفة عن الحالية وعن الافتراضية.' : 'تعذّر التغيير. جرّب مرة ثانية.');
    }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="mx-auto mt-10 flex max-w-sm flex-col gap-3 rounded-card border border-line bg-surface p-6">
      <h1 className="text-heading font-semibold">{forced ? 'اختر كلمة سر جديدة' : 'تغيير كلمة السر'}</h1>
      {forced && <p className="text-small text-muted">كلمة السر الحالية مؤقتة ولا تفتح شيئاً قبل تغييرها.</p>}
      <label className="text-small text-muted">كلمة السر الحالية<input dir="ltr" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={`${inputCls} mt-1`} /></label>
      <label className="text-small text-muted">الجديدة (8 أحرف على الأقل)<input dir="ltr" type="password" value={next} onChange={(e) => setNext(e.target.value)} className={`${inputCls} mt-1`} /></label>
      <label className="text-small text-muted">أعد كتابتها<input dir="ltr" type="password" value={again} onChange={(e) => setAgain(e.target.value)} className={`${inputCls} mt-1`} /></label>
      {error && <p className="text-small text-danger">{error}</p>}
      <button disabled={busy || !current || !next} className={btnCls}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ</button>
    </form>
  );
};

const KIND: Record<string, string> = { free: 'صفحة', restaurant: 'مطعم', shop: 'متجر', cars: 'سيارات' };
const date = (ms: number) => (ms ? new Date(ms).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const fmt = (n: number) => n.toLocaleString('ar-SY');

const Select: React.FC<{ value: string; onChange: (v: string) => void; options: [string, string][] }> = ({ value, onChange, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-ctl border border-line bg-surface px-3 py-2 text-small">
    {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
  </select>
);

const Subscribers: React.FC<{ onSessionEnd: () => void; can: string[] }> = ({ onSessionEnd, can }) => {
  const [query, setQuery] = useState<SubscriberQuery>({ q: '', state: 'all', published: 'all', verified: 'all', status: 'all', sub: 'all' });
  const [result, setResult] = useState<SubscribersResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openUid, setOpenUid] = useState('');

  const load = useCallback(async (q: SubscriberQuery) => {
    setLoading(true);
    setError('');
    try {
      setResult(await adminSubscribers(q));
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل المشتركين.');
    }
    setLoading(false);
  }, [onSessionEnd]);

  // Typing waits a moment so every letter does not read all the accounts again.
  useEffect(() => {
    const t = setTimeout(() => load(query), query.q ? 400 : 0);
    return () => clearTimeout(t);
  }, [query, load]);

  const set = (patch: Partial<SubscriberQuery>) => setQuery((q) => ({ ...q, ...patch }));
  const s = result?.summary;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">المشتركون</h1>
      {s && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([['الكل', s.total], ['نشطون', s.active], ['نائمون', s.sleeping], ['عندهم صفحة منشورة', s.withPage]] as [string, number][]).map(([label, n]) => (
            <div key={label} className="rounded-card border border-line bg-surface p-4">
              <div className="text-small text-muted">{label}</div>
              <div className="text-title font-semibold tabular-nums">{fmt(n)}</div>
            </div>
          ))}
        </div>
      )}
      {s && <p className="text-tiny text-faint">«نائم» = لم يدخل منذ أكثر من {s.sleepingAfterDays} يوماً.</p>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input value={query.q} onChange={(e) => set({ q: e.target.value })} placeholder="ابحث بالاسم أو الإيميل أو الهاتف أو اسم الصفحة" className={`${inputCls} pr-9`} />
        </div>
        <Select value={query.state} onChange={(v) => set({ state: v as SubscriberQuery['state'] })} options={[['all', 'كل الحالات'], ['active', 'نشط'], ['sleeping', 'نائم']]} />
        <Select value={query.published} onChange={(v) => set({ published: v as SubscriberQuery['published'] })} options={[['all', 'الصفحات: الكل'], ['yes', 'عنده صفحة منشورة'], ['no', 'بلا صفحة منشورة']]} />
        <Select value={query.status} onChange={(v) => set({ status: v as SubscriberQuery['status'] })} options={[['all', 'الاشتراك: الكل'], ['active', 'فعّال'], ['frozen', 'مجمّد'], ['cancelled', 'ملغى']]} />
        <Select value={query.sub} onChange={(v) => set({ sub: v as SubscriberQuery['sub'] })} options={[['all', 'الباقة: الكل'], ['none', 'بدون اشتراك مدفوع'], ['active', 'فعّال'], ['expiring', 'ينتهي خلال أسبوعين'], ['expired', 'منتهي']]} />
        <Select value={query.verified} onChange={(v) => set({ verified: v as SubscriberQuery['verified'] })} options={[['all', 'الإيميل: الكل'], ['yes', 'مؤكَّد'], ['no', 'غير مؤكَّد']]} />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
      </div>

      {error && <p className="text-small text-danger">{error}</p>}
      {result && (
        <>
          <p className="text-small text-muted">{fmt(result.matched)} مشترك{result.matched > result.rows.length ? ` (أول ${fmt(result.rows.length)} معروضة، ضيّق البحث)` : ''}</p>
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[900px] text-right text-small">
              <thead className="border-b border-line text-muted">
                <tr>{['الاسم', 'الإيميل', 'الهاتف', 'تاريخ الاشتراك', 'آخر نشاط', 'الحالة', 'الاشتراك', 'الصفحات'].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.uid} onClick={() => setOpenUid(r.uid)} className="cursor-pointer border-b border-line last:border-0 hover:bg-bg">
                    <td className="px-3 py-2">{r.name || '—'}</td>
                    <td className="px-3 py-2" dir="ltr">{r.email || '—'}{r.email && !r.verified && <span className="mr-1 text-warn" title="غير مؤكَّد"> •</span>}</td>
                    <td className="px-3 py-2" dir="ltr">{r.phone || '—'}</td>
                    <td className="px-3 py-2">{date(r.createdAt)}</td>
                    <td className="px-3 py-2">{date(r.lastActive)}</td>
                    <td className="px-3 py-2">
                      {r.status === 'cancelled' ? <span className="text-danger">ملغى</span> : r.status === 'frozen' ? <span className="text-warn">مجمّد</span> : r.disabled ? <span className="text-danger">موقوف</span> : r.active ? <span className="text-success">نشط</span> : <span className="text-faint">نائم</span>}
                    </td>
                    <td className="px-3 py-2">
                      {r.sub ? <span className={r.subState === 'expired' ? 'text-danger' : r.subState === 'expiring' ? 'text-warn' : ''}>{r.sub.planName} · حتى {date(r.sub.freezeAt || r.sub.endsAt)}</span> : <span className="text-faint">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {r.sites.length ? r.sites.map((x) => <div key={x.name}>{KIND[x.project] || x.project} · <span dir="ltr">{x.name}</span></div>) : <span className="text-faint">—</span>}
                    </td>
                  </tr>
                ))}
                {!result.rows.length && <tr><td colSpan={8} className="px-3 py-8 text-center text-muted">لا نتائج.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
      {openUid && <SubscriberDetail can={can} uid={openUid} onClose={() => setOpenUid('')} onChanged={() => load(query)} onSessionEnd={onSessionEnd} />}
    </section>
  );
};

export const AdminSite: React.FC = () => {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [checking, setChecking] = useState(!!getAdminToken());
  // Nothing is open until the admin picks something from the menu.
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    if (!getAdminToken()) return;
    adminMe().then((r) => setAdmin(r.admin)).catch(() => setAdminToken('')).finally(() => setChecking(false));
  }, []);

  const logout = useCallback(() => {
    setAdminToken('');
    setAdmin(null);
    setView(null);
  }, []);

  if (checking) return <Shell><Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-muted" /></Shell>;
  if (!admin) return <Shell><LoginForm onDone={setAdmin} /></Shell>;
  if (admin.mustChange) return <Shell admin={admin} onLogout={logout}><ChangePassword forced onDone={setAdmin} /></Shell>;
  return (
    <Shell admin={admin} onLogout={logout} menu={<SideMenu view={view} onView={setView} can={admin.can} />}>
      {view === 'subscribers' ? <Subscribers onSessionEnd={logout} can={admin.can} />
        : view === 'payments' ? <PaymentsView onSessionEnd={logout} />
        : view === 'billing' ? <BillingSettings onSessionEnd={logout} />
        : view === 'tokens' ? <TokensView onSessionEnd={logout} />
        : view === 'my-tasks' ? <TasksView key="mine" onSessionEnd={logout} owner={false} />
        : view === 'all-tasks' ? <TasksView key="all" onSessionEnd={logout} owner />
        : view === 'chat' ? <ChatView onSessionEnd={logout} />
        : view === 'page-law' ? <PageLawView onSessionEnd={logout} />
        : view === 'slides' ? <SlidesReviewView onSessionEnd={logout} />
        : view === 'design-orders' ? <DesignOrdersView onSessionEnd={logout} />
        : view === 'team' ? <TeamView onSessionEnd={logout} me={admin.username} />
        : view === 'password' ? <ChangePassword forced={false} onDone={(a) => { setAdmin(a); setView(null); }} />
        : <p className="mt-16 text-center text-muted">أهلاً {admin.name}. افتح قسماً من القائمة على اليسار.</p>}
    </Shell>
  );
};
