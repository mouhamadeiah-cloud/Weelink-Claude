// The worker's own page (served through /api/booking, whose actions are prefixed «worker-»: Vercel's free plan
// allows only 12 functions, so this is no function of its own) (Eyad, 25 Oct). A team person with a secret 6-digit code opens the
// worker link and sees only their own bookings (read-only), and marks one «تم» when it is done.
//
//   POST /api/booking  { action: 'worker-set-pin', owner, person, pin }  with  Authorization: Bearer <ID token>
//        → the owner (or a member) gives a person their code            → { ok: true } | { error: 'pin_used' }
//   POST /api/booking  { action: 'worker-pins', owner }  with  Authorization: Bearer <ID token>
//        → which people have a code                                     → { ids: [personId] }
//   POST /api/booking  { action: 'worker-view', owner, pin }
//        → the person's name and colour and their coming bookings (no phone or email)
//   POST /api/booking  { action: 'worker-done', owner, pin, id }
//        → marks one of that person's bookings (today or earlier) as done
//
// workerPins/{owner}/people/{person} { salt, hash } is closed to browsers (firestore.rules' default deny); the
// code is stored hashed. Ten wrong codes in 15 minutes lock the page for that owner (workerPins/{owner}).
// Needs FIREBASE_SERVICE_ACCOUNT.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { colorOf } from '../src/services/bookingGrid.js';
import { cleanRota, shiftsOn } from '../src/services/teamHours.js';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

// The admin SDK handle api/booking.ts built (auth + db).
type Admin = { auth: { verifyIdToken(t: string): Promise<{ uid: string }> }; db: any };

const validId = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
const validPin = (v: unknown): v is string => typeof v === 'string' && /^\d{6}$/.test(v);

const hashPin = (pin: string, salt: string) => scryptSync(pin, salt, 32).toString('hex');
const samePin = (pin: string, p: { salt?: string; hash?: string }) => {
  if (!p.salt || !p.hash) return false;
  const a = Buffer.from(hashPin(pin, p.salt), 'hex');
  const b = Buffer.from(p.hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
};

const TIME_ZONE = 'Asia/Damascus';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const LOCK_AFTER = 10;
const LOCK_MS = 15 * 60000;

const canManage = async (admin: Admin, owner: string, uid: string) => {
  if (uid === owner) return true;
  const account = await admin.db.collection('accounts').doc(owner).get();
  if (account.data()?.owner === uid) return true;
  return (await admin.db.collection('accounts').doc(owner).collection('members').doc(uid).get()).exists;
};

const managerOf = async (admin: Admin, request: Request, owner: unknown) => {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const user = token ? await admin.auth.verifyIdToken(token).catch(() => null) : null;
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!validId(owner) || !(await canManage(admin, owner, user.uid))) return json({ error: 'not_found' }, 404);
  return null;
};

type Pin = { id: string; salt?: string; hash?: string };
const pinsOf = async (admin: Admin, owner: string): Promise<Pin[]> =>
  (await admin.db.collection('workerPins').doc(owner).collection('people').get()).docs.map((d: any) => ({ id: d.id as string, ...(d.data() as { salt?: string; hash?: string }) }));

// The person a code belongs to; counts a wrong code toward the lock.
const whoIs = async (admin: Admin, owner: string, pin: string): Promise<{ id: string } | 'locked' | null> => {
  const meta = admin.db.collection('workerPins').doc(owner);
  const state = (await meta.get()).data() || {};
  const now = Date.now();
  const fresh = typeof state.since === 'number' && now - state.since < LOCK_MS;
  const fails = fresh ? Number(state.fails) || 0 : 0;
  if (fails >= LOCK_AFTER) return 'locked';
  const found = (await pinsOf(admin, owner)).find((p) => samePin(pin, p));
  if (found) return { id: found.id };
  await meta.set({ fails: fails + 1, since: fresh ? state.since : now }, { merge: true });
  return null;
};

const setPin = async (admin: Admin, request: Request, body: any) => {
  const denied = await managerOf(admin, request, body.owner);
  if (denied) return denied;
  if (!validId(body.person) || !validPin(body.pin)) return json({ error: 'bad_request' }, 400);
  const person = await admin.db.collection('team').doc(body.owner).collection('people').doc(body.person).get();
  if (!person.exists) return json({ error: 'not_found' }, 404);
  const others = (await pinsOf(admin, body.owner)).filter((p) => p.id !== body.person);
  if (others.some((p) => samePin(body.pin, p))) return json({ error: 'pin_used' }, 409);
  const salt = randomBytes(12).toString('hex');
  await admin.db.collection('workerPins').doc(body.owner).collection('people').doc(body.person).set({ salt, hash: hashPin(body.pin, salt) });
  return json({ ok: true });
};

const pins = async (admin: Admin, request: Request, body: any) => {
  const denied = await managerOf(admin, request, body.owner);
  if (denied) return denied;
  return json({ ids: (await pinsOf(admin, body.owner)).map((p) => p.id) });
};

const items = (admin: Admin, owner: string) => admin.db.collection('bookings').doc(owner).collection('items');

const view = async (admin: Admin, body: any) => {
  if (!validId(body.owner) || !validPin(body.pin)) return json({ error: 'bad_request' }, 400);
  const who = await whoIs(admin, body.owner, body.pin);
  if (who === 'locked') return json({ error: 'locked' }, 429);
  if (!who) return json({ error: 'wrong_pin' }, 403);

  const people = (await admin.db.collection('team').doc(body.owner).collection('people').get()).docs
    .map((d: any) => ({ id: d.id as string, ...d.data() }))
    .sort((a: any, b: any) => String(a.at || '').localeCompare(String(b.at || '')));
  const me: any = people.find((p: any) => p.id === who.id);
  if (!me) return json({ error: 'wrong_pin' }, 403);
  const index = Math.max(0, people.filter((p: any) => p.takesBookings).findIndex((p: any) => p.id === who.id));

  const from = today();
  const rows = (await items(admin, body.owner).where('person', '==', who.id).get()).docs
    .map((d: any) => ({ id: d.id as string, ...d.data() }))
    .filter((b: any) => b.date >= from && b.status !== 'cancelled')
    .sort((a: any, b: any) => a.date.localeCompare(b.date) || a.startMin - b.startMin)
    .slice(0, 200)
    .map((b: any) => ({ id: b.id, date: b.date, startMin: b.startMin, slot: b.slot, name: b.name, desc: b.desc || '', status: b.status, pageName: b.pageName || '' }));
  // The next two weeks of the person's shift rota, when they have one.
  const rota = cleanRota(me.rota);
  const [y, m, d] = from.split('-').map(Number);
  const shifts = rota
    ? Array.from({ length: 14 }, (_, i) => {
        const date = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10);
        return { date, shifts: shiftsOn(rota, date) };
      })
    : [];
  return json({ person: { id: me.id, name: me.name || '', role: me.role || '', color: colorOf(index) }, today: from, bookings: rows, shifts });
};

const done = async (admin: Admin, body: any) => {
  if (!validId(body.owner) || !validPin(body.pin) || !validId(body.id)) return json({ error: 'bad_request' }, 400);
  const who = await whoIs(admin, body.owner, body.pin);
  if (who === 'locked') return json({ error: 'locked' }, 429);
  if (!who) return json({ error: 'wrong_pin' }, 403);
  const ref = items(admin, body.owner).doc(body.id);
  const b: any = (await ref.get()).data();
  if (!b || b.person !== who.id) return json({ error: 'not_found' }, 404);
  if (b.date > today()) return json({ error: 'too_early' }, 409);
  if (b.status === 'new' || b.status === 'confirmed') await ref.update({ status: 'done', updatedAt: new Date().toISOString() });
  return json({ ok: true });
};

// `body.action` is 'set-pin' | 'pins' | 'view' | 'done' (api/booking.ts strips the «worker-» prefix).
export const workerAction = async (admin: Admin, request: Request, body: any): Promise<Response> => {
  if (body?.action === 'set-pin') return setPin(admin, request, body);
  if (body?.action === 'pins') return pins(admin, request, body);
  if (body?.action === 'view') return view(admin, body);
  if (body?.action === 'done') return done(admin, body);
  return json({ error: 'bad_request' }, 400);
};
