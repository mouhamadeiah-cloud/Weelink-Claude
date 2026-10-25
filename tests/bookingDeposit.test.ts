import { test } from 'node:test';
import assert from 'node:assert/strict';
import { depositAmount, normalizePayments, normalizeRule, parseProof, priceNumber, usableWallets } from '../src/services/bookingDeposit.ts';

test('the first number of a free-text price', () => {
  assert.equal(priceNumber('25$ للشخص'), 25);
  assert.equal(priceNumber('٥٠ ألف ل.س'), 50);
  assert.equal(priceNumber('12.5'), 12.5);
  assert.equal(priceNumber('1,500'), 1500);
  assert.equal(priceNumber('مجاناً'), null);
  assert.equal(priceNumber(''), null);
});

test('a fixed deposit is asked as it is; a percent needs a price', () => {
  assert.equal(depositAmount({ on: true, type: 'fixed', value: 10 }, null), 10);
  assert.equal(depositAmount({ on: true, type: 'percent', value: 30 }, 200), 60);
  assert.equal(depositAmount({ on: true, type: 'percent', value: 30 }, null), 0);
  assert.equal(depositAmount({ on: false, type: 'fixed', value: 10 }, 100), 0);
  assert.equal(depositAmount({ on: true, type: 'fixed', value: 0 }, 100), 0);
});

test('a percent is only for schedules that have a price', () => {
  assert.equal(normalizeRule({ depositOn: true, depositType: 'percent', depositValue: 30 }, false).type, 'fixed');
  assert.deepEqual(normalizeRule({ depositOn: true, depositType: 'percent', depositValue: 300 }, true), { on: true, type: 'percent', value: 100 });
});

test('only wallets with an account are usable, and a proof needs a usable wallet and a transaction number', () => {
  const p = normalizePayments({ currency: '$', wallets: { syriatel: { enabled: true, account: '093' }, sham: { enabled: true, account: '' }, mtn: { enabled: false, account: '095' } } });
  assert.deepEqual(usableWallets(p).map((w) => w.id), ['syriatel']);
  assert.equal(parseProof({ wallet: 'syriatel', txn: 'AB123' }, p)?.txn, 'AB123');
  assert.equal(parseProof({ wallet: 'sham', txn: 'AB123' }, p), null);
  assert.equal(parseProof({ wallet: 'syriatel', txn: 'A' }, p), null);
  assert.equal(parseProof({ wallet: 'syriatel', txn: 'AB123', screenshot: 'javascript:1' }, p)?.screenshot, '');
});
