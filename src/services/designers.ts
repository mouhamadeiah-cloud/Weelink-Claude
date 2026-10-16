// The designers' programme («انضم لمصممينا»): a designer is a normal Weelink account (same email and
// password sign-in, same free page) with a public profile in designers/{uid}. The profile holds only
// what the gallery shows: the name and a short line. The numbers the platform controls (likes, the
// Weelink-approved badge, ratings, earnings) are not here: the rules do not let a designer write them
// and they arrive with the later phases, written by the server.
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { averageRating, isApproved, type DesignerStats } from '../data/designerBadge';

export interface DesignerProfile {
  name: string;
  bio: string;
  createdAt: string;
}

export const DESIGNER_NAME_MAX = 60;
const DESIGNER_BIO_MAX = 200;

export const readDesigner = async (uid: string): Promise<DesignerProfile | null> => {
  try {
    const snap = await getDoc(doc(db, 'designers', uid));
    if (!snap.exists()) return null;
    const d: any = snap.data();
    return {
      name: typeof d.name === 'string' ? d.name : '',
      bio: typeof d.bio === 'string' ? d.bio : '',
      createdAt: typeof d.createdAt === 'string' ? d.createdAt : '',
    };
  } catch {
    return null;
  }
};

// Makes the signed-in account a designer. Done once, at «انضم لمصممينا»; calling it again for an
// existing designer only returns the profile they already have.
export const becomeDesigner = async (uid: string, name: string): Promise<DesignerProfile> => {
  const existing = await readDesigner(uid);
  if (existing) return existing;
  const profile: DesignerProfile = {
    name: name.trim().slice(0, DESIGNER_NAME_MAX),
    bio: '',
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'designers', uid), profile);
  return profile;
};

const updateDesignerProfile = (uid: string, fields: Partial<Pick<DesignerProfile, 'name' | 'bio'>>) =>
  updateDoc(doc(db, 'designers', uid), {
    ...(fields.name !== undefined ? { name: fields.name.trim().slice(0, DESIGNER_NAME_MAX) } : {}),
    ...(fields.bio !== undefined ? { bio: fields.bio.trim().slice(0, DESIGNER_BIO_MAX) } : {}),
  });

// What the server keeps about a designer (api/design-orders.ts): finished orders and ratings. `verified` is the
// «معتمد من Weelink» badge, as the server last worked it out.
export interface DesignerPublic extends DesignerStats {
  verified: boolean;
  average: number;
}

const toPublicStats = (d: any): DesignerPublic => {
  const st: DesignerStats = { completed: Number(d?.completed) || 0, ratingCount: Number(d?.ratingCount) || 0, ratingSum: Number(d?.ratingSum) || 0 };
  return { ...st, verified: d?.verified === true && isApproved(st), average: averageRating(st) };
};

export const readDesignerStats = async (uid: string): Promise<DesignerPublic> => {
  try {
    return toPublicStats((await getDoc(doc(db, 'designers', uid))).data());
  } catch {
    return toPublicStats(null);
  }
};
