import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler, { PER_VISITOR_HOUR } from '../server/contact.ts';
import { store, users } from './fakeAdmin.ts';

process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ private_key: 'x' });
users['owner1'] = { email: 'owner@example.com' };

const good = { owner: 'owner1', project: 'page', pageName: 'صفحتي', name: 'سامر', phone: '0933123456', email: '', message: 'بدي أسأل عن الأسعار', website: '' };
const call = async (body: any, ip = '1.1.1.1') => {
  const r = await handler.fetch(new Request('http://x/api/contact', { method: 'POST', headers: { 'cf-connecting-ip': ip }, body: JSON.stringify(body) }));
  return { s: r.status, ...(await r.json()) };
};
const saved = () => [...store.keys()].filter((k) => k.startsWith('inquiries/owner1/items/'));

test('a message is saved for the owner', async () => {
  assert.equal((await call(good, '2.2.2.2')).s, 200);
  const [key] = saved();
  assert.equal(store.get(key).message, 'بدي أسأل عن الأسعار');
  assert.equal(store.get(key).read, false);
});

test('bad input is refused and nothing is saved', async () => {
  const before = saved().length;
  assert.equal((await call({ ...good, name: 'س' }, '3.3.3.3')).error, 'missing_fields');
  assert.equal((await call({ ...good, phone: '12' }, '3.3.3.3')).error, 'missing_fields');
  assert.equal((await call({ ...good, email: 'nope' }, '3.3.3.3')).error, 'bad_email');
  assert.equal((await call({ ...good, owner: '../x' }, '3.3.3.3')).error, 'bad_request');
  assert.equal((await call({ ...good, project: 'admin' }, '3.3.3.3')).error, 'bad_request');
  assert.equal((await call({ ...good, owner: 'ghost' }, '3.3.3.3')).error, 'not_found');
  assert.equal(saved().length, before);
});

test('a bot that fills the hidden field gets ok and nothing is saved', async () => {
  const before = saved().length;
  assert.equal((await call({ ...good, website: 'http://spam' }, '4.4.4.4')).s, 200);
  assert.equal(saved().length, before);
});

test('one visitor can send only a few messages an hour', async () => {
  const before = saved().length;
  for (let i = 0; i < PER_VISITOR_HOUR; i++) assert.equal((await call(good, '5.5.5.5')).s, 200);
  assert.equal((await call(good, '5.5.5.5')).s, 429);
  assert.equal((await call(good, '6.6.6.6')).s, 200);
  assert.equal(saved().length, before + PER_VISITOR_HOUR + 1);
});
