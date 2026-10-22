// What «ابن صفحتي» does to the AI's words before they reach a page (api/build-page.ts and server/formBuild.ts share it): no emoji, no AI
// wording, no markdown marks, and no prices or figures the owner did not write.
export const MAX_FIELD = 1200;
export const ON_REQUEST = 'حسب الطلب';

export const clip = (v: unknown, n = MAX_FIELD) => (typeof v === 'string' ? v.slice(0, n) : '');

// Emoji and pictographs (constitution §4: no AI emoji slop), and the ✓ ★ kind of marks.
export const EMOJI = /[\p{Extended_Pictographic}☀-➿⬀-⯿️]/gu;
// AI meta wording (§4: no AI badges or texts).
export const AI_WORDS = /((?:بـ?|و)?(?:ال)?ذكاء\s*(?:ال)?اصطناعي|توليد ذكي|مصمم بالذكاء|AI\s*Design|Wee AI|\bAI\b|Gemini)/gi;

export const cleanText = (v: unknown, max: number) =>
  clip(v, 2000).replace(EMOJI, '').replace(AI_WORDS, '').replace(/[*_#`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max).trim();

export const digitsIn = (s: string) => (s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).match(/\d+/g) || []).map((d) => d.replace(/^0+(?=\d)/, ''));

// A price or figure is kept only when the owner wrote its numbers (§3 and «لا تخترع أرقاماً»).
export const ownersNumbers = (profile: Record<string, string>) => {
  const text = Object.values(profile).join(' ').replace(/[,،.]/g, '');
  return new Set(digitsIn(text));
};
export const numbersAreOwners = (value: string, owners: Set<string>) => {
  const found = digitsIn(value.replace(/[,،.]/g, ''));
  return found.length > 0 && found.every((d) => owners.has(d));
};
