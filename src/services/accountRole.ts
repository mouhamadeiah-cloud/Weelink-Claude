// One account can work in two roles: as a user (projects, pages, orders) or as a designer (the studio:
// drafts, the gallery, design orders, earnings). The role is chosen at every sign-in and lives only in this
// browser tab (sessionStorage), never on the account, so a new tab or a new sign-in asks again. The
// server's permissions stay as they were: they follow the designer profile (designers/{uid}), not the role.
import { useSyncExternalStore } from 'react';

export type Role = 'user' | 'designer';

const key = (uid: string) => `weelink_role_${uid}`;

export const readRole = (uid: string | null | undefined): Role | null => {
  if (!uid) return null;
  try {
    const v = sessionStorage.getItem(key(uid));
    return v === 'designer' || v === 'user' ? v : null;
  } catch {
    return null;
  }
};

export const writeRole = (uid: string, role: Role | null) => {
  try {
    if (role) sessionStorage.setItem(key(uid), role);
    else sessionStorage.removeItem(key(uid));
  } catch {
    /* a private window without storage: the role is asked again on the next load */
  }
};

// What the screens' top bar needs to show the role and switch it (written by the app, read by the bar).
export interface RoleState {
  isDesignerAccount: boolean;
  role: Role | null;
  switchTo?: (role: Role) => void;
  // The designer's studio screen (the platform's own top bar leads there in the designer's role).
  openStudio?: () => void;
}

let state: RoleState = { isDesignerAccount: false, role: null };
const listeners = new Set<() => void>();

export const setRoleState = (next: RoleState) => {
  if (next.isDesignerAccount === state.isDesignerAccount && next.role === state.role && next.switchTo === state.switchTo && next.openStudio === state.openStudio) return;
  state = next;
  listeners.forEach((l) => l());
};

export const useRoleState = (): RoleState =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );

export const ROLE_LABEL: Record<Role, string> = { user: 'مستخدم', designer: 'مصمم' };
