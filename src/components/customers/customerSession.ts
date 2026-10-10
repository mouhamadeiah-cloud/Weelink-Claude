// The signed-in customer of the page being viewed, once they joined it: the order form fills in
// their name, phone and address, and their orders carry their uid so they can see them later.
import { useSyncExternalStore } from 'react';
import type { CustomerProfile } from '../../services/pageCustomers';

export interface CustomerSession {
  uid: string;
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
