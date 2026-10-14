import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeUrl } from '../src/utils/safeHtml.ts';
import { isApproved } from '../src/data/designerBadge.ts';
import { splitPrice } from '../src/data/designerPricing.ts';

test('links: only web, mail, phone and chat schemes are safe', () => {
  for (const u of ['https://a.com', 'http://a.com/x', 'mailto:a@b.c', 'tel:+4912345', 'whatsapp://send?phone=1']) assert.equal(isSafeUrl(u), true, u);
  for (const u of ['javascript:alert(1)', ' JavaScript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', '', undefined]) assert.equal(isSafeUrl(u as string), false, String(u));
});

test('badge: ten completed orders, five ratings and 4.5 average', () => {
  assert.equal(isApproved({ completed: 10, ratingCount: 5, ratingSum: 25 }), true);
  assert.equal(isApproved({ completed: 9, ratingCount: 5, ratingSum: 25 }), false);
  assert.equal(isApproved({ completed: 10, ratingCount: 4, ratingSum: 20 }), false);
  assert.equal(isApproved({ completed: 10, ratingCount: 6, ratingSum: 26 }), false); // 4.33
});

test('price split: designer 70%, platform 30%, always adds up', () => {
  for (const p of [199000, 699000, 899000, 1400000]) {
    const s = splitPrice(p);
    assert.equal(s.designer + s.platform, p);
    assert.equal(s.platform, Math.round(p * 0.3));
  }
});
