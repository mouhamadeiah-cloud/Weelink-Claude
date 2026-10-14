// Vercel serverless function: votes on the designers' gallery slides (Eyad, 14 Oct).
//
//   POST /api/gallery  { action: 'vote', slideId, value: 1 | -1 | 0 }  with  Authorization: Bearer <ID token>
//        → one vote per account and slide: 1 = like, -1 = dislike, 0 = take the vote back; changing
//          it moves the counters. A designer cannot vote on their own slide, and the email of the
//          account must be confirmed.                         → { likes, dislikes, mine } | { error }
//
//   gallerySlides/{id}.likes / .dislikes   the counters, written here only (the rules deny the browser)
//   galleryVotes/{uid} = { votes: { [slideId]: 1 | -1 }, last }   the voter reads their own
// The counters are never taken from the browser: a designer cannot raise their own numbers.
// Needs FIREBASE_SERVICE_ACCOUNT (the same one the other functions use).

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const MIN_GAP_MS = 700;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const firebaseAdmin = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  let account: { private_key?: string };
  try {
    account = JSON.parse(raw);
  } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON; paste the whole service-account file.');
    return null;
  }
  if (!account.private_key) return null;
  const app = getApps()[0] || initializeApp({ credential: cert(account as object), projectId: firebaseConfig.projectId });
  const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
  return { auth: getAuth(app), db: databaseId ? getFirestore(app, databaseId) : getFirestore(app) };
};

const validId = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'method' }, 405);
    const admin = firebaseAdmin();
    if (!admin) return json({ error: 'not_configured' }, 503);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad_request' }, 400);
    }
    if (body.action !== 'vote') return json({ error: 'unknown_action' }, 400);

    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const user = token ? await admin.auth.verifyIdToken(token).catch(() => null) : null;
    if (!user) return json({ error: 'unauthorized' }, 401);
    if (!user.email_verified) return json({ error: 'unverified' }, 403);

    const slideId = body.slideId;
    const value = Number(body.value);
    if (!validId(slideId) || ![1, -1, 0].includes(value)) return json({ error: 'bad_request' }, 400);

    const { db } = admin;
    const slideRef = db.collection('gallerySlides').doc(slideId);
    const votesRef = db.collection('galleryVotes').doc(user.uid);
    try {
      const result = await db.runTransaction(async (t) => {
        const [slideSnap, votesSnap] = await Promise.all([t.get(slideRef), t.get(votesRef)]);
        const slide = slideSnap.data();
        if (!slide || slide.status !== 'approved') return { error: 'not_found' as const };
        if (slide.designerUid === user.uid) return { error: 'own' as const };
        const mine = votesSnap.data() as { votes?: Record<string, number>; last?: number } | undefined;
        if (Date.now() - (Number(mine?.last) || 0) < MIN_GAP_MS) return { error: 'too_fast' as const };
        const old = mine?.votes?.[slideId] === 1 ? 1 : mine?.votes?.[slideId] === -1 ? -1 : 0;
        let likes = Number(slide.likes) || 0;
        let dislikes = Number(slide.dislikes) || 0;
        if (old === value) return { likes, dislikes, mine: old };
        if (old === 1) likes--;
        if (old === -1) dislikes--;
        if (value === 1) likes++;
        if (value === -1) dislikes++;
        likes = Math.max(0, likes);
        dislikes = Math.max(0, dislikes);
        t.update(slideRef, { likes, dislikes });
        t.set(votesRef, { votes: { [slideId]: value === 0 ? FieldValue.delete() : value }, last: Date.now() }, { merge: true });
        return { likes, dislikes, mine: value };
      });
      if ('error' in result) return json({ error: result.error }, result.error === 'not_found' ? 404 : result.error === 'too_fast' ? 429 : 403);
      return json(result);
    } catch (e) {
      console.error('vote failed:', e);
      return json({ error: 'failed' }, 500);
    }
  },
};
