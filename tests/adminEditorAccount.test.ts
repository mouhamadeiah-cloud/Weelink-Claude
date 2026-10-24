import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAllowance } from '../api/build-page';

test('the platform admin has no build ceiling', async () => {
  const db = { collection: () => { throw new Error('the admin is never looked up'); } } as any;
  assert.equal(await buildAllowance(db, 'platform-admin_admin', 'page'), null);
});

test('the admin editor tab keeps its login in memory and signs in as the admin before listening', () => {
  const fb = readFileSync(new URL('../src/services/firebase.ts', import.meta.url), 'utf8');
  assert.match(fb, /edit-gallery[\s\S]*initializeAuth\(app, \{ persistence: inMemoryPersistence \}\)/);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /adminEditorReady : Promise\.resolve\(\)\)\.then/);
  const api = readFileSync(new URL('../api/admin.ts', import.meta.url), 'utf8');
  assert.match(api, /action === 'editor-token'[\s\S]*createCustomToken\(`platform-admin_\$\{admin\.username\}`\)/);
});
