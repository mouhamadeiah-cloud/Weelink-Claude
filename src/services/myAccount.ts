// The account page («حسابي»): the person's own details, password, subscription, payments and notices.
//   name     the Firebase user's displayName
//   phone    designs/{uid}.profile.phone (and the Wee AI answers' contact phone when they exist, so new
//            projects' questions start from it)
//   subscription, AI balance, payments   /api/admin { action: 'my-account' }, read on the server
import { useEffect, useState } from 'react';
import {
  EmailAuthProvider, GoogleAuthProvider, deleteUser, reauthenticateWithCredential, reauthenticateWithPopup,
  sendPasswordResetEmail, updatePassword, updateProfile, type User,
} from 'firebase/auth';
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { subscribeMyOrders } from './designOrders';
import { isFirstOfKind, kindOf, restaurantIdOf } from '../utils/projectKeys';

export const usesPassword = (user: User) => user.providerData.some((p) => p.providerId === 'password');

export const readPhone = async (uid: string): Promise<string> => {
  const snap = await getDoc(doc(db, 'designs', uid)).catch(() => null);
  const phone = snap?.data()?.profile?.phone;
  if (typeof phone === 'string') return phone;
  const dir = await getDoc(doc(db, 'platform_directory', uid)).catch(() => null);
  return String(dir?.data()?.contactInfo?.phone || '');
};

export const saveProfile = async (user: User, name: string, phone: string) => {
  const cleanName = name.trim().slice(0, 80);
  const cleanPhone = phone.trim().slice(0, 40);
  if (cleanName !== (user.displayName || '')) await updateProfile(user, { displayName: cleanName });
  await setDoc(doc(db, 'designs', user.uid), { profile: { phone: cleanPhone } }, { merge: true });
  // Only into answers that already exist: a new platform_directory doc would open the Wee AI questions.
  const dir = doc(db, 'platform_directory', user.uid);
  if ((await getDoc(dir).catch(() => null))?.exists()) {
    await updateDoc(dir, { 'contactInfo.phone': cleanPhone, ...(cleanName ? { 'personalInfo.fullName': cleanName } : {}) }).catch(() => {});
  }
};

/** Firebase asks for the password (or Google) again before a password change or a deletion. */
export const confirmIdentity = async (user: User, password: string) => {
  if (usesPassword(user)) await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email || '', password));
  else await reauthenticateWithPopup(user, new GoogleAuthProvider());
};

export const changePassword = async (user: User, current: string, next: string) => {
  await confirmIdentity(user, current);
  await updatePassword(user, next);
};

export const sendPasswordReset = (email: string) => sendPasswordResetEmail(auth, email);

export const authErrorText = (e: any) => {
  const code = String(e?.code || '');
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'كلمة السر الحالية غلط.';
  if (code.includes('weak-password')) return 'كلمة السر الجديدة ضعيفة، لازم تكون 6 أحرف أو أكتر.';
  if (code.includes('too-many-requests')) return 'محاولات كتير. استنى شوي وجرّب.';
  if (code.includes('popup')) return 'انسكّرت نافذة Google قبل التأكيد.';
  if (code.includes('network')) return 'ما في اتصال. جرّب مرة تانية.';
  return 'صار خطأ. جرّب مرة تانية.';
};

// ---------- Subscription, balance, payments ----------

export interface MyPayment {
  id: string;
  invoiceNo: string;
  planName: string;
  period: 'monthly' | 'yearly';
  amount: number;
  method: string;
  paidAt: number;
  coversFrom: number;
  coversTo: number;
  invoiceUrl: string;
}

export interface MyAccountData {
  status: string;
  subscription: { plan: string; planName: string; period: 'monthly' | 'yearly'; endsAt: number; freezeAt: number; trial: boolean } | null;
  tokens: { balance: number; used: number };
  payments: MyPayment[];
}

export const fetchMyAccount = async (user: User): Promise<MyAccountData> => {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify({ action: 'my-account' }),
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.json();
};

// ---------- The bell ----------

export interface Notice {
  id: string;
  kind: 'booking' | 'rating' | 'design';
  text: string;
  at: string;
}

const RECENT_RATING_MS = 14 * 24 * 3600 * 1000;

/** What waits for the account: new bookings, recent ratings without a reply, design orders to act on. */
export const useNotices = (accountId: string, uid: string, on = true): Notice[] => {
  const [bookings, setBookings] = useState<Notice[]>([]);
  const [ratings, setRatings] = useState<Notice[]>([]);
  const [designs, setDesigns] = useState<Notice[]>([]);
  useEffect(() => {
    if (!on || !accountId) return;
    const stop = onSnapshot(
      query(collection(db, 'bookings', accountId, 'items'), where('status', '==', 'new'), limit(50)),
      (snap) => setBookings(snap.docs.map((d) => {
        const b: any = d.data();
        return { id: `b_${d.id}`, kind: 'booking' as const, text: `موعد جديد من ${b.name || 'زبون'}${b.pageName ? ` على «${b.pageName}»` : ''}: ${b.date || ''} ${b.slot || ''}`.trim(), at: String(b.createdAt || '') };
      })),
      () => setBookings([])
    );
    return stop;
  }, [accountId, on]);
  useEffect(() => {
    if (!on || !accountId) return;
    getDocs(query(collection(db, 'ratings', accountId, 'items'), orderBy('createdAt', 'desc'), limit(20)))
      .then((snap) => setRatings(snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((r) => !r.reply && Date.now() - Date.parse(r.createdAt || '') < RECENT_RATING_MS)
        .map((r) => ({ id: `r_${r.id}`, kind: 'rating' as const, text: `تقييم ${'★'.repeat(Math.max(1, Math.min(5, Number(r.stars) || 0)))} من ${r.name || 'زائر'}${r.text ? `: «${String(r.text).slice(0, 80)}»` : ''}`, at: String(r.createdAt || '') }))))
      .catch(() => setRatings([]));
  }, [accountId, on]);
  useEffect(() => {
    if (!on || !uid) return;
    return subscribeMyOrders(uid, (asCustomer, asDesigner) =>
      setDesigns([
        ...asCustomer.filter((o) => o.status === 'delivered').map((o) => ({ id: `d_${o.id}`, kind: 'design' as const, text: `وصلك تصميم «${o.slideName}» من ${o.designerName}، أكّد الاستلام`, at: new Date(o.updatedAt || 0).toISOString() })),
        ...asDesigner.filter((o) => o.status === 'paid').map((o) => ({ id: `d_${o.id}`, kind: 'design' as const, text: `طلب تصميم مدفوع «${o.slideName}» بانتظارك`, at: new Date(o.updatedAt || 0).toISOString() })),
      ]));
  }, [uid, on]);
  return [...bookings, ...ratings, ...designs].sort((a, b) => b.at.localeCompare(a.at));
};

// ---------- Deleting ----------

const FIELDS: Record<string, string[]> = {
  page: ['pages', 'elements'],
  shop: ['shopPages', 'shopElements', 'shopAdmin'],
  cars: ['carPages', 'carElements', 'carAdmin'],
  restaurant: ['restaurantPages', 'restaurantElements', 'restaurantAdmin'],
};

/** Removes a project's design (and a restaurant's live site); unpublishing is the caller's. */
export const deleteProjectData = async (uid: string, key: string) => {
  const kind = kindOf(key);
  if (kind === 'restaurant') await deleteDoc(doc(db, 'restaurants', restaurantIdOf(uid, key))).catch(() => {});
  if (isFirstOfKind(key)) {
    await updateDoc(doc(db, 'designs', uid), Object.fromEntries(FIELDS[kind].map((f) => [f, deleteField()])));
  } else {
    await deleteDoc(doc(db, 'designs', uid, 'projects', key));
  }
};

/** The whole account: every project's data, then the sign-in itself. */
export const deleteAccountData = async (user: User, keys: string[]) => {
  for (const key of keys) {
    if (kindOf(key) === 'restaurant') await deleteDoc(doc(db, 'restaurants', restaurantIdOf(user.uid, key))).catch(() => {});
    if (!isFirstOfKind(key)) await deleteDoc(doc(db, 'designs', user.uid, 'projects', key)).catch(() => {});
  }
  await deleteDoc(doc(db, 'designs', user.uid)).catch(() => {});
  await deleteDoc(doc(db, 'platform_directory', user.uid)).catch(() => {});
  await deleteUser(user);
};
