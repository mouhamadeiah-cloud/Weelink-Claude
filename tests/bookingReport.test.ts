import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, kindOfBooking, weekdayOf } from '../src/services/bookingReport';

const b = (o: any) => ({ id: 'x', owner: 'o', project: 'page', pageName: '', date: '2026-10-05', startMin: 600, slot: '', meetingType: 'personal', name: 'n', phone: '', email: '', address: '', desc: '', status: 'confirmed', createdAt: '', ...o });

test('kinds follow the booking fields', () => {
  assert.equal(kindOfBooking(b({}) as any), 'appointment');
  assert.equal(kindOfBooking(b({ tableId: 't' }) as any), 'table');
  assert.equal(kindOfBooking(b({ roomId: 'r' }) as any), 'stay');
  assert.equal(kindOfBooking(b({ sessionId: 's' }) as any), 'seats');
});

test('the report counts the period only, cancellations and guests', () => {
  const rows = [
    b({ status: 'confirmed', tableId: 't', partySize: 4 }),
    b({ status: 'cancelled', tableId: 't', partySize: 2 }),
    b({ status: 'new', personName: 'سارة' }),
    b({ status: 'done', personName: 'سارة', date: '2026-10-06' }),
    b({ status: 'done', date: '2026-09-01' }),
  ];
  const r = buildReport(rows as any, [], '2026-10-01', '2026-10-31');
  assert.equal(r.total, 4);
  assert.deepEqual(r.byStatus, { new: 1, confirmed: 1, done: 1, cancelled: 1 });
  assert.equal(r.guests, 4);
  assert.equal(r.cancelRate, 1 / 3);
  assert.deepEqual(r.byPerson, [{ label: 'سارة', value: 2 }]);
});

test('deposits count by the day they were confirmed, per currency', () => {
  const d = (o: any) => ({ id: 'a', name: 'n', amount: 10, currency: '$', walletLabel: '', txn: '', bookingDate: '2026-11-01', date: '2026-10-10', state: 'received', ...o });
  const r = buildReport([], [d({}), d({ amount: 5, state: 'cancelled' }), d({ date: '2026-09-30' })] as any, '2026-10-01', '2026-10-31');
  assert.deepEqual(r.deposits, [{ currency: '$', received: 10, cancelled: 5 }]);
  assert.equal(r.depositLines.length, 2);
});

test('weekday names', () => assert.equal(weekdayOf('2026-10-25'), 'الأحد'));
