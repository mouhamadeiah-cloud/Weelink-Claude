// Arabic-insensitive text for Weelink's search index and its queries: no diacritics or tatweel, one
// alef, ya and ha, lower case, single spaces. The same function indexes and queries, so they agree.
export const normalizeSearchText = (s: unknown): string =>
  (typeof s === 'string' ? s : '')
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
