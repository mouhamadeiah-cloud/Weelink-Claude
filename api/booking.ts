// Server function: appointments booked from the «حجز مواعيد» calendar on a page.
//
//   POST /api/booking  { action: 'create', owner, project, date, startMin, slot, ... }
//        → a visitor books a free time; the booking is saved and both sides get an email
//                                                                   → { id, status } | { error }
//   POST /api/booking  { action: 'status', id, status }  with  Authorization: Bearer <ID token>
//        → the page's owner (or a member) confirms, finishes or cancels a booking; the customer
//          gets an email when it is confirmed or cancelled                    → { ok: true }
//   GET  /api/booking  with  Authorization: Bearer <CRON_SECRET>   (the daily cron)
//        → reminds both sides of tomorrow's bookings, and deletes bookings older than 3 months
//
// bookings/{owner}/items/{id} holds the booking (only the owner and members read it, firestore.rules).
// bookingDays/{owner}_{project}_{date} { owner, project, date, taken: [startMin] } holds the day's
// taken times of the page's first schedule; another schedule of the page («إعدادات الحجز») has its
// own, bookingDays/{owner}_{project}_{date}_{schedule}. Like before, it holds the day's
// taken times, so two visitors can't book the same time; anyone may read it, only this function
// writes it. The cron finds tomorrow's and the old bookings through it.
// Needs FIREBASE_SERVICE_ACCOUNT, EMAIL_FROM, RESEND_API_KEY, and CRON_SECRET for the cron.

import { cert, getApps, initializeApp, getAuth, FieldValue, getFirestore, type QuerySnapshot } from '../server/firebase.js';
import { Resend } from 'resend';
import { chooseRoom, nightsBetween, normalizeRooms, type RoomNights, type StayRoom } from '../src/services/stayBooking.js';
import { personWorks } from '../src/services/teamHours.js';
import { chooseTable, coveredSlots, tablesOfHalls, type BookableTable } from '../src/services/tableBooking.js';
import { restaurantIdOf } from '../src/utils/projectKeys.js';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

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
type Admin = NonNullable<ReturnType<typeof firebaseAdmin>>;

const validId = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '');
const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// A project key: the kind, or the kind and the project's own id (src/utils/projectKeys.ts).
// A schedule of the page's «إعدادات الحجز» (src/services/bookingSettings.ts); 'main' is the first.
const scheduleOf = (v: unknown) => (typeof v === 'string' && /^[a-z0-9]{1,20}$/.test(v) ? v : 'main');
const isProjectKey = (p: unknown): p is string => typeof p === 'string' && /^(page|shop|cars|restaurant)(-[a-z0-9]{4,12})?$/.test(p);
const MEETING: Record<string, string> = { personal: 'حضور شخصي بالمقر', phone: 'مكالمة هاتفية', whatsapp: 'اتصال فيديو واتساب' };
const STATUS: Record<string, string> = { new: 'بانتظار التأكيد', confirmed: 'مؤكد', done: 'منجز', cancelled: 'ملغى' };
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// Bookings are in the business's own time; Weelink's businesses are in Syria.
const TIME_ZONE = 'Asia/Damascus';
const dayIn = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};
const dateLabel = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAYS[weekday]} ${d} ${MONTHS[m - 1]} ${y}`;
};

// The page owner's email: their own Firebase user, or the user that claimed an old account.
const ownerEmail = async (admin: Admin, owner: string) => {
  const user = await admin.auth.getUser(owner).catch(() => null);
  if (user?.email) return user.email;
  const claimedBy = (await admin.db.collection('accounts').doc(owner).get()).data()?.owner;
  if (!validId(claimedBy)) return '';
  return (await admin.auth.getUser(claimedBy).catch(() => null))?.email || '';
};

const canManage = async (admin: Admin, owner: string, uid: string) => {
  if (uid === owner) return true;
  const account = await admin.db.collection('accounts').doc(owner).get();
  if (account.data()?.owner === uid) return true;
  return (await admin.db.collection('accounts').doc(owner).collection('members').doc(uid).get()).exists;
};

const sender = (from: string, name: string) => {
  const clean = name.replace(/[<>"\r\n]/g, '').slice(0, 60);
  return clean ? `${clean} <${(from.match(/<([^>]+)>/)?.[1] || from).trim()}>` : from;
};

const row = (label: string, value: unknown) =>
  value ? `<tr><td style="padding:6px 0;color:#888;width:110px">${esc(label)}</td><td style="padding:6px 0;font-weight:700">${esc(value)}</td></tr>` : '';

const mailHtml = (title: string, lead: string, b: any, extra = '') => `<!doctype html>
<html lang="ar" dir="rtl"><body style="font-family:system-ui,sans-serif;background:#f5f5f7;margin:0;padding:24px">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:16px;padding:28px">
    <h1 style="font-size:20px;margin:0 0 6px">${esc(title)}</h1>
    <p style="color:#555;margin:0 0 18px;line-height:1.7">${lead}</p>
    <div style="background:#f5f5f7;border-radius:12px;padding:14px 16px;margin:0 0 14px">
      <div style="font-size:18px;font-weight:800;color:#0071e3">${esc(dateLabel(b.date))}</div>
      <div style="font-size:15px;font-weight:700;margin-top:4px">${esc(b.slot)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row('الحالة', STATUS[b.status])}
      ${row('طريقة اللقاء', MEETING[b.meetingType])}
      ${row('عدد الأشخاص', b.partySize)}
      ${row('الغرفة', b.roomName)}
      ${row('المغادرة', b.checkOut ? dateLabel(b.checkOut) : '')}
      ${row('الطاولة', b.tableName ? `${b.tableName}${b.hallName ? ` · ${b.hallName}` : ''}` : '')}
      ${extra}
    </table>
    <p style="color:#999;font-size:12px;margin:18px 0 0">رسالة من Weelink بخصوص موعد على ${esc(b.pageName || 'صفحة على Weelink')}.</p>
  </div>
</body></html>`;

const customerRows = (b: any) =>
  row('الاسم', b.name) + row('الهاتف', b.phone) + row('الإيميل', b.email) + row('العنوان', b.address) + row('التفاصيل', b.desc);

type Mail = { to: string; subject: string; html: string; fromName: string };
const sendAll = async (mails: Mail[]) => {
  const from = process.env.EMAIL_FROM;
  const key = process.env.RESEND_API_KEY;
  if (!from || !key) return;
  const resend = new Resend(key);
  await Promise.all(
    mails
      .filter((m) => m.to)
      .map((m) =>
        resend.emails
          .send({ from: sender(from, m.fromName), to: m.to, subject: m.subject, html: m.html })
          .then(({ error }) => error && console.error('Resend refused a booking email:', error.message))
          .catch((e) => console.error('A booking email failed:', e?.message))
      )
  );
};

// A team person (a specialist of the schedule) has their own day: ..._p{personId}.
const dayDoc = (admin: Admin, b: { owner: string; project: string; date: string; schedule?: string; person?: string }) =>
  admin.db.collection('bookingDays').doc(`${b.owner}_${b.project}_${b.date}${scheduleOf(b.schedule) === 'main' ? '' : `_${b.schedule}`}${b.person ? `_p${b.person}` : ''}`);
const roomDoc = (admin: Admin, b: { owner: string; project: string; schedule?: string }, roomId: string) =>
  admin.db.collection('bookingRooms').doc(`${b.owner}_${b.project}_${scheduleOf(b.schedule)}_${roomId}`);
const items = (admin: Admin, owner: string) => admin.db.collection('bookings').doc(owner).collection('items');
// The bookings of the days a bookingDays query found.
const bookingsOf = async (admin: Admin, days: QuerySnapshot) => {
  const lists = await Promise.all(
    days.docs.map((d) => {
      const { owner, project, date } = d.data();
      return validId(owner) ? items(admin, owner).where('date', '==', date).where('project', '==', project).get() : null;
    })
  );
  // Two schedules of a page have a day each, and both find the page's bookings of that date.
  const seen = new Set<string>();
  return lists.flatMap((l) => l?.docs || []).filter((d) => !seen.has(d.ref.path) && !!seen.add(d.ref.path));
};

// The team person's own mail for a booking made with them (not twice when they are the owner).
const personMails = (b: any, ownerMail: string, subject: string, title: string, lead: string): Mail[] =>
  b.personEmail && b.personEmail !== ownerMail ? [{ to: b.personEmail, fromName: 'Weelink', subject, html: mailHtml(title, lead, b, customerRows(b)) }] : [];

const create = async (admin: Admin, body: any) => {
  const owner = body.owner;
  const project = body.project;
  const date = body.date;
  const startMin = Number(body.startMin);
  if (!validId(owner) || !isProjectKey(project) || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'bad_request' }, 400);
  if (!Number.isInteger(startMin) || startMin < 0 || startMin > 1439) return json({ error: 'bad_request' }, 400);
  // From yesterday (a visitor ahead of Damascus' clock) up to a year ahead.
  if (date < dayIn(-1) || date > dayIn(366)) return json({ error: 'bad_date' }, 400);

  const booking = {
    owner,
    project,
    schedule: scheduleOf(body.schedule),
    pageName: text(body.pageName, 80),
    date,
    startMin,
    slot: text(body.slot, 40),
    meetingType: MEETING[body.meetingType] ? body.meetingType : 'phone',
    name: text(body.name, 80),
    phone: text(body.phone, 30),
    email: text(body.email, 120).toLowerCase(),
    address: text(body.address, 160),
    desc: text(body.desc, 600),
    status: body.needsConfirmation === false ? 'confirmed' : 'new',
    reminded: false,
    createdAt: new Date().toISOString(),
  };
  if (!booking.slot || booking.name.length < 2 || booking.phone.replace(/\D/g, '').length < 6) return json({ error: 'missing_fields' }, 400);
  if (booking.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) return json({ error: 'bad_email' }, 400);

  // A booking with a team person: they must take bookings; they get the emails of their bookings too.
  if (body.person) {
    const personId = validId(body.person) ? body.person : '';
    const person = personId ? (await admin.db.collection('team').doc(owner).collection('people').doc(personId).get()).data() : null;
    if (!person || person.takesBookings !== true) return json({ error: 'bad_person' }, 400);
    if (!personWorks(person as any, body.date, Number(body.startMin))) return json({ error: 'taken' }, 409);
    (booking as any).person = personId;
    (booking as any).personName = text(person.name, 80);
    (booking as any).personEmail = text(person.email, 120).toLowerCase();
  }

  // A table booking (restaurants): the party, the schedule's length and the restaurant's tables decide it.
  let tables: BookableTable[] = [];
  let tableRule: { party: number; duration: number; step: number } | null = null;
  if (body.partySize !== undefined && body.checkOut === undefined) {
    const party = Math.round(Number(body.partySize));
    const saved = (await admin.db.collection('bookingSettings').doc(owner).collection('pages').doc(project).get()).data();
    // A restaurant that never saved its table settings books with the defaults of the «table» schedule.
    const schedule = (Array.isArray(saved?.schedules) ? saved.schedules : []).find((s: any) => s?.id === booking.schedule) || (booking.schedule === 'table' ? { type: 'table', interval: '30' } : null);
    if (!schedule || schedule.type !== 'table') return json({ error: 'bad_schedule' }, 400);
    if (!Number.isInteger(party) || party < 1 || party > Math.min(50, Number(schedule.partyMax) || 8)) return json({ error: 'bad_party' }, 400);
    const restaurant = (await admin.db.collection('restaurants').doc(restaurantIdOf(owner, project)).get()).data();
    tables = tablesOfHalls(restaurant?.menu?.halls);
    if (tables.length === 0) return json({ error: 'no_tables' }, 409);
    tableRule = {
      party,
      duration: Math.min(480, Math.max(15, Math.round(Number(schedule.durationMinutes)) || 90)),
      step: 0, // a table's start times follow its length
    };
    tableRule.step = tableRule.duration;
    (booking as any).partySize = party;
    (booking as any).durationMin = tableRule.duration;
    (booking as any).meetingType = '';
  }

  // A room stay (hotels): check-in is `date`, the guests and the nights decide which of the rooms is free.
  let stayRooms: StayRoom[] = [];
  let stayRule: { guests: number; nights: string[] } | null = null;
  if (body.checkOut !== undefined) {
    const saved = (await admin.db.collection('bookingSettings').doc(owner).collection('pages').doc(project).get()).data();
    const schedule = (Array.isArray(saved?.schedules) ? saved.schedules : []).find((s: any) => s?.id === booking.schedule);
    if (!schedule || schedule.type !== 'stay') return json({ error: 'bad_schedule' }, 400);
    stayRooms = normalizeRooms(schedule.rooms);
    if (stayRooms.length === 0) return json({ error: 'no_rooms' }, 409);
    const nights = nightsBetween(date, body.checkOut);
    const minNights = Math.max(1, Math.round(Number(schedule.minNights)) || 1);
    const maxNights = Math.min(90, Math.max(minNights, Math.round(Number(schedule.maxNights)) || 30));
    if (nights.length < minNights || nights.length > maxNights) return json({ error: 'bad_nights' }, 400);
    if (date > dayIn(Math.min(365, Math.max(1, Math.round(Number(schedule.daysAhead)) || 180)))) return json({ error: 'bad_date' }, 400);
    const guests = Math.round(Number(body.partySize));
    if (!Number.isInteger(guests) || guests < 1 || guests > Math.max(...stayRooms.map((r) => r.capacity))) return json({ error: 'bad_party' }, 400);
    stayRule = { guests, nights };
    Object.assign(booking, {
      startMin: 0,
      meetingType: '',
      partySize: guests,
      checkOut: body.checkOut,
      nights: nights.length,
      slot: `حتى ${dateLabel(body.checkOut)} · ${nights.length} ${nights.length === 1 ? 'ليلة' : 'ليالٍ'}`,
    });
  }

  const toOwner = await ownerEmail(admin, owner);
  if (!toOwner) {
    // A missing owner is 404; anything else (Google refusing the service account, say) is 500 with its reason.
    const found = await admin.auth.getUser(owner).then(
      () => true,
      (e: any) => (e?.code === 'auth/user-not-found' ? false : String(e?.message || e?.code || 'unknown').slice(0, 60)),
    );
    if (found === false) return json({ error: 'not_found' }, 404);
    if (found !== true) return json({ error: 'error', reason: found }, 500);
  }

  const ref = items(admin, owner).doc();
  const day = dayDoc(admin, booking);
  let failure = '';
  const result = await admin.db
    .runTransaction(async (tx) => {
      if (stayRule) {
        // The smallest free room that fits the guests (or the wished one) for every night of the stay.
        const candidates = stayRooms.filter((r) => r.capacity >= stayRule!.guests && (!validId(body.room) || r.id === body.room));
        const refs = candidates.map((r) => roomDoc(admin, booking, r.id));
        const docs = await Promise.all(refs.map((r) => tx.get(r)));
        const occupancy: RoomNights = Object.fromEntries(candidates.map((r, i) => [r.id, docs[i].data()?.nights || []]));
        const room = chooseRoom(candidates, occupancy, { guests: stayRule.guests, nights: stayRule.nights, roomId: validId(body.room) ? body.room : undefined });
        if (!room) return 'taken';
        const at = candidates.findIndex((r) => r.id === room.id);
        const keep = (occupancy[room.id] as string[]).filter((n) => n >= dayIn(-1));
        tx.set(refs[at], { owner, project, schedule: booking.schedule, nights: [...keep, ...stayRule.nights] });
        // A bookingDays document too, so the day-before reminder finds the check-in.
        tx.set(day, { owner, project, date }, { merge: true });
        tx.set(ref, { ...booking, roomId: room.id, roomName: room.name });
        Object.assign(booking, { roomId: room.id, roomName: room.name });
        return 'ok';
      }
      if (tableRule) {
        // The smallest free table that seats the party (inside the wished hall or table), decided here
        // so two parties never get the same table at overlapping times.
        const occupancy: Record<string, number[]> = (await tx.get(day)).data()?.tables || {};
        const table = chooseTable(tables, occupancy, {
          party: tableRule.party, start: startMin, duration: tableRule.duration, step: tableRule.step,
          hallId: validId(body.hall) ? body.hall : undefined, tableId: validId(body.tableId) ? body.tableId : undefined,
        });
        if (!table) return 'taken';
        const covers = coveredSlots(startMin, tableRule.duration, tableRule.step);
        tx.set(day, { owner, project, date, tables: { ...occupancy, [table.id]: [...(occupancy[table.id] || []), ...covers] } }, { merge: true });
        tx.set(ref, { ...booking, tableId: table.id, tableName: table.name, hallName: table.hallName, covers });
        Object.assign(booking, { tableId: table.id, tableName: table.name, hallName: table.hallName });
        return 'ok';
      }
      const taken: number[] = (await tx.get(day)).data()?.taken || [];
      if (taken.includes(startMin)) return 'taken';
      if (taken.length >= 300) return 'full';
      tx.set(day, { owner, project, date, taken: FieldValue.arrayUnion(startMin) }, { merge: true });
      tx.set(ref, booking);
      return 'ok';
    })
    .catch((e: any) => {
      console.error('Saving a booking failed:', e?.message);
      failure = String(e?.message || e?.code || 'unknown').slice(0, 60);
      return 'error';
    });
  if (result === 'taken') return json({ error: 'taken' }, 409);
  if (result !== 'ok') return json({ error: result, ...(failure ? { reason: failure } : {}) }, result === 'full' ? 409 : 500);

  const pageName = booking.pageName || 'صفحتك على Weelink';
  await sendAll([
    {
      to: booking.email,
      fromName: booking.pageName,
      subject: `${booking.status === 'new' ? 'وصل طلب موعدك' : 'تم تأكيد موعدك'} · ${dateLabel(date)}`,
      html: mailHtml(
        booking.status === 'new' ? 'وصل طلب موعدك' : 'تم تأكيد موعدك',
        booking.status === 'new'
          ? `شكراً ${esc(booking.name)}، وصل طلبك إلى ${esc(pageName)}. رح يوصلك إيميل لما يتأكد الموعد، وتذكير قبله بيوم.`
          : `شكراً ${esc(booking.name)}، موعدك مع ${esc(pageName)} محجوز. رح يوصلك تذكير قبله بيوم.`,
        booking
      ),
    },
    ...personMails(booking as any, toOwner, `موعد جديد معك: ${booking.name} · ${dateLabel(date)} ${booking.slot}`, 'موعد جديد معك', `حجز ${esc(booking.name)} موعداً معك على ${esc(pageName)}.`),
    {
      to: toOwner,
      fromName: 'Weelink',
      subject: `موعد جديد: ${booking.name} · ${dateLabel(date)} ${booking.slot}`,
      html: mailHtml(
        'موعد جديد على صفحتك',
        booking.status === 'new'
          ? `حجز ${esc(booking.name)} موعداً على ${esc(pageName)}. افتح «الإدارة» على صفحتك لتأكيده أو إلغائه.`
          : `حجز ${esc(booking.name)} موعداً على ${esc(pageName)}. الموعد مؤكد تلقائياً.`,
        booking,
        customerRows(booking)
      ),
    },
  ]);
  return json({ id: ref.id, status: booking.status, ...((booking as any).tableName ? { tableName: (booking as any).tableName, hallName: (booking as any).hallName } : {}), ...((booking as any).roomName ? { roomName: (booking as any).roomName } : {}) });
};

const changeStatus = async (admin: Admin, request: Request, body: any) => {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const user = token ? await admin.auth.verifyIdToken(token).catch(() => null) : null;
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!validId(body.owner) || !validId(body.id) || !['confirmed', 'done', 'cancelled'].includes(body.status)) return json({ error: 'bad_request' }, 400);
  if (!(await canManage(admin, body.owner, user.uid))) return json({ error: 'not_found' }, 404);

  const ref = items(admin, body.owner).doc(body.id);
  const snap = await ref.get();
  const b: any = snap.data();
  if (!snap.exists) return json({ error: 'not_found' }, 404);
  if (b.status === body.status) return json({ ok: true });

  await ref.update({ status: body.status, updatedAt: new Date().toISOString() });
  // A cancelled time is free again.
  if (body.status === 'cancelled') {
    if (b.roomId && b.checkOut) {
      const room = roomDoc(admin, b, b.roomId);
      const gone = nightsBetween(b.date, b.checkOut);
      await admin.db.runTransaction(async (tx) => {
        const nights: string[] = (await tx.get(room)).data()?.nights || [];
        tx.set(room, { nights: nights.filter((n) => !gone.includes(n)) }, { merge: true });
      }).catch(() => {});
    } else if (b.tableId && Array.isArray(b.covers)) {
      const day = dayDoc(admin, b);
      await admin.db.runTransaction(async (tx) => {
        const tables: Record<string, number[]> = (await tx.get(day)).data()?.tables || {};
        if (tables[b.tableId]) tx.set(day, { tables: { ...tables, [b.tableId]: tables[b.tableId].filter((n) => !b.covers.includes(n)) } }, { merge: true });
      }).catch(() => {});
    } else await dayDoc(admin, b).update({ taken: FieldValue.arrayRemove(b.startMin) }).catch(() => {});
  }

  const updated = { ...b, status: body.status };
  const pageName = b.pageName || 'صفحة على Weelink';
  if (body.status === 'confirmed' || body.status === 'cancelled') {
    await sendAll([
      {
        to: b.email,
        fromName: b.pageName,
        subject: `${body.status === 'confirmed' ? 'تم تأكيد موعدك' : 'تم إلغاء موعدك'} · ${dateLabel(b.date)}`,
        html: mailHtml(
          body.status === 'confirmed' ? 'تم تأكيد موعدك' : 'تم إلغاء موعدك',
          body.status === 'confirmed'
            ? `أهلاً ${esc(b.name)}، أكّد ${esc(pageName)} موعدك. رح يوصلك تذكير قبله بيوم.`
            : `أهلاً ${esc(b.name)}، ألغى ${esc(pageName)} هذا الموعد. فيك تحجز موعداً غيره من الصفحة.`,
          updated
        ),
      },
    ]);
  }
  return json({ ok: true });
};

// The daily cron: tomorrow's reminders, then the cleanup of bookings older than 3 months.
const daily = async (admin: Admin) => {
  const due = await bookingsOf(admin, await admin.db.collection('bookingDays').where('date', '==', dayIn(1)).get());
  let reminded = 0;
  for (const d of due) {
    const b: any = d.data();
    if (b.reminded || (b.status !== 'new' && b.status !== 'confirmed')) continue;
    const pageName = b.pageName || 'صفحة على Weelink';
    await sendAll([
      {
        to: b.email,
        fromName: b.pageName,
        subject: `تذكير: موعدك بكرا ${b.slot}`,
        html: mailHtml('تذكير بموعدك بكرا', `أهلاً ${esc(b.name)}، هذا تذكير بموعدك مع ${esc(pageName)}.`, b),
      },
      {
        to: await ownerEmail(admin, b.owner),
        fromName: 'Weelink',
        subject: `تذكير: موعد بكرا مع ${b.name} ${b.slot}`,
        html: mailHtml(
          'عندك موعد بكرا',
          `تذكير بموعد ${esc(b.name)} على ${esc(pageName)}.${b.status === 'new' ? ' الموعد لسا ما تأكد، فيك تأكده من «الإدارة».' : ''}`,
          b,
          customerRows(b)
        ),
      },
    ]);
    await sendAll(personMails(b, await ownerEmail(admin, b.owner), `تذكير: موعد بكرا مع ${b.name} ${b.slot}`, 'عندك موعد بكرا', `تذكير بموعد ${esc(b.name)} معك على ${esc(pageName)}.`));
    await d.ref.update({ reminded: true });
    reminded++;
  }

  // Kept 3 months, then deleted with their day.
  const oldDays = await admin.db.collection('bookingDays').where('date', '<', dayIn(-92)).limit(100).get();
  const old = await bookingsOf(admin, oldDays);
  const refs = [...old.map((d) => d.ref), ...oldDays.docs.map((d) => d.ref)];
  for (let i = 0; i < refs.length; i += 400) {
    const batch = admin.db.batch();
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
  return json({ reminded, deleted: old.length });
};

export default {
  async fetch(request: Request): Promise<Response> {
    const admin = firebaseAdmin();
    if (!admin) return json({ error: 'not_configured' }, 503);

    if (request.method === 'GET') {
      const secret = process.env.CRON_SECRET;
      if (!secret) return json({ error: 'not_configured' }, 503);
      if (request.headers.get('authorization') !== `Bearer ${secret}`) return json({ error: 'unauthorized' }, 401);
      return daily(admin);
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const body = (await request.json().catch(() => ({}))) as any;
    if (body?.action === 'create') return create(admin, body);
    if (body?.action === 'status') return changeStatus(admin, request, body);
    return json({ error: 'bad_request' }, 400);
  },
};
