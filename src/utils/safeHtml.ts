// What a page may carry from someone else's hand. A designer's slide or page reaches other people's
// sessions (the gallery, the admin's review, a customer's page opened with the 3-day code), so the
// «حاوية HTML» element and the links on elements may never run script there.
import DOMPurify from 'dompurify';

// The HTML container: markup and inline styles only. No script, no event handlers, no frames or forms,
// no javascript: links.
export const cleanHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'meta', 'link', 'base', 'style'],
    FORBID_ATTR: ['srcdoc', 'formaction'],
    ALLOW_DATA_ATTR: false,
  });

// A link an element may open: a web page, a mail or phone link, or WhatsApp/Telegram. Anything else
// (javascript:, data:, file: …) is refused.
export const isSafeUrl = (url: string | undefined): boolean => !!url && /^(https?:\/\/|mailto:|tel:|sms:|whatsapp:|tg:)/i.test(url.trim());

// An element type that may not travel in a gallery slide or be saved into a customer's page by a designer.
export const SCRIPTABLE_TYPES = ['html'];
