// The owner's Wee AI answers as the questions saved them (platform_directory/{uid}, the browser's copy when offline), for the build that
// starts by itself once the questions are done. Each kind keeps its own business answers (byKind), as WeeAIChat reads them back.
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { WeeAnswers } from './weeWriter';

const pick = (data: any, kind: string): WeeAnswers | null => {
  if (!data || typeof data !== 'object') return null;
  const mine = data.byKind?.[kind];
  const own = mine && data.pageKind !== kind ? { catalogInfo: mine.catalogInfo, aiAnswers: mine.aiAnswers } : { catalogInfo: data.catalogInfo, aiAnswers: data.aiAnswers };
  if (!own.aiAnswers && !own.catalogInfo) return null;
  return {
    personalInfo: data.personalInfo || {},
    addressInfo: data.addressInfo || {},
    contactInfo: data.contactInfo || {},
    catalogInfo: own.catalogInfo || {},
    aiAnswers: own.aiAnswers || {},
    ...(['restaurant', 'shop', 'cars', 'rental', 'hotel'].includes(data.flavor) ? { flavor: data.flavor } : {}),
  } as WeeAnswers;
};

export const savedAnswers = async (uid: string, kind: string): Promise<WeeAnswers | null> => {
  try {
    const snap = await getDoc(doc(db, 'platform_directory', uid));
    const found = snap.exists() ? pick(snap.data(), kind) : null;
    if (found) return found;
  } catch (err) {
    console.warn('Could not read the saved answers, trying the local copy:', err);
  }
  try {
    return pick(JSON.parse(localStorage.getItem('weelink_chat_progress_' + uid) || 'null'), kind);
  } catch {
    return null;
  }
};
