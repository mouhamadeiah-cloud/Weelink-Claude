// Wee AI answers given before signing up live on this device under the guest id (see WeeAIChat's
// WEE_GUEST_ID). Once the visitor has an account they move to it: this device's copy and the
// account's onboarding card (platform_directory/{uid}), then the guest copy is removed.
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { ProjectType } from '../components/shop/shopTypes';

const GUEST_KEY = 'weelink_chat_progress_guest';
const KINDS: ProjectType[] = ['page', 'shop', 'restaurant', 'cars'];

export const readGuestAnswers = (): any | null => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Starting the questions for another kind of page: the work step's lists differ, so its answer goes.
export const setGuestKind = (kind: ProjectType) => {
  const data = readGuestAnswers();
  if (!data || data.pageKind === kind) return;
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify({ ...data, pageKind: kind, catalogInfo: undefined }));
  } catch {
    // storage unavailable: the questions just start blank
  }
};

export const guestKindOf = (data: any): ProjectType | null => (KINDS.includes(data?.pageKind) ? data.pageKind : null);

// Moves the guest answers to the account; resolves to the kind of page they were for (null when none).
export const moveGuestAnswers = async (uid: string, email: string): Promise<ProjectType | null> => {
  const data = readGuestAnswers();
  if (!data || !uid) return null;
  const answers = {
    ...data,
    contactInfo: { ...(data.contactInfo || {}), email: data.contactInfo?.email || email },
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(`weelink_chat_progress_${uid}`, JSON.stringify(answers));
    localStorage.removeItem(GUEST_KEY);
  } catch {
    // storage unavailable: the cloud copy below still carries them
  }
  const clean = JSON.parse(JSON.stringify(answers)); // Firestore refuses undefined fields
  await setDoc(doc(db, 'platform_directory', uid), { ...clean, updatedAt: serverTimestamp() }, { merge: true }).catch((err) =>
    console.warn('Could not save the answers to the account yet (kept on this device):', err)
  );
  return guestKindOf(answers);
};
