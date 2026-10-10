// The customers of a page (a restaurant's site; later the shops and the car showrooms): a visitor
// signs up on the page with their Weelink account (the same Firebase sign-in the owners use, with a
// confirmed email or Google) and joins it.
//   pageCustomers/{ownerUid}/customers/{customerUid}   what the page's owner sees of the customer:
//                                                      name, email, phone, address, and whether they
//                                                      agreed to receive offers. Written by the
//                                                      customer only.
//   customerPages/{customerUid}/pages/{ownerUid}       the customer's own list of the pages they joined,
//                                                      shown when they open weelink.de.
// One page never sees another page's customers or what the customer does there. See firestore.rules.
import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export type PageKind = 'restaurant' | 'shop' | 'cars';

export interface CustomerProfile {
  name: string;
  phone: string;
  address: string;
  marketing: boolean; // agreed to receive the page's offers by email
}

export interface PageCustomer extends CustomerProfile {
  uid: string;
  email: string;
  joinedAt: string;
  updatedAt: string;
}

export interface JoinedPage {
  ownerUid: string;
  name: string;
  kind: PageKind;
  joinedAt: string;
}

const customerDoc = (ownerUid: string, customerUid: string) => doc(db, 'pageCustomers', ownerUid, 'customers', customerUid);
const joinedDoc = (customerUid: string, ownerUid: string) => doc(db, 'customerPages', customerUid, 'pages', ownerUid);

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const toCustomer = (uid: string, raw: any): PageCustomer => ({
  uid,
  email: str(raw?.email, 200),
  name: str(raw?.name, 100),
  phone: str(raw?.phone, 40),
  address: str(raw?.address, 300),
  marketing: raw?.marketing === true,
  joinedAt: str(raw?.joinedAt, 40),
  updatedAt: str(raw?.updatedAt, 40),
});

// The page's address for its customers (only restaurants have a published site so far).
export const pageUrl = (kind: PageKind, ownerUid: string) =>
  kind === 'restaurant' ? `${window.location.origin}/?r=${encodeURIComponent(ownerUid)}` : '';

export const PAGE_KIND_LABELS: Record<PageKind, string> = { restaurant: 'مطعم', shop: 'متجر', cars: 'معرض سيارات' };

// This customer's profile on that page, or null before they joined it.
export const readMyCustomerProfile = async (ownerUid: string, user: User): Promise<PageCustomer | null> => {
  const snap = await getDoc(customerDoc(ownerUid, user.uid));
  return snap.exists() ? toCustomer(user.uid, snap.data()) : null;
};

// Joins the page, or saves the changed profile. The rules accept it only from a confirmed email.
export const saveCustomerProfile = async (
  ownerUid: string,
  page: { name: string; kind: PageKind },
  user: User,
  profile: CustomerProfile,
  joinedAt?: string
) => {
  const now = new Date().toISOString();
  await setDoc(customerDoc(ownerUid, user.uid), {
    email: (user.email || '').toLowerCase(),
    name: str(profile.name, 100),
    phone: str(profile.phone, 40),
    address: str(profile.address, 300),
    marketing: profile.marketing,
    joinedAt: joinedAt || now,
    updatedAt: now,
  });
  await setDoc(joinedDoc(user.uid, ownerUid), { name: str(page.name, 100), kind: page.kind, joinedAt: joinedAt || now });
};

// The customer leaves the page: the owner no longer sees them.
export const leavePage = async (ownerUid: string, customerUid: string) => {
  await deleteDoc(customerDoc(ownerUid, customerUid));
  await deleteDoc(joinedDoc(customerUid, ownerUid)).catch(() => {});
};

// The owner removes a customer from the page's list.
export const removePageCustomer = (ownerUid: string, customerUid: string) => deleteDoc(customerDoc(ownerUid, customerUid));

// The page's customers, live, newest first (for the owner's admin window).
export function usePageCustomers(ownerUid: string | null) {
  const [state, setState] = useState<{ items: PageCustomer[]; ready: boolean; error: string }>({ items: [], ready: false, error: '' });
  useEffect(() => {
    if (!ownerUid) return;
    return onSnapshot(
      query(collection(db, 'pageCustomers', ownerUid, 'customers'), limit(5000)),
      (snap) => {
        const items = snap.docs.map((d) => toCustomer(d.id, d.data())).sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
        setState({ items, ready: true, error: '' });
      },
      (e) => setState({ items: [], ready: true, error: e.code || e.message })
    );
  }, [ownerUid]);
  return state;
}

// The pages this customer joined (for weelink.de).
export const listJoinedPages = async (customerUid: string): Promise<JoinedPage[]> => {
  const snap = await getDocs(collection(db, 'customerPages', customerUid, 'pages'));
  return snap.docs
    .map((d) => {
      const raw: any = d.data();
      const kind: PageKind = raw?.kind === 'shop' || raw?.kind === 'cars' ? raw.kind : 'restaurant';
      return { ownerUid: d.id, name: str(raw?.name, 100), kind, joinedAt: str(raw?.joinedAt, 40) };
    })
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
};

// This customer's orders at a restaurant, newest first. Sorted here: a query on the customer and the
// date together would need an index made by hand in Firebase.
export const listMyRestaurantOrders = async (ownerUid: string, customerUid: string) => {
  const snap = await getDocs(query(collection(db, 'restaurants', ownerUid, 'orders'), where('customerUid', '==', customerUid), limit(100)));
  return snap.docs.map((d) => ({ ...(d.data() as any), id: d.id })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
};
