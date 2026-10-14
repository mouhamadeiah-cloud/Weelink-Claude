const here = new URL('./', import.meta.url);
const MAP = {
  'firebase-admin/app': new URL('fakeAdmin.ts', here).href,
  'firebase-admin/auth': new URL('fakeAdmin.ts', here).href,
  'firebase-admin/firestore': new URL('fakeAdmin.ts', here).href,
  './orderMail.js': new URL('mailRecorder.ts', here).href,
};
export async function resolve(specifier, context, next) {
  if (MAP[specifier]) return { url: MAP[specifier], shortCircuit: true };
  return next(specifier, context);
}
