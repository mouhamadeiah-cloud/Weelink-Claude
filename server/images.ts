// The photo store on Cloudflare R2 (Eyad, 18 Oct: every image on Cloudflare, text data in Firebase).
// The Worker hands its R2 binding over per request (worker/index.ts); handlers and the customer
// deletion in server/billing.ts reach it here. Without the binding (not created yet, Node, tests)
// `imagesBucket()` is null and uploads fall back to Firebase Storage on the client.

export interface ImagesBucket {
  put(key: string, value: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
  get(key: string, options?: { range?: { offset: number; length?: number } }): Promise<{ body: ReadableStream; size: number; httpEtag: string; httpMetadata?: { contentType?: string } } | null>;
  head(key: string): Promise<{ size: number; httpEtag: string; httpMetadata?: { contentType?: string } } | null>;
  list(options: { prefix: string; cursor?: string; limit?: number }): Promise<{ objects: { key: string }[]; truncated: boolean; cursor?: string }>;
  delete(keys: string | string[]): Promise<void>;
}

let bucket: ImagesBucket | null = null;
export const setImagesBucket = (b: ImagesBucket | null | undefined) => {
  bucket = b || null;
};
export const imagesBucket = () => bucket;

// Photo keys: users/{uid}/{folder}/{file}, or {folder}/{file} when nobody is signed in.
export const FOLDERS = ['images', 'backgrounds', 'gallery'];
export const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg' };
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// A deleted customer's photos (their whole users/{uid}/ prefix); resolves quietly without a bucket.
export const deleteUserImages = async (uid: string) => {
  if (!bucket) return;
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix: `users/${uid}/`, cursor, limit: 500 });
    if (page.objects.length) await bucket.delete(page.objects.map((o) => o.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
};
