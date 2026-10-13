// How many people opened a published page, and how many of them tapped its WhatsApp, call or email
// links, per day (the page's admin shows them). One small counter document per page and day:
//   siteStats/{owner}/days/{project}_{yyyy-mm-dd}   { visits, contacts }
// A visitor adds 1 at a time (the rules allow nothing else); only the owner and members read them.
import { collection, doc, documentId, getDocs, increment, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import type { ProjectType } from '../components/shop/shopTypes';

export type DayStats = { day: string; visits: number; contacts: number };

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayRef = (owner: string, project: ProjectType) => doc(db, 'siteStats', owner, 'days', `${project}_${dayKey(new Date())}`);

const bump = (owner: string, project: ProjectType, field: 'visits' | 'contacts') =>
  setDoc(dayRef(owner, project), { [field]: increment(1) }, { merge: true }).catch(() => {
    // a counter that could not be written is not worth bothering the visitor about
  });

// Once per visitor and tab, however many pages of the site they open.
export const countVisit = (owner: string, project: ProjectType) => {
  const key = `weelink_visit_${owner}_${project}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // no session storage: count every load
  }
  bump(owner, project, 'visits');
};

// A WhatsApp, call or email link on the page (or a link to a messenger).
export const isContactLink = (url: string) => /^(tel:|mailto:|sms:)|^https?:\/\/(wa\.me|api\.whatsapp\.com|m\.me|t\.me)\//i.test(url);
export const countContact = (owner: string, project: ProjectType) => bump(owner, project, 'contacts');

// The last `days` days, oldest first, with the days nobody came as zeros.
export const readStats = async (owner: string, project: ProjectType, days = 30): Promise<DayStats[]> => {
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const snap = await getDocs(
    query(collection(db, 'siteStats', owner, 'days'), where(documentId(), '>=', `${project}_${dayKey(from)}`), where(documentId(), '<=', `${project}_~`))
  );
  const byDay = new Map(snap.docs.map((d) => [d.id.slice(project.length + 1), d.data()]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = dayKey(d);
    const row: any = byDay.get(key) || {};
    return { day: key, visits: Number(row.visits) || 0, contacts: Number(row.contacts) || 0 };
  });
};
