// The one top bar of Weelink's own screens (the start page «اعمل مشروعك» is the main one, «خدماتنا» is the
// services page): fixed at the top, small text, no buttons. The logo leads to the main page.
// The screen you are on carries a light blue frame. Signed in, a person icon with the name opens the account
// page, and the bell next to it counts what waits there (new bookings, ratings, design orders).
import React from 'react';
import type { User } from 'firebase/auth';
import { Bell, UserRound } from 'lucide-react';
import { useNotices } from '../../services/myAccount';
import { ROLE_LABEL, useRoleState } from '../../services/accountRole';

type NavScreen = 'home' | 'start' | 'law' | 'account';

interface Props {
  current: NavScreen;
  user: User | null;
  onHome: () => void;
  onStart: () => void;
  onOpenMyPage: () => void;
  onLaw: () => void;
  onAccount: () => void;
  // The account page; 'notices' opens it at the bell's list.
  onMyAccount: (section?: 'notices') => void;
  onLogout: () => void;
  // Extra items of the screen (the design orders on the start page).
  extra?: React.ReactNode;
}

const itemCls = (on: boolean) =>
  `shrink-0 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
    on ? 'border-brand/35 bg-brand/5 text-brand' : 'border-transparent text-muted hover:text-ink'
  }`;

export const PlatformNav: React.FC<Props> = ({ current, user, onHome, onStart, onOpenMyPage, onLaw, onAccount, onMyAccount, extra }) => {
  const signedIn = !!user && !user.isAnonymous;
  const firstName = user ? (user.displayName || user.email?.split('@')[0] || '').split(' ')[0] : '';
  const notices = useNotices(user?.uid || '', user?.uid || '', signedIn);
  // A designer's account shows the role of this sign-in and switches it.
  const roleState = useRoleState();
  const otherRole = roleState.role === 'designer' ? 'user' : 'designer';
  // In the designer's role the bar carries the studio, not the user's projects.
  const inStudio = signedIn && roleState.role === 'designer' && !!roleState.openStudio;

  return (
    <header dir="rtl" className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <nav className="mx-auto flex h-12 max-w-6xl items-center gap-1 px-3 sm:px-4" aria-label="Weelink">
        <button type="button" onClick={() => (inStudio ? roleState.openStudio?.() : onStart())} className="me-2 flex shrink-0 items-center gap-2" aria-label="weelink">
          <span className="flex h-7 w-7 items-center justify-center rounded-ctl bg-brand text-sm font-bold text-white">W</span>
          <span className="hidden font-logo text-base font-bold tracking-tight sm:inline">weelink</span>
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {inStudio ? (
            <button type="button" onClick={() => roleState.openStudio?.()} className={itemCls(false)}>استوديو المصمم</button>
          ) : (
            <>
              <button type="button" onClick={onStart} aria-current={current === 'start' ? 'page' : undefined} className={itemCls(current === 'start')}>اعمل مشروعك</button>
              <button type="button" onClick={onHome} aria-current={current === 'home' ? 'page' : undefined} className={itemCls(current === 'home')}>خدماتنا</button>
              {signedIn && <button type="button" onClick={onOpenMyPage} className={itemCls(false)}>مشروعي</button>}
            </>
          )}
          {extra}
          <button type="button" onClick={onLaw} aria-current={current === 'law' ? 'page' : undefined} className={itemCls(current === 'law')}>قانون الصفحة</button>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {signedIn ? (
            <>
              {roleState.isDesignerAccount && roleState.role && roleState.switchTo && (
                <button
                  type="button"
                  onClick={() => roleState.switchTo?.(otherRole)}
                  title={`أنت داخل كـ${ROLE_LABEL[roleState.role]}. اضغط للدخول كـ${ROLE_LABEL[otherRole]}`}
                  className="me-1 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line px-2 py-1 text-xs font-medium text-muted hover:text-ink"
                >
                  <span className="font-bold text-ink">{ROLE_LABEL[roleState.role]}</span>
                  <span aria-hidden="true">⇄</span>
                  <span>{ROLE_LABEL[otherRole]}</span>
                </button>
              )}
              <button type="button" onClick={() => onMyAccount('notices')} className="relative rounded-md p-1.5 text-muted hover:text-ink" aria-label={notices.length ? `${notices.length} إشعارات` : 'الإشعارات'}>
                <Bell size={17} />
                {notices.length > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold inline-flex items-center justify-center tabular-nums">{notices.length > 9 ? '9+' : notices.length}</span>
                )}
              </button>
              <button type="button" onClick={() => onMyAccount()} aria-current={current === 'account' ? 'page' : undefined} className={`${itemCls(current === 'account')} inline-flex items-center gap-1.5`}>
                <UserRound size={15} aria-hidden="true" />
                <span className="max-w-[9rem] truncate">{firstName || 'حسابي'}</span>
              </button>
            </>
          ) : (
            <button type="button" onClick={onAccount} className={itemCls(false)}>سجّل دخولك</button>
          )}
        </div>
      </nav>
    </header>
  );
};
