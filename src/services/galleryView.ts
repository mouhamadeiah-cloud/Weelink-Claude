// The designers' gallery, visitor side (Eyad, 14 Oct): the approved slides and pages, a visitor's own votes, and
// voting. The counters are written by api/gallery.ts only; this reads them and asks it to vote.
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { deserializeElements } from '../utils/elementStorage';
import type { CanvasElement, NavbarConfig, Slide } from '../types';
import type { DesignKind } from '../data/slideCategories';

export interface GallerySlide {
  id: string;
  // A slide, or a page: three slides with a navbar (`page`).
  kind: DesignKind;
  page: { navbar?: NavbarConfig; slides?: Slide[] } | null;
  name: string;
  category: string;
  designerUid: string;
  designerName: string;
  likes: number;
  dislikes: number;
  // When it was approved (or exported, for slides approved before the date was kept), in ms.
  at: number;
  slide: any;
  elements: CanvasElement[];
}

// A slide is «جديد» for a week after it appears, so a good new designer is seen next to the old ones.
export const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000;
export const isNewSlide = (s: GallerySlide) => Date.now() - s.at < NEW_FOR_MS;

// The first approved slides. A page of the gallery for now: more come with paging.
const GALLERY_LIMIT = 60;

export const listApprovedSlides = async (): Promise<GallerySlide[]> => {
  const snap = await getDocs(query(collection(db, 'gallerySlides'), where('status', '==', 'approved'), limit(GALLERY_LIMIT)));
  return snap.docs.map((d) => {
    const x: any = d.data();
    return {
      id: d.id,
      kind: x.kind === 'page' ? 'page' : 'slide',
      page: x.kind === 'page' && x.page ? x.page : null,
      name: String(x.name || ''),
      category: String(x.category || 'other'),
      designerUid: String(x.designerUid || ''),
      designerName: String(x.designerName || ''),
      likes: Number(x.likes) || 0,
      dislikes: Number(x.dislikes) || 0,
      at: Number(x.approvedAt) || x.createdAt?.toMillis?.() || 0,
      slide: x.slide || {},
      elements: deserializeElements(Array.isArray(x.elements) ? x.elements : []),
    };
  });
};

// The signed-in visitor's votes: slide id → 1 (like) or -1 (dislike).
export const readMyVotes = async (uid: string): Promise<Record<string, number>> => {
  const snap = await getDoc(doc(db, 'galleryVotes', uid));
  const votes = (snap.data() as { votes?: Record<string, number> } | undefined)?.votes || {};
  return Object.fromEntries(Object.entries(votes).filter(([, v]) => v === 1 || v === -1));
};

export class VoteError extends Error {
  constructor(public kind: 'unverified' | 'own' | 'too_fast' | 'unauthorized' | 'network') {
    super(kind);
  }
}

// value 1 = like, -1 = dislike, 0 = take the vote back.
export const voteOnSlide = async (user: User, slideId: string, value: 1 | -1 | 0) => {
  let res: Response;
  try {
    res = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ action: 'vote', slideId, value }),
    });
  } catch {
    throw new VoteError('network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = String(data.error || '');
    throw new VoteError(e === 'unverified' || e === 'own' || e === 'too_fast' || e === 'unauthorized' ? e : 'network');
  }
  return data as { likes: number; dislikes: number; mine: number };
};

export const voteErrorText = (e: unknown) => {
  const kind = e instanceof VoteError ? e.kind : 'network';
  if (kind === 'unverified') return 'أكّد بريدك الإلكتروني أولاً لتصوّت.';
  if (kind === 'own') return 'ما بتقدر تصوّت على تصميمك.';
  if (kind === 'too_fast') return 'على مهلك، جرّب بعد لحظة.';
  if (kind === 'unauthorized') return 'سجّل دخولك لتصوّت.';
  return 'تعذّر التصويت. تأكد من اتصالك وجرّب مرة ثانية.';
};
