// Where an upload goes in Firebase Storage: under users/{uid}/ for whoever is signed in (a guest's
// anonymous sign-in too), so deleting a customer can delete their photos (server/billing.ts); the old
// shared folder only when nobody is signed in. storage.rules lets each account write its own folder.
import { auth } from '../services/firebase';

export const storagePath = (folder: 'images' | 'backgrounds' | 'gallery', file: string) => {
  const uid = auth.currentUser?.uid;
  return uid ? `users/${uid}/${folder}/${file}` : `${folder}/${file}`;
};
