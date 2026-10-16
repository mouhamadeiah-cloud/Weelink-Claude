// A designer's numbers (designers/{uid}: completed, ratingCount, ratingSum, verified) are never counted up
// and down by hand: they are worked out again from the designer's orders each time one changes, so a refund,
// a ruling on a complaint or a late rating cannot leave them wrong, and the office can recount at any time.
//   completed    orders that ended well: confirmed (by the customer or after the wait) or paid out
//   ratings      the ratings on those same orders (an order that was refunded counts for nothing)
//   verified     «معتمد من Weelink»: completed, ratings and average reach designerBadge.json
import badge from '../src/data/designerBadge.json' with { type: 'json' };

export interface Stats {
  completed: number;
  ratingCount: number;
  ratingSum: number;
}

const isVerified = (st: Stats) =>
  st.completed >= badge.minCompleted && st.ratingCount >= badge.minRatings && st.ratingSum / Math.max(1, st.ratingCount) >= badge.minAverage;

export const recountDesigner = async (db: any, uid: string): Promise<Stats & { verified: boolean }> => {
  const snap = await db.collection('designOrders').where('designerUid', '==', uid).get();
  const st: Stats = { completed: 0, ratingCount: 0, ratingSum: 0 };
  for (const d of snap.docs) {
    const o = d.data() as Record<string, any>;
    if (o.status !== 'confirmed' && o.status !== 'paid_out') continue;
    st.completed++;
    const stars = Number(o.rating?.stars);
    if (Number.isInteger(stars) && stars >= 1 && stars <= 5) {
      st.ratingCount++;
      st.ratingSum += stars;
    }
  }
  const out = { ...st, verified: isVerified(st) };
  await db.collection('designers').doc(uid).set(out, { merge: true });
  return out;
};
