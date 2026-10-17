// «حسابي»: the person's own page under the top bar (not a window): their details and password, their
// projects (edit, pause, delete), their designs when they are a designer, the bell's notices, the
// subscription with its payments and AI balance, and signing out or deleting the account.
import React, { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { ArrowLeft, Bell, CalendarDays, CreditCard, FolderKanban, KeyRound, Loader2, LogOut, Palette, Plus, ShieldAlert, Star, UserRound } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { PlatformNav } from './PlatformNav';
import { Checkout } from '../billing/Checkout';
import { payWayName } from '../../services/billing';
import type { MyProject } from '../onboarding/StartPage';
import type { ProjectType } from '../shop/shopTypes';
import { formatPounds } from '../../data/plans';
import {
  authErrorText, changePassword, confirmIdentity, deleteAccountData, fetchMyAccount, readPhone, saveProfile,
  sendPasswordReset, useNotices, usesPassword, type MyAccountData, type Notice,
} from '../../services/myAccount';

type NavProps = Omit<ComponentProps<typeof PlatformNav>, 'current' | 'extra'>;

interface AccountPageProps extends NavProps {
  accountId: string;
  isDesigner: boolean;
  projects: MyProject[] | null;
  loadingType?: ProjectType | null;
  section?: 'notices' | null;
  onOpenProject: (key: string) => void;
  onPauseProject: (key: string) => Promise<boolean>;
  onDeleteProject: (key: string) => Promise<boolean>;
  onOpenDesigner: () => void;
  onAccountDeleted: () => void;
}

const KIND_NAME: Record<ProjectType, string> = { page: 'صفحة', shop: 'متجر', cars: 'معرض سيارات', restaurant: 'مطعم' };
const DAY = 24 * 3600 * 1000;
const dateText = (v: number | string | undefined | null) => {
  const t = typeof v === 'number' ? v : Date.parse(String(v || ''));
  return t ? new Date(t).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
};
const daysLeft = (t: number) => Math.ceil((t - Date.now()) / DAY);

const inputCls = 'h-10 w-full rounded-ctl border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none disabled:bg-bg disabled:text-muted';
const primaryBtn = 'h-10 px-4 rounded-ctl bg-brand hover:bg-brand-hover text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-60';
const ghostBtn = 'h-9 px-3.5 rounded-ctl border border-line text-xs font-bold text-muted hover:text-ink inline-flex items-center gap-1.5 disabled:opacity-60';

const Section: React.FC<{ id: string; title: string; icon: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode }> = ({ id, title, icon, actions, children }) => (
  <section id={id} className="scroll-mt-28 rounded-card border border-line bg-surface p-5 sm:p-6" aria-labelledby={`${id}-title`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-heading font-bold"><span className="text-brand">{icon}</span>{title}</h2>
      {actions}
    </div>
    {children}
  </section>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-bold text-muted">{label}</span>
    {children}
  </label>
);

const Note: React.FC<{ tone?: 'ok' | 'error'; children: React.ReactNode }> = ({ tone = 'ok', children }) => (
  <p role="status" className={`text-xs font-bold ${tone === 'ok' ? 'text-brand' : 'text-danger'}`}>{children}</p>
);

export const AccountPage: React.FC<AccountPageProps> = (props) => {
  const { user, accountId, isDesigner, projects, loadingType, section, onOpenProject, onPauseProject, onDeleteProject, onOpenDesigner, onAccountDeleted, ...nav } = props;
  const owner = !!user && user.uid === accountId;
  const [account, setAccount] = useState<MyAccountData | null | undefined>(undefined);

  const [tick, setTick] = useState(0);
  const reload = () => setTick((t) => t + 1);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetchMyAccount(user).then((a) => alive && setAccount(a)).catch(() => alive && setAccount(null));
    return () => {
      alive = false;
    };
  }, [user, tick]);

  useEffect(() => {
    if (section) setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [section]);

  if (!user || user.isAnonymous) return null;

  const links: [string, string][] = [
    ['profile', 'معلوماتي'],
    ['security', 'كلمة السر'],
    ['projects', 'مشاريعي'],
    ...(isDesigner ? ([['designs', 'تصميماتي']] as [string, string][]) : []),
    ['notices', 'الإشعارات'],
    ['billing', 'الاشتراك والدفعات'],
    ['danger', 'الخروج والحساب'],
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-bg text-ink">
      <PlatformNav {...nav} user={user} current="account" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10 space-y-5">
        <header className="flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand"><UserRound size={28} /></span>
          <div className="min-w-0 flex-1">
            <h1 className="text-title font-bold truncate">{user.displayName || user.email?.split('@')[0] || 'حسابي'}</h1>
            <p className="text-xs text-muted" dir="ltr" style={{ textAlign: 'right' }}>{user.email}</p>
            <p className="text-xs text-muted">عضو منذ {dateText(user.metadata.creationTime)}</p>
          </div>
          <button type="button" onClick={nav.onLogout} className={ghostBtn}><LogOut size={14} /> خروج</button>
        </header>

        <nav className="sticky top-12 z-20 -mx-4 flex gap-1 overflow-x-auto border-b border-line bg-bg/95 px-4 py-2 backdrop-blur" aria-label="أقسام الحساب">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }} className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-ink">
              {label}
            </a>
          ))}
        </nav>

        <ProfileSection key={user.uid} user={user} />
        <SecuritySection user={user} />
        <ProjectsSection projects={projects} account={account} owner={owner} loadingType={loadingType} onOpen={onOpenProject} onPause={onPauseProject} onDelete={onDeleteProject} onAdd={nav.onStart} user={user} onOrder={reload} />
        {isDesigner && <DesignsSection uid={user.uid} onOpenDesigner={onOpenDesigner} />}
        <NoticesSection accountId={accountId} uid={user.uid} email={user.email || ''} />
        <BillingSection account={account} projects={projects} />
        <DangerSection user={user} owner={owner} projects={projects} onPause={onPauseProject} onDeleted={onAccountDeleted} onLogout={nav.onLogout} />
      </main>
    </div>
  );
};

// ---------- معلوماتي ----------

const ProfileSection: React.FC<{ user: NonNullable<NavProps['user']> }> = ({ user }) => {
  const [name, setName] = useState(user.displayName || '');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  useEffect(() => {
    readPhone(user.uid).then(setPhone).catch(() => {});
  }, [user.uid]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      await saveProfile(user, name, phone);
      setNote({ tone: 'ok', text: 'انحفظت معلوماتك.' });
    } catch {
      setNote({ tone: 'error', text: 'ما قدرنا نحفظ. جرّب مرة تانية.' });
    }
    setBusy(false);
  };
  return (
    <Section id="profile" title="معلوماتي" icon={<UserRound size={18} />}>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" /></Field>
        <Field label="رقم الهاتف"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} inputMode="tel" dir="ltr" autoComplete="tel" placeholder="+963…" /></Field>
        <Field label="الإيميل"><input className={inputCls} value={user.email || ''} disabled dir="ltr" /></Field>
        <Field label="تاريخ التسجيل"><input className={inputCls} value={dateText(user.metadata.creationTime)} disabled /></Field>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className={primaryBtn}>{busy && <Loader2 size={15} className="animate-spin" />} حفظ</button>
          {note && <Note tone={note.tone}>{note.text}</Note>}
        </div>
      </form>
    </Section>
  );
};

// ---------- كلمة السر ----------

const SecuritySection: React.FC<{ user: NonNullable<NavProps['user']> }> = ({ user }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  if (!usesPassword(user)) {
    return (
      <Section id="security" title="كلمة السر" icon={<KeyRound size={18} />}>
        <p className="text-sm text-muted">بتدخل بحساب Google، فما في كلمة سر بـ Weelink. كلمة السر بتتغيّر من حساب Google تبعك.</p>
      </Section>
    );
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNote(null);
    if (next.length < 6) return setNote({ tone: 'error', text: 'كلمة السر الجديدة لازم تكون 6 أحرف أو أكتر.' });
    if (next !== again) return setNote({ tone: 'error', text: 'كلمتين السر الجديدة مو متطابقين.' });
    setBusy(true);
    try {
      await changePassword(user, current, next);
      setCurrent('');
      setNext('');
      setAgain('');
      setNote({ tone: 'ok', text: 'تغيّرت كلمة السر.' });
    } catch (err) {
      setNote({ tone: 'error', text: authErrorText(err) });
    }
    setBusy(false);
  };
  const reset = async () => {
    try {
      await sendPasswordReset(user.email || '');
      setNote({ tone: 'ok', text: `بعتنالك رابط لتغيير كلمة السر على ${user.email}.` });
    } catch (err) {
      setNote({ tone: 'error', text: authErrorText(err) });
    }
  };
  return (
    <Section id="security" title="كلمة السر" icon={<KeyRound size={18} />}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field label="كلمة السر الحالية"><input type="password" className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required /></Field>
        <Field label="كلمة السر الجديدة"><input type="password" className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required /></Field>
        <Field label="أعد كتابتها"><input type="password" className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required /></Field>
        <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className={primaryBtn}>{busy && <Loader2 size={15} className="animate-spin" />} غيّر كلمة السر</button>
          <button type="button" onClick={reset} className="text-xs font-bold text-brand hover:underline">نسيت كلمة السر؟</button>
          {note && <Note tone={note.tone}>{note.text}</Note>}
        </div>
      </form>
    </Section>
  );
};

// ---------- مشاريعي ----------

const ProjectsSection: React.FC<{
  projects: MyProject[] | null;
  account: MyAccountData | null | undefined;
  owner: boolean;
  loadingType?: ProjectType | null;
  onOpen: (key: string) => void;
  onPause: (key: string) => Promise<boolean>;
  onDelete: (key: string) => Promise<boolean>;
  onAdd: () => void;
  user: NonNullable<NavProps['user']>;
  onOrder: () => void;
}> = ({ projects, account, owner, loadingType, onOpen, onPause, onDelete, onAdd, user, onOrder }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [paying, setPaying] = useState<MyProject | null>(null);
  const validity = (p: MyProject) => {
    const paid = account?.projects[p.key];
    if (paid?.paidUntil) {
      const left = daysLeft(paid.paidUntil);
      return left > 0
        ? { text: `${paid.planName || 'الاشتراك'} صالح لحد ${dateText(paid.paidUntil)} (باقي ${left.toLocaleString('ar-SY')} يوم)`, warn: left <= 14, renew: true }
        : { text: `انتهت الصلاحية بـ ${dateText(paid.paidUntil)}`, warn: true, renew: true };
    }
    const open = account?.orders.find((o) => o.project === p.key);
    if (open) return { text: open.status === 'attached' ? 'إشعار الدفع قيد الفحص' : open.status === 'rejected' ? 'انرفض إشعار الدفع، ارفع واحد جديد' : `بانتظار الدفع${open.deleteAt ? `، بينحذف ${dateText(open.deleteAt)} إذا ما اندفع` : ''}`, warn: open.status !== 'attached', renew: true };
    if (account?.test) return { text: 'حساب تجريبي: بدون دفع', warn: false, renew: false };
    return p.kind === 'page' ? { text: 'الباقة المجانية', warn: false, renew: false } : { text: 'بدون اشتراك مدفوع بعد', warn: false, renew: true };
  };
  const pause = async (p: MyProject) => {
    if (!window.confirm(`إيقاف «${p.name || KIND_NAME[p.kind]}» مؤقتاً؟ الرابط بيوقف لحد ما تنشرو من جديد، ومشروعك بيضل محفوظ.`)) return;
    setBusy(p.key);
    const ok = await onPause(p.key);
    setBusy(null);
    if (!ok) window.alert('ما قدرنا نوقفو. جرّب مرة تانية.');
  };
  const remove = async (p: MyProject) => {
    const label = p.name || KIND_NAME[p.kind];
    if (window.prompt(`حذف «${label}» نهائياً؟ التصميم والإعدادات بيروحوا وما بترجع. للتأكيد اكتب: احذف`) !== 'احذف') return;
    setBusy(p.key);
    const ok = await onDelete(p.key);
    setBusy(null);
    if (!ok) window.alert('ما قدرنا نحذفو. جرّب مرة تانية.');
  };
  return (
    <Section id="projects" title="مشاريعي" icon={<FolderKanban size={18} />} actions={<button type="button" onClick={onAdd} className={ghostBtn}><Plus size={14} /> إضافة مشروع</button>}>
      {projects === null ? (
        <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={15} className="animate-spin" /> عم نجيب مشاريعك…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted">ما عندك مشاريع لسا.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projects.map((p) => {
            const v = validity(p);
            return (
              <li key={p.key} className="rounded-card border border-line p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-muted">{KIND_NAME[p.kind]}</p>
                    <p className="text-sm font-bold truncate">{p.name || 'بدون اسم'}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold rounded-full px-2.5 py-1 ${p.published ? 'bg-brand/10 text-brand' : 'bg-bg text-muted'}`}>{p.published ? 'منشور' : 'مسودة'}</span>
                </div>
                {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand truncate hover:underline" dir="ltr">{p.url.replace(/^https?:\/\//, '')}</a>}
                <p className={`text-xs ${v.warn ? 'font-bold text-danger' : 'text-muted'}`}>{account === undefined ? '…' : v.text}</p>
                <div className="mt-auto flex flex-wrap gap-2">
                  <button type="button" disabled={!!loadingType} onClick={() => onOpen(p.key)} className="h-9 px-3.5 rounded-ctl bg-brand hover:bg-brand-hover text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-60">
                    {p.published ? 'تعديل' : 'كمّل المشروع'} <ArrowLeft size={13} />
                  </button>
                  {owner && v.renew && account && (
                    <button type="button" onClick={() => setPaying(p)} className={ghostBtn}><CreditCard size={13} /> {account.projects[p.key]?.paidUntil ? 'جدّد' : 'ادفع'}</button>
                  )}
                  {p.published && (
                    <button type="button" disabled={busy === p.key} onClick={() => pause(p)} className={ghostBtn}>{busy === p.key && <Loader2 size={13} className="animate-spin" />} إيقاف مؤقت</button>
                  )}
                  {owner && (
                    <button type="button" disabled={busy === p.key} onClick={() => remove(p)} className={`${ghostBtn} hover:!text-danger`}>حذف</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {paying && user && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setPaying(null)}>
          <div dir="rtl" className="w-full sm:max-w-xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-bg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-black">فاتورة «{paying.name || KIND_NAME[paying.kind]}»</h3>
              <button type="button" onClick={() => setPaying(null)} className="h-8 w-8 rounded-full bg-black/5 text-sm" aria-label="إغلاق">✕</button>
            </div>
            <Checkout user={user} owner={user.uid} project={paying.key} paidUntil={account?.projects[paying.key]?.paidUntil} onOrder={onOrder} />
          </div>
        </div>
      )}
    </Section>
  );
};

// ---------- تصميماتي ----------

const SLIDE_STATUS: Record<string, { text: string; cls: string }> = {
  approved: { text: 'بالمعرض', cls: 'bg-brand/10 text-brand' },
  pending: { text: 'قيد المراجعة', cls: 'bg-bg text-muted' },
  rejected: { text: 'مرفوض', cls: 'bg-danger/10 text-danger' },
};

const DesignsSection: React.FC<{ uid: string; onOpenDesigner: () => void }> = ({ uid, onOpenDesigner }) => {
  const [slides, setSlides] = useState<{ id: string; name: string; status: string }[] | null>(null);
  useEffect(() => {
    getDocs(query(collection(db, 'gallerySlides'), where('designerUid', '==', uid)))
      .then((snap) => setSlides(snap.docs.map((d) => ({ id: d.id, name: String(d.data().name || ''), status: String(d.data().status || 'pending') }))))
      .catch(() => setSlides([]));
  }, [uid]);
  return (
    <Section id="designs" title="تصميماتي" icon={<Palette size={18} />} actions={<button type="button" onClick={onOpenDesigner} className={ghostBtn}>افتح وضع المصمم <ArrowLeft size={13} /></button>}>
      {slides === null ? (
        <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={15} className="animate-spin" /> عم نجيب تصميماتك…</p>
      ) : slides.length === 0 ? (
        <p className="text-sm text-muted">ما بعتت تصاميم للمعرض لسا.</p>
      ) : (
        <ul className="divide-y divide-line">
          {slides.map((s) => {
            const st = SLIDE_STATUS[s.status] || SLIDE_STATUS.pending;
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate text-sm font-bold">{s.name || 'بدون اسم'}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
};

// ---------- الإشعارات ----------

const NOTICE_ICON: Record<Notice['kind'], React.ReactNode> = {
  booking: <CalendarDays size={15} />,
  rating: <Star size={15} />,
  design: <Palette size={15} />,
};

const NoticesSection: React.FC<{ accountId: string; uid: string; email: string }> = ({ accountId, uid, email }) => {
  const notices = useNotices(accountId, uid);
  return (
    <Section id="notices" title="الإشعارات" icon={<Bell size={18} />}>
      {notices.length === 0 ? (
        <p className="text-sm text-muted">ما في شي جديد.</p>
      ) : (
        <ul className="divide-y divide-line">
          {notices.map((n) => (
            <li key={n.id} className="flex items-start gap-3 py-2.5">
              <span className="mt-0.5 shrink-0 text-brand">{NOTICE_ICON[n.kind]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{n.text}</p>
                {n.at && <p className="text-xs text-muted">{dateText(n.at)}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">المواعيد والتقييمات بتتابعها من «الإدارة» بصفحتك. إيميلات Weelink (الفواتير والتذكيرات) بتوصلك على <span dir="ltr">{email}</span>.</p>
    </Section>
  );
};

// ---------- الاشتراك والدفعات ----------

const BillingSection: React.FC<{ account: MyAccountData | null | undefined; projects: MyProject[] | null }> = ({ account, projects }) => {
  const sub = account?.subscription;
  const total = useMemo(() => (account?.payments || []).reduce((t, p) => t + p.amount, 0), [account]);
  const running = Object.values(account?.projects || {}).filter((p) => p.paidUntil > Date.now());
  // The paid periods, else the old account-wide subscription.
  const nearest = running.length ? Math.min(...running.map((p) => p.paidUntil)) : sub?.endsAt || 0;
  return (
    <Section id="billing" title="الاشتراك والدفعات" icon={<CreditCard size={18} />}>
      {account === undefined ? (
        <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={15} className="animate-spin" /> عم نجيب اشتراكك…</p>
      ) : account === null ? (
        <p className="text-sm text-muted">ما قدرنا نجيب معلومات الاشتراك هلق. جرّب بعدين.</p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-card border border-line p-4">
              <p className="text-xs font-bold text-muted">المشاريع المدفوعة</p>
              <p className="mt-1 text-sm font-bold">{account.test ? 'حساب تجريبي' : running.length ? `${running.length.toLocaleString('ar-SY')} مشروع` : sub ? `${sub.planName || sub.plan}${sub.trial ? ' (تجربة)' : ''}` : 'الباقة المجانية'}</p>
              <p className="text-xs text-muted">{account.test ? 'بتنشر بدون دفع' : 'كل مشروع إلو صلاحيتو لحالو'}</p>
            </div>
            <div className="rounded-card border border-line p-4">
              <p className="text-xs font-bold text-muted">أقرب انتهاء</p>
              <p className="mt-1 text-sm font-bold">{nearest ? dateText(nearest) : '—'}</p>
              {nearest ? <p className={`text-xs ${daysLeft(nearest) <= 14 ? 'font-bold text-danger' : 'text-muted'}`}>{daysLeft(nearest) > 0 ? `باقي ${daysLeft(nearest).toLocaleString('ar-SY')} يوم` : 'انتهى'}</p> : null}
            </div>
            <div className="rounded-card border border-line p-4">
              <p className="text-xs font-bold text-muted">رصيد Wee AI</p>
              <p className="mt-1 text-sm font-bold tabular-nums">{account.tokens.balance.toLocaleString('ar-SY')}</p>
              <p className="text-xs text-muted">مستعمل: {account.tokens.used.toLocaleString('ar-SY')}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold">الدفعات المؤكدة</h3>
            {account.payments.length === 0 ? (
              <p className="text-sm text-muted">ما في دفعات لسا.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-right text-xs text-muted">
                      <th className="py-2 font-bold">التاريخ</th>
                      <th className="py-2 font-bold">الباقة</th>
                      <th className="py-2 font-bold">المدة</th>
                      <th className="py-2 font-bold">المبلغ</th>
                      <th className="py-2 font-bold">الفاتورة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {account.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 whitespace-nowrap">{dateText(p.paidAt)}</td>
                        <td className="py-2">{p.planName}</td>
                        <td className="py-2 whitespace-nowrap text-xs text-muted">{dateText(p.coversFrom)} ← {dateText(p.coversTo)}</td>
                        <td className="py-2 whitespace-nowrap tabular-nums">{formatPounds(p.amount)}</td>
                        <td className="py-2">{p.invoiceUrl ? <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand hover:underline">{p.invoiceNo || 'عرض'}</a> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-muted">المجموع: {formatPounds(total)}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold">فواتير مفتوحة وقيد الفحص</h3>
            {account.orders.length === 0 ? (
              <p className="text-sm text-muted">ما في فواتير مفتوحة. لما ترسل إشعار دفع، بيضل هون «قيد الفحص» لحد ما يأكده فريق Weelink، وبعدها بيصير بالدفعات المؤكدة مع فاتورته.</p>
            ) : (
              <ul className="space-y-2">
                {account.orders.map((o) => {
                  const p = projects?.find((x) => x.key === o.project);
                  const tone = o.status === 'attached' ? 'bg-[#fff4e6] text-[#7a3d00]' : o.status === 'rejected' ? 'bg-danger/10 text-danger' : 'bg-bg text-muted';
                  return (
                    <li key={o.id} className="rounded-card border border-line p-3 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-bold">{p?.name || o.siteName || o.project}</span>
                      <span className="text-muted">{o.planName} · {o.period === 'yearly' ? 'سنوي' : 'شهري'} · <span className="tabular-nums">{formatPounds(o.total)}</span></span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{o.status === 'attached' ? 'قيد الفحص' : o.status === 'rejected' ? 'مرفوض' : 'غير مدفوع'}</span>
                      {o.status === 'attached' && <span className="text-xs text-muted">{payWayName(o.way)}{o.transferNo ? ` · ${o.transferNo}` : ''}</span>}
                      {o.status === 'rejected' && o.rejectReason && <span className="w-full text-xs text-danger">السبب: {o.rejectReason}</span>}
                      {o.deleteAt > 0 && o.status !== 'attached' && <span className="w-full text-xs text-danger">إذا ما اندفعت لحد {dateText(o.deleteAt)} بينحذف المشروع.</span>}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted">لترسل إشعار أو تدفع: «مشاريعي» ← «ادفع».</p>
          </div>
        </div>
      )}
    </Section>
  );
};

// ---------- الخروج وحذف الحساب ----------

const DangerSection: React.FC<{ user: NonNullable<NavProps['user']>; owner: boolean; projects: MyProject[] | null; onPause: (key: string) => Promise<boolean>; onDeleted: () => void; onLogout: () => void }> = ({ user, owner, projects, onPause, onDeleted, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const withPassword = usesPassword(user);
  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (word.trim() !== 'احذف') return setError('اكتب «احذف» للتأكيد.');
    setBusy(true);
    setError('');
    try {
      await confirmIdentity(user, password);
      for (const p of projects || []) if (p.published) await onPause(p.key);
      await deleteAccountData(user, (projects || []).map((p) => p.key));
      onDeleted();
    } catch (err) {
      setError(authErrorText(err));
      setBusy(false);
    }
  };
  return (
    <Section id="danger" title="الخروج والحساب" icon={<ShieldAlert size={18} />}>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onLogout} className={ghostBtn}><LogOut size={14} /> تسجيل الخروج</button>
        {owner && !open && (
          <button type="button" onClick={() => setOpen(true)} className="h-9 px-3.5 rounded-ctl border border-danger/40 text-xs font-bold text-danger hover:bg-danger/5">إلغاء الحساب</button>
        )}
      </div>
      {owner && open && (
        <form onSubmit={remove} className="mt-4 space-y-3 rounded-card border border-danger/40 bg-danger/5 p-4">
          <p className="text-sm font-bold text-danger">إلغاء الحساب نهائي: كل مشاريعك بتنحذف، والصفحات المنشورة بتوقف، وما بتقدر ترجع تدخل بهالحساب.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {withPassword && <Field label="كلمة السر"><input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></Field>}
            <Field label="اكتب «احذف» للتأكيد"><input className={inputCls} value={word} onChange={(e) => setWord(e.target.value)} /></Field>
          </div>
          {!withPassword && <p className="text-xs text-muted">رح نطلب منك تأكيد حساب Google قبل الحذف.</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={busy} className="h-10 px-4 rounded-ctl bg-danger text-white text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-60">{busy && <Loader2 size={15} className="animate-spin" />} احذف حسابي</button>
            <button type="button" onClick={() => { setOpen(false); setError(''); }} className={ghostBtn}>تراجع</button>
            {error && <Note tone="error">{error}</Note>}
          </div>
        </form>
      )}
    </Section>
  );
};
