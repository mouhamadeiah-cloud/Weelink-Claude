// A tiny in-memory stand-in for firebase-admin, enough for api/design-orders.ts.
export const store = new Map<string, any>();
let counter = 0;
const clone = (x: any) => JSON.parse(JSON.stringify(x));
const setPath = (obj: any, key: string, val: any) => { const parts = key.split('.'); let o = obj; for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] ||= {}; o[parts.at(-1)!] = val; };
export const FieldValue = { arrayUnion: (...v: any[]) => ({ __union: v }), delete: () => ({ __delete: true }), increment: (n: number) => ({ __inc: n }) };
const apply = (cur: any, patch: any) => { const next = clone(cur || {}); for (const [k, v] of Object.entries(patch)) { const x: any = v; if (x && x.__union) { const arr = (k.split('.').reduce((o: any, p) => o?.[p], next) || []).concat(clone(x.__union)); setPath(next, k, arr); } else if (x && x.__inc !== undefined) setPath(next, k, (Number(k.split('.').reduce((o: any, p) => o?.[p], next)) || 0) + x.__inc); else setPath(next, k, x); } return next; };
const docRef = (path: string) => ({
  id: path.split('/').pop()!,
  async get() { const d = store.get(path); return { exists: d !== undefined, id: path.split('/').pop()!, data: () => (d === undefined ? undefined : clone(d)) }; },
  async set(data: any, opts?: any) { store.set(path, opts?.merge ? apply(store.get(path), data) : clone(data)); },
  async update(patch: any) { if (!store.has(path)) throw new Error('no doc'); store.set(path, apply(store.get(path), patch)); },
  collection(sub: string) { return colRef(`${path}/${sub}`); },
});
const colRef = (path: string): any => ({
  doc(id?: string) { return docRef(`${path}/${id || 'auto' + ++counter}`); },
  async add(data: any) { const id = 'm' + ++counter; store.set(`${path}/${id}`, clone(data)); return docRef(`${path}/${id}`); },
  where(field: string, _op: string, val: any) { return query(path, [[field, val]]); },
  orderBy() { return colRef(path); },
  async get() { return query(path, []).get(); },
});
const query = (path: string, filters: [string, any][]): any => ({
  where(field: string, _op: string, val: any) { return query(path, [...filters, [field, val]]); },
  select() { return this; },
  async get() { const docs = [...store.entries()].filter(([k, v]) => k.startsWith(path + '/') && k.split('/').length === path.split('/').length + 1 && filters.every(([f, val]) => v[f] === val)).map(([k, v]) => ({ id: k.split('/').pop(), ref: docRef(k), data: () => clone(v) })); return { size: docs.length, docs }; },
});
export const getFirestore = () => ({ collection: (n: string) => colRef(n), async runTransaction(fn: any) { const tx = { get: (r: any) => r.get(), update: (r: any, p: any) => r.update(p), set: (r: any, d: any, o: any) => r.set(d, o) }; return fn(tx); } });
export const getApps = () => [{}];
export const initializeApp = () => ({});
export const cert = (x: any) => x;
export const tokens: Record<string, any> = {};
export const getAuth = () => ({ verifyIdToken: async (t: string) => { if (!tokens[t]) throw new Error('bad'); return tokens[t]; } });
