import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOrderRecord, orderLedgerEntry } from '../src/components/restaurant/restaurantTypes';

const base = { id: 'o1', number: 5, createdAt: '2026-10-25T10:00:00.000Z', status: 'new', type: 'pickup', source: 'website', name: 'سارة', phone: '0999', lines: [{ dishId: 'd', name: 'شاورما', unitPrice: 10, qty: 2 }], subtotal: 20, deliveryFee: 0, total: 20 };

test('an order keeps its e-wallet payment and books it under the wallet', () => {
  const o = normalizeOrderRecord({ ...base, payment: { wallet: 'sham', walletLabel: 'شام كاش', txn: 'T123', screenshot: '', amount: 20, currency: 'ل.س', state: 'paid' } });
  assert.equal(o.payment?.state, 'paid');
  assert.equal(orderLedgerEntry(o).method, 'شام كاش');
});

test('an order without a payment, or with an empty one, is paid in cash', () => {
  const o = normalizeOrderRecord(base);
  assert.equal(o.payment, undefined);
  assert.equal(orderLedgerEntry(o).method, 'نقدي');
  assert.equal(normalizeOrderRecord({ ...base, payment: { txn: '' } }).payment, undefined);
});

test('an unknown payment state is pending', () => {
  assert.equal(normalizeOrderRecord({ ...base, payment: { txn: 'T1', state: 'whatever' } }).payment?.state, 'pending');
});
