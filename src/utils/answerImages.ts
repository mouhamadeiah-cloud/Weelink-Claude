import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { storagePath } from './storagePaths';
import { compressImageToTargetSize } from './imageCompressor';

// The owner's photos from the Wee AI questions (logo, gallery, hero background). A phone photo read
// as a data URL is several MB: kept like that it filled the browser storage and made every save of
// the answers and the built page too big for Firestore. So each one is shrunk on the way in and, for
// a signed-in owner, kept in Firebase Storage with only its link in the answers.

const LOGO_BYTES = 60 * 1024;
const PHOTO_BYTES = 150 * 1024;

const isInline = (url: string | undefined): url is string => !!url && url.startsWith('data:');

const toBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();

/** A picked file as a small data URL (≤60 KB for a logo, ≤150 KB for a photo). */
export async function shrinkPickedImage(file: File, kind: 'logo' | 'photo'): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('read')));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return shrinkDataUrl(raw, kind);
}

const shrinkDataUrl = async (dataUrl: string, kind: 'logo' | 'photo') => {
  const limit = kind === 'logo' ? LOGO_BYTES : PHOTO_BYTES;
  if (dataUrl.length * 0.75 <= limit) return dataUrl;
  try {
    return (await compressImageToTargetSize(dataUrl, limit)).url;
  } catch {
    return dataUrl;
  }
};

/** An inline image moved to Firebase Storage; its link, or the (shrunk) data URL when the upload fails. */
export async function hostImage(url: string, kind: 'logo' | 'photo'): Promise<string> {
  if (!isInline(url)) return url;
  const small = await shrinkDataUrl(url, kind);
  try {
    const fileRef = ref(storage, storagePath('images', `${Date.now()}_wee_${kind}_${Math.random().toString(36).slice(2, 8)}`));
    const snapshot = await uploadBytes(fileRef, await toBlob(small));
    return await getDownloadURL(snapshot.ref);
  } catch (e) {
    console.warn('Could not upload the Wee AI image, keeping it small in the page:', e);
    return small;
  }
}

type AnswerImages = {
  personalInfo?: { logoUrl?: string };
  aiAnswers?: { galleryImages?: string[]; heroBgImage?: string };
};

/** The answers with every inline photo uploaded; the same object when there was none. */
export async function hostAnswerImages<T extends AnswerImages>(answers: T): Promise<T> {
  const logo = answers.personalInfo?.logoUrl;
  const gallery = answers.aiAnswers?.galleryImages || [];
  const hero = answers.aiAnswers?.heroBgImage;
  if (!isInline(logo) && !isInline(hero) && !gallery.some(isInline)) return answers;
  const [logoUrl, heroBgImage, ...galleryImages] = await Promise.all([
    logo ? hostImage(logo, 'logo') : Promise.resolve(logo),
    hero ? hostImage(hero, 'photo') : Promise.resolve(hero),
    ...gallery.map((g) => hostImage(g, 'photo')),
  ]);
  return {
    ...answers,
    ...(answers.personalInfo ? { personalInfo: { ...answers.personalInfo, logoUrl } } : {}),
    ...(answers.aiAnswers ? { aiAnswers: { ...answers.aiAnswers, heroBgImage, galleryImages } } : {}),
  };
}

// Pages built before this held those photos full size. Any image over this many characters inside
// the pages or elements is moved to Storage (small ones, like QR codes and signatures, stay).
const LARGE_INLINE = 200_000;

/** Every large inline image anywhere inside a value (pages, elements). */
export function largeInlineImages(value: unknown, found = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    if (value.length > LARGE_INLINE && value.startsWith('data:image')) found.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => largeInlineImages(v, found));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => largeInlineImages(v, found));
  }
  return found;
}

/** The value with each string found in the map replaced by its new one. */
export function replaceImages<T>(value: T, links: Map<string, string>): T {
  if (typeof value === 'string') return (links.get(value) ?? value) as T;
  if (Array.isArray(value)) return value.map((v) => replaceImages(v, links)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceImages(v, links)])) as T;
  }
  return value;
}

/** The large inline images uploaded, old data URL → its link (or a shrunk copy when the upload fails). */
export async function hostLargeImages(images: Set<string>): Promise<Map<string, string>> {
  const entries = await Promise.all([...images].map(async (url) => [url, await hostImage(url, 'photo')] as const));
  return new Map(entries.filter(([from, to]) => to !== from));
}
