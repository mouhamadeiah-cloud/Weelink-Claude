// The owners' sign-in, with Firebase Authentication only (see firestore.rules).
// A workspace (designs/{id}, restaurants/{id}, ...) is named by its account id: the Firebase user's
// uid for an account made with Firebase, or the old 'sim_...' id of an account made before the real
// sign-in existed. accounts/{id} says which Firebase user owns such an old workspace, and
// userAccounts/{uid} where a Firebase user's workspace is.
//
// The old accounts kept their password in plain text in simulated_users/{email}. On their first
// sign-in a Firebase user is made with the same email and password; the rules let it claim the old
// workspace only if the password matches the old one (legacyClaims/{email}), and the plain-text
// password is then deleted.
import { User, createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { deleteDoc, deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// While a sign-in is running, App leaves the workspace to the sign-in screen (it calls onAuthSuccess
// with the right account once the old account has been claimed).
let signingIn = false;
export const isSigningIn = () => signingIn;

const cacheKey = (uid: string) => `weelink_account_${uid}`;
const cacheAccount = (uid: string, accountId: string) => {
  try {
    localStorage.setItem(cacheKey(uid), accountId);
  } catch {
    // storage unavailable
  }
};

// The account a Firebase user works in. Offline, the one remembered on this browser.
export const resolveAccountId = async (user: User): Promise<string> => {
  try {
    const snap = await getDoc(doc(db, 'userAccounts', user.uid));
    const id = snap.exists() ? snap.data().accountId : '';
    const accountId = typeof id === 'string' && id ? id : user.uid;
    cacheAccount(user.uid, accountId);
    return accountId;
  } catch {
    try {
      return localStorage.getItem(cacheKey(user.uid)) || user.uid;
    } catch {
      return user.uid;
    }
  }
};

// Removes the plain-text password left in simulated_users (the rules allow only that change).
const dropOldPassword = (user: User, email: string) =>
  updateDoc(doc(db, 'simulated_users', email), { password: deleteField(), migratedTo: user.uid }).catch(() => {});

// Moves an old account to the Firebase user just made with its email and password.
// Returns the old account's id, or '' when there is no old account with that password.
const claimOldAccount = async (user: User, email: string, password: string): Promise<string> => {
  const claim = doc(db, 'legacyClaims', email);
  try {
    await setDoc(claim, { authUid: user.uid, password });
  } catch {
    return '';
  }
  try {
    const old = await getDoc(doc(db, 'simulated_users', email));
    const oldId = old.exists() ? old.data().uid : '';
    if (typeof oldId !== 'string' || !oldId) return '';
    if (oldId !== user.uid) {
      await setDoc(doc(db, 'accounts', oldId), { owner: user.uid, email, createdAt: new Date().toISOString() });
      await setDoc(doc(db, 'userAccounts', user.uid), { accountId: oldId });
    }
    cacheAccount(user.uid, oldId);
    await dropOldPassword(user, email);
    return oldId;
  } finally {
    await deleteDoc(claim).catch(() => {});
  }
};

const isBadCredentials = (code: string) =>
  ['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/user-not-found', 'auth/wrong-password'].includes(code);

export class SignInError extends Error {
  constructor(public kind: 'credentials' | 'exists' | 'weak' | 'disabled' | 'network') {
    super(kind);
  }
}

const toSignInError = (e: any): SignInError => {
  const code = String(e?.code || '');
  if (e instanceof SignInError) return e;
  if (isBadCredentials(code)) return new SignInError('credentials');
  if (code === 'auth/email-already-in-use') return new SignInError('exists');
  if (code === 'auth/weak-password') return new SignInError('weak');
  if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') return new SignInError('disabled');
  return new SignInError('network');
};

// Signs an owner in and returns the account id to open.
export const signInOwner = async (email: string, password: string): Promise<string> => {
  signingIn = true;
  try {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      dropOldPassword(user, email);
      return await resolveAccountId(user);
    } catch (e: any) {
      if (!isBadCredentials(String(e?.code || ''))) throw e;
    }
    // Not a Firebase user yet: maybe an old account. Firebase refuses when the email already has a
    // Firebase user, which means the password was wrong.
    let user: User;
    try {
      user = (await createUserWithEmailAndPassword(auth, email, password)).user;
    } catch (e: any) {
      if (String(e?.code || '') === 'auth/email-already-in-use') throw new SignInError('credentials');
      throw e;
    }
    const oldId = await claimOldAccount(user, email, password).catch(() => '');
    if (oldId) return oldId;
    // No old account with that email and password: undo the Firebase user just made.
    await deleteUser(user).catch(() => auth.signOut());
    throw new SignInError('credentials');
  } catch (e) {
    throw toSignInError(e);
  } finally {
    signingIn = false;
  }
};

// Makes a new owner account. Someone with an old account who signs up again with the same email and
// password gets the old account back.
export const registerOwner = async (email: string, password: string): Promise<{ accountId: string; isNew: boolean }> => {
  signingIn = true;
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    const oldId = await claimOldAccount(user, email, password).catch(() => '');
    if (oldId) return { accountId: oldId, isNew: false };
    cacheAccount(user.uid, user.uid);
    return { accountId: user.uid, isNew: true };
  } catch (e) {
    throw toSignInError(e);
  } finally {
    signingIn = false;
  }
};
