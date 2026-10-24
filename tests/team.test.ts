import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePerson, publicPeople } from '../src/services/team';

test('a person is trimmed and its email lower-cased', () => {
  const p = normalizePerson('p1', { name: '  سارة ', email: ' Sara@Mail.COM ', takesBookings: 'yes', role: 'طبيبة' });
  assert.equal(p.name, 'سارة');
  assert.equal(p.email, 'sara@mail.com');
  assert.equal(p.takesBookings, false);
  assert.equal(p.invite, '');
});

test('visitors see only the named people who take bookings, without email or phone', () => {
  const people = [
    normalizePerson('a', { name: 'سارة', role: 'طبيبة', email: 's@x.co', phone: '123', takesBookings: true }),
    normalizePerson('b', { name: 'سامر', role: 'مدير', email: 'm@x.co', takesBookings: false }),
    normalizePerson('c', { name: '', takesBookings: true }),
  ];
  assert.deepEqual(publicPeople(people), [{ id: 'a', name: 'سارة', role: 'طبيبة', photo: '' }]);
});
