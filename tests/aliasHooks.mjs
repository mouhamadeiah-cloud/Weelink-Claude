const here = new URL('./', import.meta.url);
const FAKE = new URL('fakeAdmin.ts', here).href;
// The API's Firebase layer (server/firebase.ts), as imported by api/*.ts and server/*.ts. Tests that import
// it themselves (tests/firebaseRest.test.ts) get the real module.
const LAYER = /(^|\/)firebase\.js$/;
export async function resolve(specifier, context, next) {
  if (LAYER.test(specifier) && context.parentURL && !context.parentURL.includes('/tests/')) return { url: FAKE, shortCircuit: true };
  return next(specifier, context);
}
