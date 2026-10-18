// Tells Weelink's search index (worker/index-site.ts) that a site was published, changed or unpublished,
// so «خدماتنا» finds it. Fire and forget: a failure here never holds up publishing; the daily job
// rebuilds the index anyway.
import { auth } from './firebase';
import type { ProjectKey } from '../utils/projectKeys';

export const refreshSearchIndex = async (owner: string, project: ProjectKey) => {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) return;
  try {
    await fetch('/api/index-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ owner, project }),
    });
  } catch {
    // the daily job catches up
  }
};
