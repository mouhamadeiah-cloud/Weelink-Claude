// Puts a photo where the whole site reads it from (Eyad, 18 Oct: images on Cloudflare R2, data on
// Firebase): POST /api/upload-image, which returns a /img/<key> link. While R2 is not connected
// (503), offline from the API, or on a failure, the photo goes to Firebase Storage as before, so an
// upload never fails because of the move.
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../services/firebase';
import { storagePath } from './storagePaths';

export type PhotoFolder = 'images' | 'backgrounds' | 'gallery';

const toR2 = async (folder: PhotoFolder, name: string, blob: Blob): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user || !blob.type.startsWith('image/')) return null;
  try {
    const res = await fetch(`/api/upload-image?folder=${folder}&name=${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type, Authorization: `Bearer ${await user.getIdToken()}` },
      body: blob,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { url?: string };
    return typeof body.url === 'string' && body.url.startsWith('/img/') ? body.url : null;
  } catch {
    return null;
  }
};

/** The link of the stored photo: /img/… on R2, or a Firebase Storage link when R2 is not available. */
export const hostImageBlob = async (folder: PhotoFolder, name: string, blob: Blob): Promise<string> => {
  const hosted = await toR2(folder, name, blob);
  if (hosted) return hosted;
  const snapshot = await uploadBytes(ref(storage, storagePath(folder, `${Date.now()}_${name}`)), blob);
  return getDownloadURL(snapshot.ref);
};
