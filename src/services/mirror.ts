// Published pages read template photos and library videos from our own R2 store, not from Unsplash or
// the build folder (Eyad, 18 Oct: everything on Cloudflare). Every such link inside a page's content
// becomes /media?u=<link> (worker/media.ts), which copies the file into R2 on its first request.
// The page being edited keeps its original links; only the published copy is rewritten.
const LINK = /https:\/\/images\.unsplash\.com\/[^\s"')]+|(?<![\w/.:-])\/(?:bg-videos|graphics)\/[\w.-]+/g;

const mirrorString = (text: string) => text.replace(LINK, (link) => `/media?u=${encodeURIComponent(link)}`);

export const mirrorMedia = <T,>(value: T): T => {
  if (typeof value === 'string') return mirrorString(value) as T;
  if (Array.isArray(value)) return value.map(mirrorMedia) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, mirrorMedia(v)])) as T;
  }
  return value;
};
