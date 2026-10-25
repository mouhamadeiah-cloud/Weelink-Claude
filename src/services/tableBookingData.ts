// The tables a restaurant's visitors can book: the halls its published site carries (restaurants/{id}.menu.halls,
// the same halls and tables as «الصالات والطاولات» in the admin and the staff's table plan).
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { restaurantIdOf } from '../utils/projectKeys';
import { BookableTable, tablesOfHalls } from './tableBooking';

export const useRestaurantTables = (owner: string | null | undefined, project: string | null | undefined): BookableTable[] => {
  const [state, setState] = useState<{ key: string; tables: BookableTable[] }>({ key: '', tables: [] });
  const key = owner && project ? `${owner}|${project}` : '';
  useEffect(() => {
    if (!owner || !project) return;
    return onSnapshot(
      doc(db, 'restaurants', restaurantIdOf(owner, project)),
      (snap) => setState({ key: `${owner}|${project}`, tables: tablesOfHalls(snap.data()?.menu?.halls) }),
      () => setState({ key: `${owner}|${project}`, tables: [] })
    );
  }, [owner, project]);
  return state.key === key ? state.tables : [];
};
