const here = new URL('./', import.meta.url);
const FAKE = new URL('fakeAdmin.ts', here).href;
// The API's Firebase layer (server/firebase.ts), as imported by api/*.ts and server/*.ts, becomes the in-memory
// fake. Matched on the resolved file, so it holds whichever loader rewrote the specifier first. Tests that import
// the layer themselves (tests/firebaseRest.test.ts) get the real module.
export async function resolve(specifier, context, next) {
  const resolved = await next(specifier, context);
  if (resolved.url.endsWith('/server/firebase.ts') && context.parentURL && !context.parentURL.includes('/tests/')) return { url: FAKE, shortCircuit: true };
  return resolved;
}
