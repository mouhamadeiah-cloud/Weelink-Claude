// How many design orders wait for the signed-in account to do something: a delivered design to confirm
// (as a customer) or a paid order to work on (as a designer). Shown as a red number on «طلبات التصميم».
import { useEffect, useState } from 'react';
import { subscribeMyOrders } from './designOrders';

export const useOrderAttention = (uid: string): number => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!uid) {
      setN(0);
      return;
    }
    return subscribeMyOrders(uid, (asCustomer, asDesigner) =>
      setN(asCustomer.filter((o) => o.status === 'delivered').length + asDesigner.filter((o) => o.status === 'paid').length));
  }, [uid]);
  return n;
};

export const AttentionDot = ({ n }: { n: number }) =>
  n > 0 ? <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums" aria-label={`${n} تحتاج إجراءً`}>{n}</span> : null;
