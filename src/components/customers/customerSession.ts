// The signed-in customer of the page being viewed, once they joined it: the order form fills in
// their name, phone and address, and their orders carry their uid so they can see them later.
import { useEffect, useSyncExternalStore } from 'react';
import type { CustomerProfile } from '../../services/pageCustomers';

export interface CustomerSession {
  uid: string;
  email?: string;
  profile: CustomerProfile;
}

let current: CustomerSession | null = null;
const listeners = new Set<() => void>();

export const setCustomerSession = (s: CustomerSession | null) => {
  current = s;
  listeners.forEach((l) => l());
};

export const getCustomerSession = () => current;

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const useCustomerSession = () => useSyncExternalStore(subscribe, getCustomerSession, () => null);

// Fills a form from the signed-in customer's saved details (only what the visitor has not typed).
export const useCustomerPrefill = (fill: (c: { name: string; phone: string; address: string; email: string }) => void) => {
  const customer = useCustomerSession();
  useEffect(() => {
    if (!customer) return;
    const p = customer.profile;
    fill({ name: p.name, phone: p.phone, address: p.address, email: customer.email || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);
};

// Lets any form on a published page open the account window of its navbar entry.
const openers = new Set<() => void>();
export const onAccountOpenRequest = (fn: () => void) => {
  openers.add(fn);
  return () => {
    openers.delete(fn);
  };
};
export const requestAccountOpen = () => openers.forEach((fn) => fn());
export const canRequestAccount = () => openers.size > 0;
