// A designer's drafts (Eyad, 14 Oct): up to ten, each one slide or one page being designed in «وضع المصمم»,
// kept apart from the designer's own page. designerDrafts/{uid}/items/{d1..d10}; the rules accept
// only those ten ids and only the designer reads and writes them.
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const DRAFT_SLOTS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10'];
export const MAX_DRAFTS = DRAFT_SLOTS.length;

import type { DesignKind } from '../data/slideCategories';

export interface DraftMeta {
  slot: string;
  name: string;
  // A slide, or a page of three slides with a navbar. Drafts made before pages are slides.
  kind: DesignKind;
  updatedAt: number;
}

export interface DraftData {
  name: string;
  kind: DesignKind;
  pages: any[];
  elements: any[];
}

const kindOf = (v: unknown): DesignKind => (v === 'page' ? 'page' : 'slide');

const draftRef = (uid: string, slot: string) => doc(db, 'designerDrafts', uid, 'items', slot);

export const listDrafts = async (uid: string): Promise<DraftMeta[]> => {
  const snap = await getDocs(collection(db, 'designerDrafts', uid, 'items'));
  return snap.docs
    .filter((d) => DRAFT_SLOTS.includes(d.id))
    .map((d) => {
      const data: any = d.data();
      return { slot: d.id, name: typeof data.name === 'string' ? data.name : '', kind: kindOf(data.kind), updatedAt: data.updatedAt?.toMillis?.() || 0 };
    })
    .sort((a, b) => DRAFT_SLOTS.indexOf(a.slot) - DRAFT_SLOTS.indexOf(b.slot));
};

export const readDraft = async (uid: string, slot: string): Promise<DraftData | null> => {
  const snap = await getDoc(draftRef(uid, slot));
  if (!snap.exists()) return null;
  const d: any = snap.data();
  return { name: typeof d.name === 'string' ? d.name : '', kind: kindOf(d.kind), pages: Array.isArray(d.pages) ? d.pages : [], elements: Array.isArray(d.elements) ? d.elements : [] };
};

export const saveDraft = (uid: string, slot: string, data: DraftData) =>
  setDoc(draftRef(uid, slot), { name: data.name.slice(0, 60), kind: data.kind, pages: data.pages, elements: data.elements, updatedAt: serverTimestamp() });

export const deleteDraft = (uid: string, slot: string) => deleteDoc(draftRef(uid, slot));

// The first free slot, or null when all ten are used.
export const freeSlot = (drafts: DraftMeta[]) => DRAFT_SLOTS.find((s) => !drafts.some((d) => d.slot === s)) || null;
