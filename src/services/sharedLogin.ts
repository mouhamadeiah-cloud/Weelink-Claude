// One sign-in for all Weelink pages: each published page lives on its own address, and a browser
// keeps the Firebase login per address, so after a customer signs in on one page a signed cookie on
// the parent domain (kept by /api/email-code) lets the next page sign them in again by itself.
// Pages on a customer's own domain do not share it; there the visitor signs in once.
import { signInWithCustomToken, User } from 'firebase/auth';
import { auth } from './firebase';

const post = (body: object, headers: Record<string, string> = {}) =>
  fetch('/api/email-code', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), credentials: 'same-origin' });

// Remembers the signed-in, email-confirmed user for the other Weelink pages.
export const rememberLogin = async (user: User) => {
  if (!user.emailVerified) return;
  try {
    await post({ action: 'session-set' }, { Authorization: `Bearer ${await user.getIdToken()}` });
  } catch {
    /* the login only stays on this page then */
  }
};

// Signs this browser in with the login another Weelink page remembered, if there is one.
export const resumeLogin = async (): Promise<boolean> => {
  try {
    await auth.authStateReady();
    if (auth.currentUser && !auth.currentUser.isAnonymous) return true;
    const res = await post({ action: 'session-resume' });
    const data = (await res.json().catch(() => ({}))) as { signedIn?: boolean; customToken?: string };
    if (!res.ok || !data.signedIn || !data.customToken) return false;
    await signInWithCustomToken(auth, data.customToken);
    return true;
  } catch {
    return false;
  }
};

// Forgets the shared login (when the visitor signs out).
export const forgetLogin = async () => {
  try {
    await post({ action: 'session-clear' });
  } catch {
    /* ignore */
  }
};
