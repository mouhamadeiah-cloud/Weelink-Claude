// The visitor's account in the navbar of a published page: their name beside a person icon when
// signed in, «سجّل دخولك» when not. Pressing it opens the account window (sign in, make an account
// with the email code, details, orders). Ordering and buying as a guest stay open to everyone.
import React, { useEffect, useMemo, useState } from 'react';
import { onAccountOpenRequest } from './customerSession';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { SITE_DOMAIN } from '../../services/sites';
import { CustomerAccount } from './CustomerAccount';
import type { PageKind } from '../../services/pageCustomers';

// True while the signed-in visitor works in the account that owns this page (its owner or a team member).
const useIsPageOwner = (owner: string) => {
  const [mine, setMine] = useState(false);
  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        if (!owner || !u || u.isAnonymous) return setMine(false);
        if (u.uid === owner) return setMine(true);
        try {
          const snap = await getDoc(doc(db, 'userAccounts', u.uid));
          setMine(snap.exists() && snap.data().accountId === owner);
        } catch {
          setMine(false);
        }
      }),
    [owner]
  );
  return mine;
};

// «الإدارة» opens the owner's Weelink on this page's project, in its admin.
const manageUrl = (project: string) => {
  const host = window.location.hostname;
  const base = host === SITE_DOMAIN || host.endsWith(`.${SITE_DOMAIN}`) ? `https://${SITE_DOMAIN}` : window.location.origin;
  return `${base}/?manage=${encodeURIComponent(project)}`;
};

export const useAccountNav = (page: { ownerUid: string; pageName: string; kind: PageKind; accent: string; currency?: string; project?: string; owner?: string }) => {
  const isOwner = useIsPageOwner(page.owner || page.ownerUid) && !!page.project;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<{ signedIn: boolean; name: string }>({ signedIn: false, name: '' });
  useEffect(() => onAccountOpenRequest(() => setOpen(true)), []);
  const navActions = useMemo(
    () => [
      { id: 'nav-account', label: status.signedIn ? status.name || 'حسابي' : 'سجّل دخولك', icon: 'person' as const, onClick: () => setOpen(true) },
      ...(isOwner ? [{ id: 'nav-owner-admin', label: 'الإدارة', onClick: () => { window.location.href = manageUrl(page.project!); } }] : []),
    ],
    [status, isOwner, page.project]
  );
  const account = (
    <CustomerAccount {...page} open={open} onClose={() => setOpen(false)} onStatus={setStatus} />
  );
  return { navActions, account };
};
