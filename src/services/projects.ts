// Where an account's projects are saved (see src/utils/projectKeys.ts for the keys):
//   designs/{uid}                    the first project of each kind, one set of fields per kind
//                                    (pages/elements, shopPages/shopElements/shopAdmin, …).
//   designs/{uid}/projects/{key}     every later project, with the same field names as its kind's
//                                    first project, plus { kind, createdAt }.
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { ProjectType } from '../components/shop/shopTypes';
import { PROJECT_KINDS, isFirstOfKind, isProjectKey, kindOf } from '../utils/projectKeys';

export const PROJECT_FIELDS: Record<ProjectType, { pagesField: string; elementsField: string; adminField: string | null }> = {
  page: { pagesField: 'pages', elementsField: 'elements', adminField: null },
  shop: { pagesField: 'shopPages', elementsField: 'shopElements', adminField: 'shopAdmin' },
  cars: { pagesField: 'carPages', elementsField: 'carElements', adminField: 'carAdmin' },
  restaurant: { pagesField: 'restaurantPages', elementsField: 'restaurantElements', adminField: 'restaurantAdmin' },
  rental: { pagesField: 'rentalPages', elementsField: 'rentalElements', adminField: 'rentalAdmin' },
  hotel: { pagesField: 'hotelPages', elementsField: 'hotelElements', adminField: 'rentalAdmin' },
};

export const projectDoc = (uid: string, key: string) =>
  isFirstOfKind(key) ? doc(db, 'designs', uid) : doc(db, 'designs', uid, 'projects', key);

export type ProjectSummary = { key: string; kind: ProjectType; name: string; updatedAt: number | null };

const brandOf = (pages: unknown) => (Array.isArray(pages) && typeof pages[0]?.navbar?.brandName === 'string' ? pages[0].navbar.brandName : '');

const millis = (v: any) => (typeof v?.toMillis === 'function' ? v.toMillis() : typeof v === 'string' ? Date.parse(v) || null : null);

/** The account's projects that have pages saved: the first of each kind, then the later ones, oldest first. */
export const listProjects = async (uid: string): Promise<ProjectSummary[]> => {
  const out: ProjectSummary[] = [];
  const first = await getDoc(doc(db, 'designs', uid));
  if (first.exists()) {
    const data: any = first.data();
    for (const kind of PROJECT_KINDS) {
      const pages = data[PROJECT_FIELDS[kind].pagesField];
      if (Array.isArray(pages) && pages.length > 0) out.push({ key: kind, kind, name: brandOf(pages), updatedAt: millis(data.updatedAt) });
    }
  }
  const later = await getDocs(collection(db, 'designs', uid, 'projects'));
  const rest: (ProjectSummary & { createdAt: number })[] = [];
  later.forEach((snap) => {
    if (!isProjectKey(snap.id) || isFirstOfKind(snap.id)) return;
    const data: any = snap.data();
    const kind = kindOf(snap.id);
    rest.push({ key: snap.id, kind, name: brandOf(data[PROJECT_FIELDS[kind].pagesField]), updatedAt: millis(data.updatedAt), createdAt: millis(data.createdAt) || 0 });
  });
  rest.sort((a, b) => a.createdAt - b.createdAt);
  return [...out, ...rest.map(({ createdAt: _c, ...p }) => p)];
};

/** Fields every save of a later project carries, so the doc says what it is. */
export const laterProjectFields = (key: string) => (isFirstOfKind(key) ? {} : { kind: kindOf(key) });
