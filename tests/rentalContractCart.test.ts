import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRentalPaper } from '../src/components/rental/rentalContract.ts';
import type { Booking } from '../src/services/bookings.ts';

test('a cart booking lists every unit with its price in the contract', () => {
  const b = {
    id: 'abcdefgh1', owner: 'o', project: 'rental', pageName: 'P', date: '2026-11-01', startMin: 0, slot: '', meetingType: 'personal',
    name: 'N', phone: '1', email: 'e', address: '', desc: '', status: 'new', createdAt: '2026-10-26T00:00:00Z', rental: true,
    roomName: 'خيمة، سيارة', checkOut: '2026-11-03', nights: 2,
    price: { lines: [{ label: 'خيمة: يومان', amount: 100 }, { label: 'سيارة: يومان', amount: 200 }], total: 300, currency: 'USD' },
    items: [{ roomId: 'a', roomName: 'خيمة', total: 100 }, { roomId: 'b', roomName: 'سيارة', total: 200, driver: true }],
  } as unknown as Booking;
  const html = buildRentalPaper(b, 'contract');
  assert.match(html, /الوحدات المؤجّرة/);
  assert.match(html, /خيمة · 100 USD/);
  assert.match(html, /سيارة \(مع سائق\) · 200 USD/);
});
