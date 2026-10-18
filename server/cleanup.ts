// Cleaning Firebase and R2 by itself (Eyad, 18 Oct). Orphans are what an account left behind after its sign-in
// is gone for good: its folder of photos (users/{uid}/ in Firebase Storage and in R2) and its Firestore records
// (design, directory, published pages, paid periods). Nothing else is ever deleted here:
//   scan  → only counts; the daily job does this and keeps the last report in platform_cleanup/last
//   apply → also wipes the orphans (admin «احذف اليتيم», owner only)
// Photos from before each account had its own folder sit in shared Storage folders; those cannot be matched to an
// owner, so they are only counted in the report («صور قديمة مشتركة»), never deleted.
import { getStorage } from './firebase.js';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import { imagesBucket } from './images.js';
import { wipeAccount } from './billing.js';

type Db = any;
type Auth = any;

export interface CleanupReport {
  at: number;
  applied: boolean;
  orphanAccounts: number;
  orphanFiles: number;
  orphanBytes: number;
  orphanR2Files: number;
  orphanDocs: number;
  legacyFiles: number;
  legacyBytes: number;
  wiped: number;
  partial: boolean;
}

const MAX_ACCOUNTS = 300;

// The uid of users/{uid}/…
const uidOf = (key: string) => /^users\/([^/]+)\//.exec(key)?.[1] || '';

export const runCleanup = async (db: Db, auth: Auth, apply: boolean, now = Date.now()): Promise<CleanupReport> => {
  const bucket = getStorage().bucket(firebaseConfig.storageBucket);
  const r2 = imagesBucket();
  let partial = false;

  // Every account that has photos or records.
  const fileBytes = new Map<string, { files: number; bytes: number }>();
  const stored = await bucket.listFiles({ prefix: '' });
  partial ||= stored.truncated;
  let legacyFiles = 0;
  let legacyBytes = 0;
  for (const f of stored.files) {
    const uid = uidOf(f.name);
    if (!uid) {
      legacyFiles++;
      legacyBytes += f.size;
      continue;
    }
    const c = fileBytes.get(uid) || { files: 0, bytes: 0 };
    c.files++;
    c.bytes += f.size;
    fileBytes.set(uid, c);
  }
  const r2Files = new Map<string, number>();
  if (r2) {
    let cursor: string | undefined;
    let seen = 0;
    do {
      const page = await r2.list({ prefix: 'users/', cursor, limit: 1000 });
      for (const o of page.objects) r2Files.set(uidOf(o.key), (r2Files.get(uidOf(o.key)) || 0) + 1);
      seen += page.objects.length;
      cursor = page.truncated && seen < 20000 ? page.cursor : undefined;
      partial ||= !!page.truncated && !cursor;
    } while (cursor);
  }
  const candidates = new Set<string>([...fileBytes.keys(), ...r2Files.keys()].filter(Boolean));
  for (const col of ['designs', 'platform_directory']) {
    for (const d of (await db.collection(col).limit(2000).get()).docs) candidates.add(d.id);
  }
  for (const col of ['publishedSites', 'projectAccess']) {
    for (const d of (await db.collection(col).limit(2000).get()).docs) {
      const owner = String(d.data().owner || '');
      if (owner) candidates.add(owner);
    }
  }

  // Which of them still have a sign-in.
  const ids = [...candidates];
  const orphans: string[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { notFound } = await auth.getUsers(ids.slice(i, i + 100).map((uid) => ({ uid })));
    orphans.push(...notFound.map((x: { uid: string }) => x.uid));
  }

  const report: CleanupReport = {
    at: now, applied: apply, orphanAccounts: orphans.length,
    orphanFiles: orphans.reduce((n, u) => n + (fileBytes.get(u)?.files || 0), 0),
    orphanBytes: orphans.reduce((n, u) => n + (fileBytes.get(u)?.bytes || 0), 0),
    orphanR2Files: orphans.reduce((n, u) => n + (r2Files.get(u) || 0), 0),
    orphanDocs: 0, legacyFiles, legacyBytes, wiped: 0, partial,
  };
  for (const uid of orphans) {
    const designs = await db.collection('designs').doc(uid).get();
    const dir = await db.collection('platform_directory').doc(uid).get();
    const sites = await db.collection('publishedSites').where('owner', '==', uid).limit(100).get();
    report.orphanDocs += (designs.exists ? 1 : 0) + (dir.exists ? 1 : 0) + sites.docs.length;
  }

  if (apply) {
    for (const uid of orphans.slice(0, MAX_ACCOUNTS)) {
      await wipeAccount(db, uid);
      report.wiped++;
    }
    report.partial ||= orphans.length > MAX_ACCOUNTS;
  }
  await db.collection('platform_cleanup').doc('last').set(report);
  return report;
};
