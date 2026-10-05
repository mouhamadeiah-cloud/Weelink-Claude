// Order numbers count up from 1 each day (1, 2, 3...), per restaurant, so the kitchen, the waiting
// screen and the guest all speak of a short number. The count lives in restaurants/{uid}/counters/{day}
// and is taken inside the transaction that writes the order, so two devices never get the same one.
// Where the counter cannot be read (the Firestore rules in use predate it) the order keeps its
// time-based number instead of failing.
import { doc, Transaction } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { todayKey } from './restaurantTypes';

const counterRef = (uid: string) => doc(db, 'restaurants', uid, 'counters', todayKey());

export interface NextNumber {
  n: number;
  take: () => void; // writes the new count; call it with the transaction's other writes
}

// Reads only: call it before the transaction's first write.
export const readNextNumber = async (tx: Transaction, uid: string): Promise<NextNumber | null> => {
  const ref = counterRef(uid);
  try {
    const s = await tx.get(ref);
    const n = (s.exists() ? Math.max(0, Math.floor(Number(s.data().n)) || 0) : 0) + 1;
    return { n, take: () => tx.set(ref, { n }) };
  } catch (e) {
    console.warn('Daily order numbers are not available (are the new Firestore rules published?):', e);
    return null;
  }
};
