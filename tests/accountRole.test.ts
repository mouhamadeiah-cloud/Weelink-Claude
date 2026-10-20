import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';

// A tab's sessionStorage, for the node test run.
const store = new Map<string, string>();
(globalThis as any).sessionStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
};

const { readRole, writeRole, setRoleState } = await import('../src/services/accountRole');
const { RolePicker } = await import('../src/components/platform/RolePicker');

test('the role of a sign-in is kept per account in this tab, and asked again once it is cleared', () => {
  assert.equal(readRole('a'), null);
  writeRole('a', 'designer');
  writeRole('b', 'user');
  assert.equal(readRole('a'), 'designer');
  assert.equal(readRole('b'), 'user');
  writeRole('a', null);
  assert.equal(readRole('a'), null);
  assert.equal(readRole(undefined), null);
});

test('a stored value that is not a role is ignored', () => {
  store.set('weelink_role_x', 'admin');
  assert.equal(readRole('x'), null);
});

test('the role store hands the top bar the role of this sign-in', async () => {
  const { useRoleState } = await import('../src/services/accountRole');
  const Probe = () => {
    const st = useRoleState();
    return React.createElement('span', null, `${st.isDesignerAccount}:${st.role}`);
  };
  setRoleState({ isDesignerAccount: true, role: 'designer', switchTo: () => {} });
  assert.match(renderToStaticMarkup(React.createElement(Probe)), /true:designer/);
  setRoleState({ isDesignerAccount: false, role: 'user' });
  assert.match(renderToStaticMarkup(React.createElement(Probe)), /false:user/);
});

test('the role picker offers both roles and a way out', () => {
  const html = renderToStaticMarkup(React.createElement(RolePicker, { name: 'ليلى', onPick: () => {}, onLogout: () => {} }));
  assert.match(html, /أدخل كمستخدم/);
  assert.match(html, /أدخل كمصمم/);
  assert.match(html, /تسجيل الخروج/);
  assert.match(html, /ليلى/);
});

test('the sign-in screen asks for the role, and a signed-in account no longer becomes a designer from the start page', () => {
  const auth = readFileSync(new URL('../src/components/StandardAuth.tsx', import.meta.url), 'utf8');
  assert.match(auth, /دخول كمستخدم/);
  assert.match(auth, /دخول كمصمم/);
  const start = readFileSync(new URL('../src/components/onboarding/StartPage.tsx', import.meta.url), 'utf8');
  assert.match(start, /\{!signedIn && <button/);
});
