import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRentalPaper } from '../src/components/rental/rentalContract.ts';
import { DEFAULT_TERMS } from '../src/services/rentalBooking.ts';

const booking: any = {
  id: 'abcdef123456', owner: 'o', project: 'rental', schedule: 'rental', pageName: 'تأجير الشام', date: '2030-04-04', startMin: 0, slot: 'حتى 8 نيسان · 4 أيام',
  meetingType: '', name: 'ليلى <b>', phone: '0933123456', email: 'l@x.com', address: 'دمشق', desc: '', status: 'confirmed', createdAt: '2030-04-01T10:00:00Z',
  rental: true, roomName: 'كيا سيراتو 2020', checkOut: '2030-04-08', nights: 4, driver: true,
  price: { lines: [{ label: '4 أيام × 50', amount: 200 }, { label: 'السائق', amount: 80 }], total: 280, currency: '$' },
  deposit: { amount: 140, currency: '$', state: 'paid' },
};

test('the contract carries the booking, the price lines, the deposit and the terms accepted', () => {
  const html = buildRentalPaper({ ...booking, terms: '1. لا تأخير.\n2. الوقود كما استلم.', termsAt: '2030-04-01T10:00:00Z' }, 'contract');
  assert.match(html, /عقد إيجار/);
  assert.match(html, /كيا سيراتو 2020/);
  assert.match(html, /4 أيام × 50/);
  assert.match(html, /280 \$/);
  assert.match(html, /140 \$ · مستلم/);
  assert.match(html, /<li>لا تأخير\.<\/li>/);
  assert.match(html, /وافق المستأجر على هذه الشروط/);
  assert.match(html, /مع سائق/);
  assert.ok(!html.includes('ليلى <b>'), 'names are escaped');
});

test('a booking without saved terms uses the page terms, then the ready text', () => {
  assert.match(buildRentalPaper(booking, 'contract', '1. شرط الصفحة'), /شرط الصفحة/);
  assert.match(buildRentalPaper(booking, 'contract'), new RegExp(DEFAULT_TERMS.other.split('\n')[0].slice(3, 20)));
});

test('the handover record has the checks and the two blocks to fill by hand', () => {
  const html = buildRentalPaper(booking, 'handover');
  assert.match(html, /محضر تسليم واستلام/);
  assert.match(html, /عند التسليم/);
  assert.match(html, /عند الإعادة/);
  assert.equal((html.match(/class="sigs"/g) || []).length, 2);
  assert.ok(!html.includes('وافق المستأجر'));
});
