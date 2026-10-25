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

// Anyone signed in with a Weelink account who has not joined this page (a customer of other pages,
// the owner of another page, this page's owner or a team member): only their card (name, phone,
// address, email) is used to fill forms. It opens nothing of theirs and joins nothing.
export interface AccountCard {
  uid: string;
  email: string;
  name: string;
  phone: string;
  address: string;
}

let card: AccountCard | null = null;

export const setAccountCard = (c: AccountCard | null) => {
  card = c;
  listeners.forEach((l) => l());
};

export const getAccountCard = () => card;

export const useAccountCard = () => useSyncExternalStore(subscribe, getAccountCard, () => null);

// Fills a form from the signed-in person's saved details (only what the visitor has not typed):
// the page's customer profile when they joined it, else their Weelink account card.
export const useCustomerPrefill = (fill: (c: { name: string; phone: string; address: string; email: string }) => void) => {
  const customer = useCustomerSession();
  const own = useAccountCard();
  useEffect(() => {
    if (customer) {
      const p = customer.profile;
      fill({ name: p.name, phone: p.phone, address: p.address, email: customer.email || '' });
    } else if (own) {
      fill({ name: own.name, phone: own.phone, address: own.address, email: own.email });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, own]);
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
