import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardPayable, cardState, cleanCardNumber, expiryFrom, expiryPreset, formatCardNumber, isCardNumber, newCardNumber, normalizeCard, normalizeGiftSettings, DEFAULT_GIFT_SETTINGS } from '../src/components/restaurant/giftCardLogic.ts';
import { tabTotals, normalizeTab } from '../src/components/restaurant/staffTypes.ts';

test('card numbers are 16 digits and not repeated', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 500; i += 1) {
    const n = newCardNumber();
    assert.ok(isCardNumber(n), n);
    seen.add(n);
  }
  assert.equal(seen.size, 500);
});

test('a typed number is cleaned (Arabic digits, spaces, dashes) and formatted in fours', () => {
  assert.equal(cleanCardNumber('١٢٣٤ 5678-9012 3456'), '1234567890123456');
  assert.equal(formatCardNumber('1234567890123456'), '1234 5678 9012 3456');
  assert.ok(!isCardNumber('12345'));
});

test('settings are normalized and the expiry presets are recognised', () => {
  const s = normalizeGiftSettings({ enabled: true, amounts: [1000000, 500000, 500000, -5, 'x'], expiry: { never: false, n: 6, unit: 'month' } });
  assert.deepEqual(s.amounts, [500000, 1000000]);
  assert.equal(expiryPreset(s.expiry), 'six');
  assert.equal(expiryPreset(DEFAULT_GIFT_SETTINGS.expiry), 'year');
  assert.equal(expiryPreset({ never: true, n: 1, unit: 'year' }), 'never');
  assert.equal(expiryPreset({ never: false, n: 10, unit: 'day' }), 'custom');
  assert.equal(normalizeGiftSettings(undefined).enabled, false);
});

test('expiry is counted from the sale day, or never', () => {
  const from = new Date('2026-01-31T10:00:00Z');
  assert.ok(expiryFrom({ ...DEFAULT_GIFT_SETTINGS, expiry: { never: false, n: 1, unit: 'year' } }, from).startsWith('2027-01-31'));
  assert.ok(expiryFrom({ ...DEFAULT_GIFT_SETTINGS, expiry: { never: false, n: 10, unit: 'day' } }, from).startsWith('2026-02-10'));
  assert.equal(expiryFrom({ ...DEFAULT_GIFT_SETTINGS, expiry: { never: true, n: 1, unit: 'year' } }, from), '');
});

test('a card pays at most its balance and knows when it is expired or empty', () => {
  const card = normalizeCard('1234567890123456', { initial: 500000, balance: 300000, expiresAt: '2026-06-01T00:00:00Z' });
  assert.equal(cardPayable(card, 100000), 100000);
  assert.equal(cardPayable(card, 800000), 300000);
  assert.equal(cardState(card, new Date('2026-05-01')), 'ok');
  assert.equal(cardState(card, new Date('2026-07-01')), 'expired');
  assert.equal(cardState({ balance: 0, expiresAt: '' }), 'empty');
});

test('a gift card on the bill gets no discount and counts in the total', () => {
  const item = (id: string, price: number, extra = {}) => ({ id, dishId: id, name: id, unitPrice: price, qty: 1, removed: [], extras: [], notes: '', sentAt: 'x', ...extra });
  const tab = normalizeTab('open_1', {
    items: [item('a', 100000), item('card', 500000, { card: '1234567890123456' })],
    discountPct: 10,
  });
  const t = tabTotals(tab);
  assert.equal(t.discount, 10000);
  assert.equal(t.total, 590000);
});
