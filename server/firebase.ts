// A small stand-in for the parts of firebase-admin the API uses, built on Google's REST APIs and fetch.
// firebase-admin's Firestore client needs gRPC and code generation, which Cloudflare Workers forbid; this
// runs on Workers and in Node alike. The exports keep firebase-admin's names and shapes
// (initializeApp/cert/getApps, getAuth, getFirestore, FieldValue, Timestamp), so the handlers only
// changed their import lines.
//
// Firestore: https://firestore.googleapis.com/v1 (documents get/commit/runQuery/beginTransaction/rollback).
// Auth: Identity Toolkit (accounts:lookup/update/batchGet), and ID tokens checked against Google's
// securetoken keys. FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST point both at the emulators.

type Json = any;

// ---------- app and credentials ----------

type ServiceAccount = { client_email?: string; clientEmail?: string; private_key?: string; privateKey?: string; project_id?: string; projectId?: string };
export type App = { projectId: string; credential: ServiceAccount };

const apps: App[] = [];
export const cert = (account: object) => account as ServiceAccount;
export const getApps = () => apps;
export const initializeApp = (options: { credential: ServiceAccount; projectId?: string }): App => {
  const c = options.credential;
  const app = { projectId: options.projectId || c.project_id || c.projectId || '', credential: c };
  apps.push(app);
  return app;
};

const env = (name: string) => (typeof process !== 'undefined' ? process.env[name] : undefined);

const b64url = (bytes: Uint8Array | string) => {
  const raw = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  let s = '';
  for (const b of raw) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
};

const SCOPES = 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/firebase';
const tokens = new WeakMap<App, { token: string; until: number }>();
const signingKeys = new WeakMap<App, Promise<CryptoKey>>();

// An OAuth access token for the service account (JWT bearer grant), kept until a minute before it expires.
const accessToken = async (app: App): Promise<string> => {
  if (env('FIRESTORE_EMULATOR_HOST') || env('FIREBASE_AUTH_EMULATOR_HOST')) return 'owner';
  const cached = tokens.get(app);
  if (cached && cached.until > Date.now()) return cached.token;
  const email = app.credential.client_email || app.credential.clientEmail || '';
  const pem = (app.credential.private_key || app.credential.privateKey || '').replace(/\\n/g, '\n');
  let key = signingKeys.get(app);
  if (!key) {
    const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (ch) => ch.charCodeAt(0));
    key = crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    signingKeys.set(app, key);
  }
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify({ iss: email, scope: SCOPES, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }))}`;
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', await key, new TextEncoder().encode(unsigned)));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${unsigned}.${b64url(signature)}`,
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !data.access_token) throw new Error(`service account token: ${data.error_description || res.status}`);
  tokens.set(app, { token: data.access_token, until: Date.now() + ((data.expires_in || 3600) - 60) * 1000 });
  return data.access_token;
};

class ApiError extends Error {
  constructor(message: string, readonly code: string | number, readonly status: number) {
    super(message);
  }
}

const call = async (app: App, url: string, init: { method?: string; body?: Json } = {}): Promise<Json> => {
  const res = await fetch(url, {
    method: init.method || (init.body === undefined ? 'GET' : 'POST'),
    headers: { Authorization: `Bearer ${await accessToken(app)}`, ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = (Array.isArray(data) ? data[0] : data)?.error || {};
    throw new ApiError(err.message || `HTTP ${res.status}`, err.status || err.message || res.status, res.status);
  }
  return data;
};

// ---------- Firestore values ----------

export class Timestamp {
  constructor(readonly seconds: number, readonly nanoseconds: number) {}
  static now() {
    return Timestamp.fromMillis(Date.now());
  }
  static fromMillis(ms: number) {
    return new Timestamp(Math.floor(ms / 1000), Math.round((ms % 1000) * 1e6));
  }
  static fromDate(d: Date) {
    return Timestamp.fromMillis(d.getTime());
  }
  toMillis() {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6);
  }
  toDate() {
    return new Date(this.toMillis());
  }
  isEqual(other: Timestamp) {
    return other instanceof Timestamp && other.seconds === this.seconds && other.nanoseconds === this.nanoseconds;
  }
  toISOString() {
    const iso = new Date(this.seconds * 1000).toISOString();
    return `${iso.slice(0, 19)}.${String(this.nanoseconds).padStart(9, '0')}Z`;
  }
  valueOf() {
    return String(this.toMillis()).padStart(20, '0');
  }
}

class Sentinel {
  constructor(readonly kind: 'delete' | 'serverTimestamp' | 'increment' | 'arrayUnion' | 'arrayRemove', readonly arg?: Json) {}
}
export const FieldValue = {
  delete: () => new Sentinel('delete'),
  serverTimestamp: () => new Sentinel('serverTimestamp'),
  increment: (n: number) => new Sentinel('increment', n),
  arrayUnion: (...values: Json[]) => new Sentinel('arrayUnion', values),
  arrayRemove: (...values: Json[]) => new Sentinel('arrayRemove', values),
};

const isPlainObject = (v: Json) => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && !(v instanceof Timestamp) && !(v instanceof Sentinel) && !(v instanceof DocumentReference) && !(v instanceof Uint8Array);

const encode = (v: Json): Json => {
  if (v === null) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isSafeInteger(v) && !Object.is(v, -0) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'bigint') return { integerValue: v.toString() };
  if (typeof v === 'string') return { stringValue: v };
  if (v instanceof Timestamp) return { timestampValue: v.toISOString() };
  if (v instanceof Date) return { timestampValue: Timestamp.fromDate(v).toISOString() };
  if (v instanceof DocumentReference) return { referenceValue: v.name };
  if (v instanceof Uint8Array) return { bytesValue: btoa(String.fromCharCode(...v)) };
  if (Array.isArray(v)) return { arrayValue: { values: v.filter((x) => x !== undefined).map(encode) } };
  if (typeof v === 'object') return { mapValue: { fields: encodeFields(v) } };
  throw new Error(`Firestore cannot store a ${typeof v}`);
};
const encodeFields = (obj: Record<string, Json>) => {
  const fields: Record<string, Json> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && !(v instanceof Sentinel)) fields[k] = encode(v);
  return fields;
};

const decode = (v: Json): Json => {
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) {
    const m = /^(.*?)(?:\.(\d+))?Z$/.exec(v.timestampValue);
    const seconds = Math.floor(Date.parse(`${m ? m[1] : v.timestampValue}Z`) / 1000);
    return new Timestamp(seconds, m?.[2] ? Number(m[2].padEnd(9, '0').slice(0, 9)) : 0);
  }
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('referenceValue' in v) return v.referenceValue;
  if ('geoPointValue' in v) return v.geoPointValue;
  if ('bytesValue' in v) return Uint8Array.from(atob(v.bytesValue), (ch) => ch.charCodeAt(0));
  return null;
};
const decodeFields = (fields: Record<string, Json>) => {
  const out: Record<string, Json> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decode(v);
  return out;
};

// A field path as Firestore's REST API wants it: segments that are not plain identifiers go in backticks.
const segment = (s: string) => (/^[A-Za-z_][A-Za-z_0-9]*$/.test(s) ? s : `\`${s.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\``);
const fieldPath = (segments: string[]) => segments.map(segment).join('.');
const dotted = (path: string) => fieldPath(path.split('.'));

// Sentinels become field transforms; deletes go in the update mask without a value.
type Transforms = { transforms: Json[]; deletes: string[] };
const addSentinel = (fp: string, v: Sentinel, out: Transforms) => {
  if (v.kind === 'delete') out.deletes.push(fp);
  else if (v.kind === 'serverTimestamp') out.transforms.push({ fieldPath: fp, setToServerValue: 'REQUEST_TIME' });
  else if (v.kind === 'increment') out.transforms.push({ fieldPath: fp, increment: encode(v.arg) });
  else if (v.kind === 'arrayUnion') out.transforms.push({ fieldPath: fp, appendMissingElements: { values: v.arg.map(encode) } });
  else out.transforms.push({ fieldPath: fp, removeAllFromArray: { values: v.arg.map(encode) } });
};
const collectSentinels = (obj: Record<string, Json>, prefix: string[], out: Transforms) => {
  for (const [k, v] of Object.entries(obj)) {
    const path = [...prefix, k];
    if (v instanceof Sentinel) addSentinel(fieldPath(path), v, out);
    else if (isPlainObject(v)) collectSentinels(v, path, out);
  }
};
// The data without its sentinels (nested maps that only held sentinels disappear).
const stripSentinels = (obj: Record<string, Json>): Record<string, Json> => {
  const out: Record<string, Json> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Sentinel || v === undefined) continue;
    if (isPlainObject(v)) {
      const inner = stripSentinels(v);
      if (Object.keys(inner).length || !Object.keys(v).length) out[k] = inner;
    } else out[k] = v;
  }
  return out;
};
// The leaf paths a merge touches: every non-map value, and empty maps.
const leafPaths = (obj: Record<string, Json>, prefix: string[], out: string[]) => {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v instanceof Sentinel) continue;
    const path = [...prefix, k];
    if (isPlainObject(v) && Object.keys(v).length) leafPaths(v, path, out);
    else out.push(fieldPath(path));
  }
};
const setPath = (obj: Record<string, Json>, segments: string[], value: Json) => {
  let o = obj;
  for (const s of segments.slice(0, -1)) o = isPlainObject(o[s]) ? o[s] : (o[s] = {});
  o[segments[segments.length - 1]] = value;
};

type Write = Json;
const writeFor = {
  set(ref: DocumentReference, data: Record<string, Json>, options?: { merge?: boolean }): Write {
    const sentinels: Transforms = { transforms: [], deletes: [] };
    collectSentinels(data, [], sentinels);
    const plain = stripSentinels(data);
    const write: Write = { update: { name: ref.name, fields: encodeFields(plain) } };
    if (options?.merge) {
      const mask: string[] = [];
      leafPaths(plain, [], mask);
      write.updateMask = { fieldPaths: [...mask, ...sentinels.deletes] };
    }
    if (sentinels.transforms.length) write.updateTransforms = sentinels.transforms;
    return write;
  },
  create(ref: DocumentReference, data: Record<string, Json>): Write {
    return { ...writeFor.set(ref, data), currentDocument: { exists: false } };
  },
  // update()'s keys are field paths ('a.b'); each one replaces that field as a whole.
  update(ref: DocumentReference, data: Record<string, Json>): Write {
    const fields: Record<string, Json> = {};
    const mask: string[] = [];
    const sentinels: Transforms = { transforms: [], deletes: [] };
    for (const [key, v] of Object.entries(data)) {
      if (v === undefined) continue;
      const segments = key.split('.');
      if (v instanceof Sentinel) {
        addSentinel(fieldPath(segments), v, sentinels);
        continue;
      }
      if (isPlainObject(v)) collectSentinels(v, segments, sentinels);
      setPath(fields, segments, isPlainObject(v) ? stripSentinels(v) : v);
      mask.push(fieldPath(segments));
    }
    const write: Write = { update: { name: ref.name, fields: encodeFields(fields) }, updateMask: { fieldPaths: [...mask, ...sentinels.deletes] }, currentDocument: { exists: true } };
    if (sentinels.transforms.length) write.updateTransforms = sentinels.transforms;
    return write;
  },
  delete(ref: DocumentReference): Write {
    return { delete: ref.name };
  },
};

// ---------- documents, collections and queries ----------

export class DocumentSnapshot {
  constructor(readonly ref: DocumentReference, private readonly fields: Record<string, Json> | null, readonly createTime?: Timestamp, readonly updateTime?: Timestamp) {}
  get id() {
    return this.ref.id;
  }
  get exists() {
    return this.fields !== null;
  }
  data(): Json {
    return this.fields === null ? undefined : decodeFields(this.fields);
  }
  get(path: string): Json {
    const data = this.data();
    return data === undefined ? undefined : path.split('.').reduce((o: Json, k) => (o == null ? undefined : o[k]), data);
  }
}
export type QueryDocumentSnapshot = DocumentSnapshot;

export class QuerySnapshot {
  constructor(readonly docs: DocumentSnapshot[]) {}
  get size() {
    return this.docs.length;
  }
  get empty() {
    return this.docs.length === 0;
  }
  forEach(fn: (doc: DocumentSnapshot) => void) {
    this.docs.forEach(fn);
  }
}

const tsOf = (iso?: string) => (iso ? (decode({ timestampValue: iso }) as Timestamp) : undefined);
const AUTO_ID = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const autoId = () => Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => AUTO_ID[b % 62]).join('');

export class Firestore {
  readonly root: string;
  readonly base: string;
  constructor(readonly app: App, readonly databaseId = '(default)') {
    this.root = `projects/${app.projectId}/databases/${databaseId}/documents`;
    const emulator = env('FIRESTORE_EMULATOR_HOST');
    this.base = emulator ? `http://${emulator}/v1` : 'https://firestore.googleapis.com/v1';
  }
  url(name: string, suffix = '') {
    return `${this.base}/${name.split('/').map(encodeURIComponent).join('/')}${suffix}`;
  }
  collection(path: string) {
    return new CollectionReference(this, path);
  }
  doc(path: string) {
    return new DocumentReference(this, path);
  }
  batch() {
    return new WriteBatch(this);
  }
  async commit(writes: Write[], transaction?: string) {
    if (!writes.length && !transaction) return;
    await call(this.app, `${this.base}/projects/${this.app.projectId}/databases/${this.databaseId}/documents:commit`, { body: { writes, ...(transaction ? { transaction } : {}) } });
  }
  // Reads go through documents:batchGet, as firebase-admin's do (a plain GET inside a transaction stalls on the emulator).
  async getDoc(ref: DocumentReference, transaction?: string) {
    const rows = (await call(this.app, `${this.base}/projects/${this.app.projectId}/databases/${this.databaseId}/documents:batchGet`, { body: { documents: [ref.name], ...(transaction ? { transaction } : {}) } })) as Json[];
    const d = rows.find((r) => r.found)?.found;
    return d ? new DocumentSnapshot(ref, d.fields || {}, tsOf(d.createTime), tsOf(d.updateTime)) : new DocumentSnapshot(ref, null);
  }
  async runQuery(q: Query, transaction?: string) {
    const parent = q.parentPath ? `${this.root}/${q.parentPath}` : this.root;
    const rows = (await call(this.app, this.url(parent, ':runQuery'), { body: { structuredQuery: q.structured(), ...(transaction ? { transaction } : {}) } })) as Json[];
    return new QuerySnapshot(rows.filter((r) => r.document).map((r) => new DocumentSnapshot(this.doc(r.document.name.slice(this.root.length + 1)), r.document.fields || {}, tsOf(r.document.createTime), tsOf(r.document.updateTime))));
  }
  // Runs fn in a read-write transaction, retrying when Firestore aborts it for contention (as firebase-admin does).
  async runTransaction<T>(fn: (t: Transaction) => Promise<T>): Promise<T> {
    let last: unknown;
    let retry: string | undefined;
    for (let attempt = 0; attempt < 5; attempt++) {
      const begun = await call(this.app, `${this.base}/projects/${this.app.projectId}/databases/${this.databaseId}/documents:beginTransaction`, { body: { options: { readWrite: retry ? { retryTransaction: retry } : {} } } });
      const t = new Transaction(this, begun.transaction);
      let result: T;
      try {
        result = await fn(t);
      } catch (e) {
        await call(this.app, `${this.base}/projects/${this.app.projectId}/databases/${this.databaseId}/documents:rollback`, { body: { transaction: begun.transaction } }).catch(() => undefined);
        throw e;
      }
      try {
        await this.commit(t.writes, begun.transaction);
        return result;
      } catch (e) {
        last = e;
        if (!(e instanceof ApiError && (e.status === 409 || e.code === 'ABORTED'))) throw e;
        retry = begun.transaction;
      }
    }
    throw last;
  }
}

export class Query {
  constructor(
    readonly db: Firestore,
    readonly path: string,
    readonly filters: Json[] = [],
    readonly orders: Json[] = [],
    readonly max?: number,
    readonly fields?: string[],
  ) {}
  get parentPath() {
    return this.path.split('/').slice(0, -1).join('/');
  }
  get collectionId() {
    return this.path.split('/').pop()!;
  }
  where(field: string, op: string, value: Json) {
    const ops: Record<string, string> = { '==': 'EQUAL', '!=': 'NOT_EQUAL', '<': 'LESS_THAN', '<=': 'LESS_THAN_OR_EQUAL', '>': 'GREATER_THAN', '>=': 'GREATER_THAN_OR_EQUAL', in: 'IN', 'not-in': 'NOT_IN', 'array-contains': 'ARRAY_CONTAINS', 'array-contains-any': 'ARRAY_CONTAINS_ANY' };
    if (!ops[op]) throw new Error(`unsupported where operator ${op}`);
    const filter = value === null && (op === '==' || op === '!=')
      ? { unaryFilter: { field: { fieldPath: dotted(field) }, op: op === '==' ? 'IS_NULL' : 'IS_NOT_NULL' } }
      : { fieldFilter: { field: { fieldPath: dotted(field) }, op: ops[op], value: encode(value) } };
    return new Query(this.db, this.path, [...this.filters, filter], this.orders, this.max, this.fields);
  }
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return new Query(this.db, this.path, this.filters, [...this.orders, { field: { fieldPath: dotted(field) }, direction: direction === 'desc' ? 'DESCENDING' : 'ASCENDING' }], this.max, this.fields);
  }
  limit(n: number) {
    return new Query(this.db, this.path, this.filters, this.orders, n, this.fields);
  }
  select(...fields: string[]) {
    return new Query(this.db, this.path, this.filters, this.orders, this.max, fields);
  }
  structured() {
    const q: Json = { from: [{ collectionId: this.collectionId }] };
    if (this.filters.length === 1) q.where = this.filters[0];
    else if (this.filters.length) q.where = { compositeFilter: { op: 'AND', filters: this.filters } };
    if (this.orders.length) q.orderBy = this.orders;
    if (this.max !== undefined) q.limit = this.max;
    if (this.fields) q.select = { fields: (this.fields.length ? this.fields : ['__name__']).map((f) => ({ fieldPath: f === '__name__' ? f : dotted(f) })) };
    return q;
  }
  get() {
    return this.db.runQuery(this);
  }
}

export class CollectionReference extends Query {
  constructor(db: Firestore, path: string) {
    super(db, path);
  }
  get id() {
    return this.collectionId;
  }
  get parent() {
    return this.parentPath ? new DocumentReference(this.db, this.parentPath) : null;
  }
  doc(id?: string) {
    return new DocumentReference(this.db, `${this.path}/${id ?? autoId()}`);
  }
  async add(data: Record<string, Json>) {
    const ref = this.doc();
    await ref.create(data);
    return ref;
  }
}

export class DocumentReference {
  constructor(readonly firestore: Firestore, readonly path: string) {}
  get id() {
    return this.path.split('/').pop()!;
  }
  get name() {
    return `${this.firestore.root}/${this.path}`;
  }
  get parent() {
    return new CollectionReference(this.firestore, this.path.split('/').slice(0, -1).join('/'));
  }
  collection(sub: string) {
    return new CollectionReference(this.firestore, `${this.path}/${sub}`);
  }
  get() {
    return this.firestore.getDoc(this);
  }
  set(data: Record<string, Json>, options?: { merge?: boolean }) {
    return this.firestore.commit([writeFor.set(this, data, options)]);
  }
  create(data: Record<string, Json>) {
    return this.firestore.commit([writeFor.create(this, data)]);
  }
  update(data: Record<string, Json>) {
    return this.firestore.commit([writeFor.update(this, data)]);
  }
  delete() {
    return this.firestore.commit([writeFor.delete(this)]);
  }
}

export class WriteBatch {
  readonly writes: Write[] = [];
  constructor(private readonly db: Firestore) {}
  set(ref: DocumentReference, data: Record<string, Json>, options?: { merge?: boolean }) {
    this.writes.push(writeFor.set(ref, data, options));
    return this;
  }
  create(ref: DocumentReference, data: Record<string, Json>) {
    this.writes.push(writeFor.create(ref, data));
    return this;
  }
  update(ref: DocumentReference, data: Record<string, Json>) {
    this.writes.push(writeFor.update(ref, data));
    return this;
  }
  delete(ref: DocumentReference) {
    this.writes.push(writeFor.delete(ref));
    return this;
  }
  commit() {
    return this.db.commit(this.writes);
  }
}

export class Transaction {
  readonly writes: Write[] = [];
  constructor(private readonly db: Firestore, readonly id: string) {}
  get(ref: DocumentReference): Promise<DocumentSnapshot>;
  get(query: Query): Promise<QuerySnapshot>;
  get(target: DocumentReference | Query): Promise<DocumentSnapshot | QuerySnapshot> {
    return target instanceof DocumentReference ? this.db.getDoc(target, this.id) : this.db.runQuery(target, this.id);
  }
  set(ref: DocumentReference, data: Record<string, Json>, options?: { merge?: boolean }) {
    this.writes.push(writeFor.set(ref, data, options));
    return this;
  }
  create(ref: DocumentReference, data: Record<string, Json>) {
    this.writes.push(writeFor.create(ref, data));
    return this;
  }
  update(ref: DocumentReference, data: Record<string, Json>) {
    this.writes.push(writeFor.update(ref, data));
    return this;
  }
  delete(ref: DocumentReference) {
    this.writes.push(writeFor.delete(ref));
    return this;
  }
}

const firestores = new Map<string, Firestore>();
export const getFirestore = (app: App = apps[0], databaseId = '(default)') => {
  const key = `${app.projectId}/${databaseId}`;
  let db = firestores.get(key);
  if (!db || db.app !== app) firestores.set(key, (db = new Firestore(app, databaseId)));
  return db;
};

// ---------- Storage ----------
// Only what the server needs: deleting every file under a folder (a deleted customer's photos), through the
// Cloud Storage JSON API. Same shape as firebase-admin's getStorage().bucket(name).deleteFiles({ prefix }).
export const getStorage = (app: App = apps[0]) => ({
  bucket: (name: string) => ({
    // Up to `max` files (name and size) under a folder; `truncated` when there were more.
    async listFiles({ prefix, max = 5000 }: { prefix: string; max?: number }) {
      const base = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(name)}/o`;
      const headers = { Authorization: `Bearer ${await accessToken(app)}` };
      const files: { name: string; size: number }[] = [];
      let page = '';
      do {
        const res = await fetch(`${base}?${prefix ? `prefix=${encodeURIComponent(prefix)}&` : ''}fields=items(name,size),nextPageToken${page ? `&pageToken=${encodeURIComponent(page)}` : ''}`, { headers });
        if (!res.ok) throw new Error(`storage list ${res.status}`);
        const data = (await res.json()) as { items?: { name: string; size?: string }[]; nextPageToken?: string };
        for (const item of data.items || []) files.push({ name: item.name, size: Number(item.size) || 0 });
        page = data.nextPageToken || '';
      } while (page && files.length < max);
      return { files: files.slice(0, max), truncated: !!page };
    },
    async deleteFiles({ prefix }: { prefix: string }) {
      const base = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(name)}/o`;
      const headers = { Authorization: `Bearer ${await accessToken(app)}` };
      let page = '';
      do {
        const res = await fetch(`${base}?prefix=${encodeURIComponent(prefix)}&fields=items(name),nextPageToken${page ? `&pageToken=${encodeURIComponent(page)}` : ''}`, { headers });
        if (!res.ok) throw new Error(`storage list ${res.status}`);
        const data = (await res.json()) as { items?: { name: string }[]; nextPageToken?: string };
        for (const item of data.items || []) await fetch(`${base}/${encodeURIComponent(item.name)}`, { method: 'DELETE', headers });
        page = data.nextPageToken || '';
      } while (page);
    },
  }),
});

// ---------- Auth ----------

export type UserRecord = {
  uid: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  disabled: boolean;
  metadata: { creationTime: string; lastSignInTime: string; lastRefreshTime?: string | null };
  providerData: { providerId: string; uid: string; email?: string; displayName?: string }[];
  customClaims?: Record<string, Json>;
};
export type DecodedIdToken = { uid: string; sub: string; email?: string; email_verified?: boolean; name?: string; aud: string; iss: string; exp: number; iat: number; auth_time: number; firebase: Json; [k: string]: Json };

const utc = (ms?: string | number | null) => (ms ? new Date(typeof ms === 'string' && !/^\d+$/.test(ms) ? Date.parse(ms) : Number(ms)).toUTCString() : '');
const toUser = (u: Json): UserRecord => ({
  uid: u.localId,
  email: u.email,
  emailVerified: !!u.emailVerified,
  displayName: u.displayName,
  photoURL: u.photoUrl,
  phoneNumber: u.phoneNumber,
  disabled: !!u.disabled,
  metadata: { creationTime: utc(u.createdAt), lastSignInTime: utc(u.lastLoginAt), lastRefreshTime: u.lastRefreshAt ? utc(u.lastRefreshAt) : null },
  providerData: (u.providerUserInfo || []).map((p: Json) => ({ providerId: p.providerId, uid: p.rawId, email: p.email, displayName: p.displayName })),
  customClaims: u.customAttributes ? JSON.parse(u.customAttributes) : undefined,
});
const authError = (code: string, message: string) => Object.assign(new Error(message), { code: `auth/${code}` });

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let jwks: { keys: Map<string, Promise<CryptoKey>>; until: number } | null = null;
const signingKey = async (kid: string) => {
  if (!jwks || jwks.until < Date.now() || !jwks.keys.has(kid)) {
    const res = await fetch(JWKS_URL);
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
    const body = (await res.json()) as { keys: (JsonWebKey & { kid: string })[] };
    jwks = { until: Date.now() + maxAge * 1000, keys: new Map(body.keys.map((k) => [k.kid, crypto.subtle.importKey('jwk', k, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])])) };
  }
  const key = jwks.keys.get(kid);
  if (!key) throw authError('argument-error', 'ID token has an unknown key id');
  return key;
};

export class Auth {
  readonly base: string;
  constructor(readonly app: App) {
    const emulator = env('FIREBASE_AUTH_EMULATOR_HOST');
    this.base = `${emulator ? `http://${emulator}/identitytoolkit.googleapis.com` : 'https://identitytoolkit.googleapis.com'}/v1/projects/${app.projectId}`;
  }
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    const parts = typeof idToken === 'string' ? idToken.split('.') : [];
    if (parts.length !== 3) throw authError('argument-error', 'ID token is not a JWT');
    let header: Json, payload: Json;
    try {
      header = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
      payload = JSON.parse(new TextDecoder().decode(fromB64url(parts[1])));
    } catch {
      throw authError('argument-error', 'ID token could not be decoded');
    }
    const projectId = this.app.projectId;
    const now = Math.floor(Date.now() / 1000);
    if (!env('FIREBASE_AUTH_EMULATOR_HOST')) {
      if (header.alg !== 'RS256') throw authError('argument-error', 'ID token has the wrong algorithm');
      const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', await signingKey(header.kid), fromB64url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
      if (!ok) throw authError('argument-error', 'ID token has an invalid signature');
    }
    if (payload.aud !== projectId) throw authError('argument-error', 'ID token has the wrong audience');
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw authError('argument-error', 'ID token has the wrong issuer');
    if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) throw authError('argument-error', 'ID token has no subject');
    if (!(payload.exp > now)) throw authError('id-token-expired', 'ID token has expired');
    if (payload.iat > now + 300 || payload.auth_time > now + 300) throw authError('argument-error', 'ID token was issued in the future');
    return { ...payload, uid: payload.sub };
  }
  private async lookup(body: Json): Promise<UserRecord[]> {
    const data = await call(this.app, `${this.base}/accounts:lookup`, { body });
    return (data.users || []).map(toUser);
  }
  async getUser(uid: string) {
    const [user] = await this.lookup({ localId: [uid] });
    if (!user) throw authError('user-not-found', `No user ${uid}`);
    return user;
  }
  async getUserByEmail(email: string) {
    const [user] = await this.lookup({ email: [email] });
    if (!user) throw authError('user-not-found', `No user with email ${email}`);
    return user;
  }
  async getUsers(identifiers: { uid: string }[]) {
    const users: UserRecord[] = [];
    for (let i = 0; i < identifiers.length; i += 100) users.push(...(await this.lookup({ localId: identifiers.slice(i, i + 100).map((x) => x.uid) })));
    const found = new Set(users.map((u) => u.uid));
    return { users, notFound: identifiers.filter((x) => !found.has(x.uid)) };
  }
  async listUsers(maxResults = 1000, pageToken?: string) {
    const q = new URLSearchParams({ maxResults: String(maxResults) });
    if (pageToken) q.set('nextPageToken', pageToken);
    const data = await call(this.app, `${this.base}/accounts:batchGet?${q}`);
    return { users: (data.users || []).map(toUser) as UserRecord[], pageToken: (data.nextPageToken as string | undefined) || undefined };
  }
  async updateUser(uid: string, props: { disabled?: boolean; emailVerified?: boolean; displayName?: string; email?: string; password?: string }) {
    const body: Json = { localId: uid };
    if (props.disabled !== undefined) body.disableUser = props.disabled;
    if (props.emailVerified !== undefined) body.emailVerified = props.emailVerified;
    if (props.displayName !== undefined) body.displayName = props.displayName;
    if (props.email !== undefined) body.email = props.email;
    if (props.password !== undefined) body.password = props.password;
    await call(this.app, `${this.base}/accounts:update`, { body });
    return this.getUser(uid);
  }
  async revokeRefreshTokens(uid: string) {
    await call(this.app, `${this.base}/accounts:update`, { body: { localId: uid, validSince: String(Math.floor(Date.now() / 1000)) } });
  }
}

const auths = new WeakMap<App, Auth>();
export const getAuth = (app: App = apps[0]) => {
  let auth = auths.get(app);
  if (!auth) auths.set(app, (auth = new Auth(app)));
  return auth;
};
