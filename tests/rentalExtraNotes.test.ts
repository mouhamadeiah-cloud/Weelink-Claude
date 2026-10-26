import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NO_UNIT, extrasFor, normalizeExtras, normalizeUnit, quote, type RentalExtra } from '../src/services/rentalBooking.ts';
import { offeredTo, toggleUnit } from '../src/components/pageAdmin/RentalScheduleEditor.tsx';
import { buildRentalPaper } from '../src/components/rental/rentalContract.ts';

const unit = normalizeUnit({ byDay: true, dayPrice: 100, currency: '$' });

test('an extra keeps its description (cut at 200) and the visitor\'s price line carries it', () => {
  const [x] = normalizeExtras([{ id: 'e1', name: 'عشاء', price: 50, per: 'once', note: 'ن'.repeat(300) }]);
  assert.equal(x.note?.length, 200);
  const q = quote(unit, [{ ...x, note: 'عشاء لـ100 شخص' }], 'u1', { by: 'day', date: '2030-04-04', checkOut: '2030-04-05', extras: ['e1'] })!;
  assert.deepEqual(q.lines[1], { label: 'عشاء', amount: 50, note: 'عشاء لـ100 شخص' });
  assert.equal(q.total, 150);
  assert.equal('note' in q.lines[0], false);
});

test('ticking an extra for items: all, some, none', () => {
  const all = ['a', 'b', 'c'];
  const x: RentalExtra = { id: 'e1', name: 'توصيل', price: 5, per: 'once', units: [] };
  const off = toggleUnit(x, 'b', all);
  assert.deepEqual(off, ['a', 'c']);
  assert.deepEqual(toggleUnit({ ...x, units: off }, 'b', all), []);
  let some = { ...x, units: ['a'] };
  assert.deepEqual(toggleUnit(some, 'a', all), [NO_UNIT]);
  const none = { ...x, units: [NO_UNIT] };
  assert.equal(extrasFor([none], 'a').length, 0);
  assert.equal(offeredTo(none, 'a'), false);
  assert.deepEqual(toggleUnit(none, 'c', all), ['c']);
  assert.deepEqual(normalizeExtras([{ ...none }])[0].units, [NO_UNIT]);
});

test('the contract tells what each extra includes', () => {
  const booking: any = {
    id: 'abcdef123456', owner: 'o', project: 'rental', schedule: 'rental', pageName: 'صالة', date: '2030-04-04', startMin: 0, slot: 'يوم',
    meetingType: '', name: 'ليلى', phone: '0933123456', email: 'l@x.com', address: '', desc: '', status: 'confirmed', createdAt: '2030-04-01T10:00:00Z',
    rental: true, roomName: 'صالة الياسمين', checkOut: '2030-04-05', nights: 1,
    price: { lines: [{ label: 'يوم', amount: 100 }, { label: 'عشاء', amount: 50, note: 'لـ100 شخص <b>' }], total: 150, currency: '$' },
  };
  const html = buildRentalPaper(booking, 'contract');
  assert.match(html, /عشاء:<\/b> لـ100 شخص &lt;b&gt;/);
});
