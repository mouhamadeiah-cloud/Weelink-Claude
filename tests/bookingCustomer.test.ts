import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_CUSTOMER, customerProblem, pageKindOf } from '../src/services/bookingCustomer.ts';

const ok = { ...EMPTY_CUSTOMER, name: 'ليلى أحمد', phone: '0933123456', email: 'l@x.com' };

test('a complete customer has no problem', () => {
  assert.equal(customerProblem(ok, true), '');
});

test('name and phone are always needed, the email on a live page', () => {
  assert.match(customerProblem({ ...ok, name: 'ل' }, true), /اسمك/);
  assert.match(customerProblem({ ...ok, phone: '12' }, true), /الهاتف/);
  assert.match(customerProblem({ ...ok, email: '' }, true), /إيميلك/);
  assert.equal(customerProblem({ ...ok, email: '' }, false), '');
  assert.match(customerProblem({ ...ok, email: 'nope' }, true), /الإيميل/);
});

test('an account needs an email and a password, unless the visitor is signed in', () => {
  assert.match(customerProblem({ ...ok, register: true, password: '123' }, true), /كلمة المرور/);
  assert.equal(customerProblem({ ...ok, register: true, password: '123456' }, true), '');
  assert.match(customerProblem({ ...ok, email: '', register: true, password: '123456' }, false), /حساب/);
  assert.equal(customerProblem({ ...ok, register: true, password: '' }, true, true), '');
});

test('a page key maps to the customers kind', () => {
  assert.equal(pageKindOf('page'), 'site');
  assert.equal(pageKindOf('page-ab12'), 'site');
  assert.equal(pageKindOf('shop'), 'shop');
  assert.equal(pageKindOf('restaurant-x1y2z3'), 'restaurant');
});
