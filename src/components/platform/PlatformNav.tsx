// The one top bar of Weelink's own screens (the front page, the start page): fixed at the top, small text, no buttons.
// The screen you are on carries a light blue frame. «حسابي» is a small menu that closes on a click outside it.
import React, { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { LogOut } from 'lucide-react';

export type NavScreen = 'home' | 'start' | 'law';

interface Props {
  current: NavScreen;
  user: User | null;
  onHome: () => void;
  onStart: () => void;
  onOpenMyPage: () => void;
  onLaw: () => void;
  onAccount: () => void;
  onLogout: () => void;
  // Extra items of the screen (the design orders on the start page).
  extra?: React.ReactNode;
}

const itemCls = (on: boolean) =>
  `shrink-0 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
    on ? 'border-brand/35 bg-brand/5 text-brand' : 'border-transparent text-muted hover:text-ink'
  }`;

export const PlatformNav: React.FC<Props> = ({ current, user, onHome, onStart, onOpenMyPage, onLaw, onAccount, onLogout, extra }) => {
  const signedIn = !!user && !user.isAnonymous;
  const [menu, setMenu] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const firstName = user ? (user.displayName || user.email?.split('@')[0] || '').split(' ')[0] : '';

  useEffect(() => {
    if (!menu) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setMenu(false); };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', key); };
  }, [menu]);

  const pick = (fn: () => void) => () => { setMenu(false); fn(); };

  return (
    <header dir="rtl" className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <nav className="mx-auto flex h-12 max-w-6xl items-center gap-1 px-3 sm:px-4" aria-label="Weelink">
        <button type="button" onClick={onHome} className="me-2 flex shrink-0 items-center gap-2" aria-label="weelink">
          <span className="flex h-7 w-7 items-center justify-center rounded-ctl bg-brand text-sm font-bold text-white">W</span>
          <span className="hidden font-logo text-base font-bold tracking-tight sm:inline">weelink</span>
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          <button type="button" onClick={onHome} aria-current={current === 'home' ? 'page' : undefined} className={itemCls(current === 'home')}>الرئيسية</button>
          <button type="button" onClick={onStart} aria-current={current === 'start' ? 'page' : undefined} className={itemCls(current === 'start')}>اعمل صفحتك</button>
          {signedIn && <button type="button" onClick={onOpenMyPage} className={itemCls(false)}>صفحتي</button>}
          {extra}
          <button type="button" onClick={onLaw} aria-current={current === 'law' ? 'page' : undefined} className={itemCls(current === 'law')}>قانون الصفحة</button>
        </div>
        <div ref={box} className="relative shrink-0">
          {signedIn ? (
            <>
              <button type="button" onClick={() => setMenu((o) => !o)} aria-expanded={menu} className={itemCls(menu)}>حسابي{firstName ? ` · ${firstName}` : ''}</button>
              {menu && (
                <div role="menu" className="absolute left-0 z-40 mt-1.5 w-48 overflow-hidden rounded-card border border-line bg-surface py-1 text-xs shadow-lg">
                  <button type="button" role="menuitem" onClick={pick(onOpenMyPage)} className="w-full px-4 py-2 text-right font-medium hover:bg-bg">صفحتي</button>
                  <button type="button" role="menuitem" onClick={pick(onStart)} className="w-full px-4 py-2 text-right hover:bg-bg">إضافة صفحة لحسابي</button>
                  <div className="my-1 border-t border-line" />
                  <button type="button" role="menuitem" onClick={pick(onLogout)} className="flex w-full items-center gap-2 px-4 py-2 text-right text-danger hover:bg-bg"><LogOut size={13} /> تسجيل الخروج</button>
                </div>
              )}
            </>
          ) : (
            <button type="button" onClick={onAccount} className={itemCls(false)}>سجّل دخولك</button>
          )}
        </div>
      </nav>
    </header>
  );
};
