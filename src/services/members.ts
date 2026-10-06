// The management members of an account (a partner or a manager), each signing in with their own email
// and password. The owner invites a member with a link (accounts/{id}/invites/{code}) and chooses what
// the member may see; opening the link and signing in with the invited email makes the member
// (accounts/{id}/members/{uid}). Only the owner adds, changes or removes members. See firestore.rules:
// the accounts (الحسابات) and the devices/workers are also refused by the rules without the permission.
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type PermId = 'orders' | 'menu' | 'tables' | 'staff' | 'accounts' | 'settings';
export type Perms = Record<PermId, boolean>;

export const PERMS: { id: PermId; label: string; hint: string }[] = [
  { id: 'orders', label: 'الطلبات', hint: 'طلبات الموقع وحالتها' },
  { id: 'menu', label: 'المنيو', hint: 'الأطباق والأقسام ومجموعات المكونات' },
  { id: 'tables', label: 'الصالات والطاولات', hint: 'الطاولات ورابط الموقع ورموز QR' },
  { id: 'staff', label: 'العمال والأجهزة', hint: 'العمال وأرقامهم السرية وصناديقهم، والأجهزة وأكوادها' },
  { id: 'accounts', label: 'الحسابات', hint: 'المبيعات والمصاريف والأرباح' },
  { id: 'settings', label: 'الإعدادات', hint: 'إعدادات المطعم' },
];

export const NO_PERMS: Perms = { orders: false, menu: false, tables: false, staff: false, accounts: false, settings: false };
export const ALL_PERMS: Perms = { orders: true, menu: true, tables: true, staff: true, accounts: true, settings: true };

export const normalizePerms = (raw: any): Perms => {
  const p = { ...NO_PERMS };
  for (const { id } of PERMS) p[id] = raw?.[id] === true;
  return p;
};

// What the signed-in person may do in the open account: everything for the owner.
export interface Access {
  owner: boolean;
  perms: Perms;
}
export const OWNER_ACCESS: Access = { owner: true, perms: ALL_PERMS };

export interface Member {
  uid: string;
  email: string;
  name: string;
  perms: Perms;
  at: string;
}

export interface Invite {
  code: string;
  email: string;
  name: string;
  perms: Perms;
  at: string;
}

const membersCol = (accountId: string) => collection(db, 'accounts', accountId, 'members');
const invitesCol = (accountId: string) => collection(db, 'accounts', accountId, 'invites');

// The member record of this user in that account, or null.
export const readMembership = async (accountId: string, uid: string): Promise<Member | null> => {
  try {
    const s = await getDoc(doc(membersCol(accountId), uid));
    if (!s.exists()) return null;
    const d: any = s.data();
    return { uid, email: String(d.email || ''), name: String(d.name || ''), perms: normalizePerms(d.perms), at: String(d.at || '') };
  } catch {
    return null;
  }
};

export const loadAccess = async (user: User | null, accountId: string): Promise<Access> => {
  if (!user || user.uid === accountId) return OWNER_ACCESS;
  const m = await readMembership(accountId, user.uid);
  return m ? { owner: false, perms: m.perms } : OWNER_ACCESS;
};

// ---------- Invitation link ----------

// ?invite=<accountId>.<code>: kept for the sign-in that follows, then taken off the address.
const INVITE_KEY = 'weelink_invite';
(() => {
  try {
    const url = new URL(window.location.href);
    const v = url.searchParams.get('invite');
    if (!v) return;
    sessionStorage.setItem(INVITE_KEY, v);
    url.searchParams.delete('invite');
    window.history.replaceState(null, '', url.toString());
  } catch {
    // storage unavailable: the link has to be opened again after signing in
  }
})();

export const pendingInvite = () => {
  try {
    return sessionStorage.getItem(INVITE_KEY) || '';
  } catch {
    return '';
  }
};

const clearInvite = () => {
  try {
    sessionStorage.removeItem(INVITE_KEY);
  } catch {
    // nothing to clear
  }
};

export const inviteUrl = (accountId: string, code: string) => `${window.location.origin}/?invite=${encodeURIComponent(`${accountId}.${code}`)}`;

export type InviteResult = { accountId: string } | { error: string } | null;

// Joins the account of the invitation link opened on this browser, if any.
export const acceptPendingInvite = async (user: User): Promise<InviteResult> => {
  const raw = pendingInvite();
  if (!raw) return null;
  clearInvite();
  const dot = raw.lastIndexOf('.');
  const accountId = raw.slice(0, dot);
  const code = raw.slice(dot + 1);
  if (dot <= 0 || !code) return { error: 'رابط الدعوة غير صحيح.' };
  if (accountId === user.uid) return null;
  let invite: any;
  try {
    const s = await getDoc(doc(invitesCol(accountId), code));
    if (!s.exists()) return { error: 'الدعوة غير موجودة أو استُعملت من قبل.' };
    invite = s.data();
  } catch {
    return { error: 'هذه الدعوة لبريد إلكتروني آخر. سجّل الدخول بالبريد الذي دُعيت به.' };
  }
  try {
    await setDoc(doc(membersCol(accountId), user.uid), {
      email: invite.email,
      name: invite.name,
      perms: invite.perms,
      invite: code,
      at: new Date().toISOString(),
    });
    await setDoc(doc(db, 'userAccounts', user.uid), { accountId });
    await deleteDoc(doc(invitesCol(accountId), code)).catch(() => {});
    return { accountId };
  } catch (e) {
    console.warn('Could not accept the invitation:', e);
    return { error: 'تعذر قبول الدعوة. حاول مرة أخرى.' };
  }
};

// ---------- The owner's side ----------

const randomCode = () => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 28);
};

export const createInvite = async (accountId: string, ownerUid: string, input: { name: string; email: string; perms: Perms }) => {
  const code = randomCode();
  await setDoc(doc(invitesCol(accountId), code), {
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    perms: input.perms,
    by: ownerUid,
    at: new Date().toISOString(),
  });
  return code;
};

export const deleteInvite = (accountId: string, code: string) => deleteDoc(doc(invitesCol(accountId), code));
export const setMemberPerms = (accountId: string, uid: string, perms: Perms) => updateDoc(doc(membersCol(accountId), uid), { perms });
export const removeMember = (accountId: string, uid: string) => deleteDoc(doc(membersCol(accountId), uid));

const useList = <T,>(make: () => ReturnType<typeof collection> | null, map: (id: string, d: any) => T, deps: unknown[]) => {
  const [state, setState] = useState<{ items: T[]; error: string }>({ items: [], error: '' });
  useEffect(() => {
    const c = make();
    if (!c) return;
    return onSnapshot(
      c,
      (snap) => setState({ items: snap.docs.map((d) => map(d.id, d.data())), error: '' }),
      (e) => setState({ items: [], error: e.code || e.message })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
};

export const useMembers = (accountId: string | null) =>
  useList(() => (accountId ? membersCol(accountId) : null), (uid, d): Member => ({ uid, email: String(d.email || ''), name: String(d.name || ''), perms: normalizePerms(d.perms), at: String(d.at || '') }), [accountId]);

export const useInvites = (accountId: string | null) =>
  useList(() => (accountId ? invitesCol(accountId) : null), (code, d): Invite => ({ code, email: String(d.email || ''), name: String(d.name || ''), perms: normalizePerms(d.perms), at: String(d.at || '') }), [accountId]);
