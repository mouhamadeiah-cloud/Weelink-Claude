// The designers' gallery, designer side (Eyad, 14 Oct): the page's law, and exporting a slide.
// An exported slide is saved as gallerySlides/{id} with status 'pending' and stays hidden until the
// platform's admin approves it (api/admin.ts, action 'slide-review'); a designer cannot set any
// other status (firestore.rules). The law the designer agreed to is recorded by its version.
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface PageLaw {
  text: string;
  version: number;
}

// The only source of the page's law: platformSettings/pageLaw, edited in the admin site.
export const readPageLaw = async (): Promise<PageLaw | null> => {
  const snap = await getDoc(doc(db, 'platformSettings', 'pageLaw'));
  if (!snap.exists()) return null;
  const d: any = snap.data();
  return typeof d.text === 'string' && d.text.trim() && Number.isInteger(d.version) ? { text: d.text, version: d.version } : null;
};

export interface SlideExport {
  designerUid: string;
  designerName: string;
  name: string;
  category: string;
  draftSlot: string;
  // The slide itself and its elements, in the editor's own format.
  slide: any;
  elements: any[];
  lawVersion: number;
}

export const exportSlide = async (e: SlideExport): Promise<string> => {
  const id = `${e.designerUid.slice(0, 40)}_${Date.now().toString(36)}`;
  await setDoc(doc(db, 'gallerySlides', id), {
    designerUid: e.designerUid,
    designerName: e.designerName.slice(0, 60),
    name: e.name.trim().slice(0, 60),
    category: e.category,
    draftSlot: e.draftSlot,
    slide: e.slide,
    elements: e.elements,
    status: 'pending',
    lawVersion: e.lawVersion,
    acceptedAt: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
  return id;
};
