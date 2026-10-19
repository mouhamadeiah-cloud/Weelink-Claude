import test from 'node:test';
import assert from 'node:assert/strict';
import { inquiryMail } from '../server/contact';
import { contactErrorText } from '../src/services/contact';

test('the owner\'s email escapes what a visitor typed', () => {
  const html = inquiryMail({ pageName: 'مطعم <b>النور</b>', name: '"><script>x</script>', phone: '0999', email: 'a@b.co', message: '<img src=x onerror=1>\nمرحبا' });
  assert.doesNotMatch(html, /<script>|<img |<b>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /مرحبا/);
});

test('every error code the server sends has a plain Arabic text', () => {
  for (const code of ['too_many', 'missing_fields', 'bad_email', 'offline']) assert.notEqual(contactErrorText(code), contactErrorText('unknown'));
});
