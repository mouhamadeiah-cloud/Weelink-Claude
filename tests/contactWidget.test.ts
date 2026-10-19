import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContactFormWidget } from '../src/components/contact/ContactFormWidget';

test('the form shows its fields, the owner\'s heading and button, and a hidden trap field', () => {
  const html = renderToStaticMarkup(React.createElement(ContactFormWidget, { elem: { id: 'e', type: 'contactForm', contactTitle: 'كلمنا', contactButtonText: 'ابعت', contactAccentColor: '#ff0000' } as any }));
  assert.match(html, /كلمنا/);
  assert.match(html, /ابعت/);
  assert.match(html, /background-color:#ff0000/);
  assert.match(html, /placeholder="رقم الهاتف"/);
  assert.match(html, /aria-hidden="true"/);
});
