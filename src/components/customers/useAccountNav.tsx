// The visitor's account in the navbar of a published page: their name beside a person icon when
// signed in, «سجّل دخولك» when not. Pressing it opens the account window (sign in, make an account
// with the email code, details, orders). Ordering and buying as a guest stay open to everyone.
import React, { useEffect, useMemo, useState } from 'react';
import { onAccountOpenRequest } from './customerSession';
import { CustomerAccount } from './CustomerAccount';
import type { PageKind } from '../../services/pageCustomers';

export const useAccountNav = (page: { ownerUid: string; pageName: string; kind: PageKind; accent: string; currency?: string }) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<{ signedIn: boolean; name: string }>({ signedIn: false, name: '' });
  useEffect(() => onAccountOpenRequest(() => setOpen(true)), []);
  const navActions = useMemo(
    () => [{ id: 'nav-account', label: status.signedIn ? status.name || 'حسابي' : 'سجّل دخولك', icon: 'person' as const, onClick: () => setOpen(true) }],
    [status]
  );
  const account = (
    <CustomerAccount {...page} open={open} onClose={() => setOpen(false)} onStatus={setStatus} />
  );
  return { navActions, account };
};
