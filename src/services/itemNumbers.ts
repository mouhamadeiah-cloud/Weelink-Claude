// The public number of an item (Eyad, 18 Oct): every car, dish, product (and later service) has one number
// no other item of its kind has, on any page: C-10001, F-10001, S-10001, V-10001. The server hands the
// numbers out (api/item-numbers.ts). An item is saved first and numbered right after, so adding is
// never held up; items without a number (all the older ones, or when the server could not be reached)
// are numbered the next time the owner's admin is open.
import { useEffect, useRef, useState } from 'react';
import { auth } from './firebase';
import { giveNumbers, missingIds, type ItemKind } from '../utils/itemNumbers';

// `count` new numbers of a kind from the server, as the first one (they run on from it); null when
// the server can't be reached or the person isn't signed in.
export const requestNumbers = async (kind: ItemKind, count: number): Promise<number | null> => {
  const user = auth.currentUser;
  if (!user || user.isAnonymous || count < 1) return null;
  try {
    const res = await fetch('/api/item-numbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ kind, count: Math.min(200, count) }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { from?: number };
    return typeof body.from === 'number' ? body.from : null;
  } catch {
    return null;
  }
};

// Numbers the items of one kind that have none, once the owner's admin is open (`enabled`): asks for as
// many numbers as there are items to number, then gives them by the items' ids (`set` takes the list
// updater). When the server can't be reached it tries again a minute later.
export const useItemNumbers = <T extends { id: string; publicNo: number }>(
  kind: ItemKind,
  items: T[],
  enabled: boolean,
  set: (fn: (list: T[]) => T[]) => void
) => {
  const busy = useRef(false);
  const [again, setAgain] = useState(0);
  const ids = missingIds(items);
  const key = ids.join();
  useEffect(() => {
    if (!enabled || !ids.length || busy.current) return;
    busy.current = true;
    requestNumbers(kind, ids.length).then((from) => {
      busy.current = false;
      if (from === null) {
        window.setTimeout(() => setAgain((n) => n + 1), 60000);
        return;
      }
      set((list) => giveNumbers(list, ids, from));
      // Items added while the numbers were on their way are numbered by the next round.
      setAgain((n) => n + 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, again]);
};
