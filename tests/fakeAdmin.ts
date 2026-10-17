// A tiny in-memory stand-in for server/firebase.ts (the firebase-admin-shaped layer), enough for api/design-orders.ts.
export const store = new Map<string, any>();
let counter = 0;
const clone = (x: any) => JSON.parse(JSON.stringify(x));
const setPath = (obj: any, key: string, val: any) => { const parts = key.split('.'); let o = obj; for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] ||= {}; o[parts.at(-1)!] = val; };
export const FieldValue = { arrayUnion: (...v: any[]) => ({ __union: v }), delete: () => ({ __delete: true }), increment: (n: number) => ({ __inc: n }), serverTimestamp: () => ({ __ts: true }) };
const apply = (cur: any, patch: any) => { const next = clone(cur || {}); for (const [k, v] of Object.entries(patch)) { const x: any = v; if (x && x.__delete) { const parts = k.split('.'); const o = parts.slice(0, -1).reduce((a: any, p2) => a?.[p2], next); if (o) delete o[parts.at(-1)!]; } else if (x && x.__union) { const arr = (k.split('.').reduce((o: any, p) => o?.[p], next) || []).concat(clone(x.__union)); setPath(next, k, arr); } else if (x && x.__inc !== undefined) setPath(next, k, (Number(k.split('.').reduce((o: any, p) => o?.[p], next)) || 0) + x.__inc); else setPath(next, k, x); } return next; };
const docRef = (path: string) => ({
  id: path.split('/').pop()!,
  async get() { const d = store.get(path); return { exists: d !== undefined, id: path.split('/').pop()!, data: () => (d === undefined ? undefined : clone(d)) }; },
  async delete() { store.delete(path); },
  async set(data: any, opts?: any) { store.set(path, opts?.merge ? apply(store.get(path), data) : clone(data)); },
  async update(patch: any) { if (!store.has(path)) throw new Error('no doc'); store.set(path, apply(store.get(path), patch)); },
  collection(sub: string) { return colRef(`${path}/${sub}`); },
});
const colRef = (path: string): any => ({
  doc(id?: string) { return docRef(`${path}/${id || 'auto' + ++counter}`); },
  async add(data: any) { const id = 'm' + ++counter; store.set(`${path}/${id}`, clone(data)); return docRef(`${path}/${id}`); },
  where(field: string, op: string, val: any) { return query(path, [[field, val, op]]); },
  orderBy() { return colRef(path); },
  limit() { return colRef(path); },
  async get() { return query(path, []).get(); },
});
const cmp = (a: any, op: string, b: any) => (op === '>' ? a > b : op === '>=' ? a >= b : op === '<' ? a < b : op === '<=' ? a <= b : op === '!=' ? a !== b : op === 'in' ? b.includes(a) : a === b);
const query = (path: string, filters: [string, any, string?][]): any => ({
  where(field: string, op: string, val: any) { return query(path, [...filters, [field, val, op]]); },
  select() { return this; },
  limit() { return this; },
  orderBy() { return this; },
  async get() { const docs = [...store.entries()].filter(([k, v]) => k.startsWith(path + '/') && k.split('/').length === path.split('/').length + 1 && filters.every(([f, val, op]) => cmp(v[f], op || '==', val))).map(([k, v]) => ({ id: k.split('/').pop(), ref: docRef(k), data: () => clone(v) })); return { size: docs.length, docs }; },
});
export const getFirestore = () => ({ collection: (n: string) => colRef(n), doc: (p: string) => docRef(p), batch() { const ops: (() => Promise<void>)[] = []; return { set: (r: any, d: any, o?: any) => { ops.push(() => r.set(d, o)); }, delete: (r: any) => { ops.push(() => r.delete()); }, update: (r: any, p: any) => { ops.push(() => r.update(p)); }, async commit() { for (const op of ops) await op(); } }; }, async runTransaction(fn: any) { const tx = { get: (r: any) => r.get(), update: (r: any, p: any) => r.update(p), set: (r: any, d: any, o: any) => r.set(d, o) }; return fn(tx); } });
export const getApps = () => [{}];
export const initializeApp = () => ({});
export const cert = (x: any) => x;
export const tokens: Record<string, any> = {};
export const getAuth = () => ({ verifyIdToken: async (t: string) => { if (!tokens[t]) throw new Error('bad'); return tokens[t]; } });
