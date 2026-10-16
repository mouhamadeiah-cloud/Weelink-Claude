// Test setup: the server modules (server/*.ts) import the Firebase layer (server/firebase.ts) and the mail helper; in the tests they get an
// in-memory stand-in (tests/fakeAdmin.ts) instead.
import { register } from 'node:module';
register('./aliasHooks.mjs', import.meta.url);
