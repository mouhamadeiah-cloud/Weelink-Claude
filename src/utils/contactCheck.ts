// A slide in the designers' gallery carries no contact details: the designer and the customer meet
// through Weelink, after the payment (Eyad, 14 Oct). This finds phone numbers, emails, links and
// handles in the slide's texts and links before it is exported. It reads text only; a number inside
// a picture is for the platform's review to catch.
import type { CanvasElement } from '../types';

export interface ContactFinding {
  elementName: string;
  kind: 'phone' | 'email' | 'link' | 'handle';
}

export const CONTACT_KIND_LABEL: Record<ContactFinding['kind'], string> = {
  phone: 'رقم هاتف',
  email: 'بريد إلكتروني',
  link: 'رابط',
  handle: 'اسم حساب (@)',
};

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;
const toLatinDigits = (s: string) =>
  s.replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) >= 0x06f0 ? d.charCodeAt(0) - 0x06f0 : d.charCodeAt(0) - 0x0660));

const stripTags = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');

const EMAIL = /[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\.[a-z]{2,}/i;
const URL_LIKE = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|de|sy|info|io|me|app|co|tv|shop|store|ly|link|site|online)\b/i;
const HANDLE = /(^|\s)@[a-z0-9_.]{3,}/i;
// Seven or more digits, with the spaces, dashes, dots, brackets and + that phone numbers are written with.
const PHONE = /(\+|00)?[\d][\d\s().-]{5,}\d/;

const kindsIn = (raw: string): ContactFinding['kind'][] => {
  const text = toLatinDigits(stripTags(raw));
  const found: ContactFinding['kind'][] = [];
  if (EMAIL.test(text)) found.push('email');
  if (URL_LIKE.test(text.replace(EMAIL, ' '))) found.push('link');
  if (HANDLE.test(text.replace(EMAIL, ' '))) found.push('handle');
  const digits = text.match(PHONE)?.[0].replace(/\D/g, '') || '';
  if (digits.length >= 7) found.push('phone');
  return found;
};

// A link on an element that leaves the page (tel:, mailto:, wa.me, http...) is contact too.
const externalLink = (url: string) => /^(tel:|mailto:|sms:|https?:|www\.|wa\.me|whatsapp:)/i.test(url.trim());

export const findContactInfo = (elements: CanvasElement[]): ContactFinding[] => {
  const out: ContactFinding[] = [];
  for (const el of elements) {
    const name = el.name || el.type;
    if (typeof el.content === 'string' && el.type !== 'image' && el.type !== 'video') {
      for (const kind of kindsIn(el.content)) out.push({ elementName: name, kind });
    }
    if (typeof el.linkUrl === 'string' && externalLink(el.linkUrl)) out.push({ elementName: name, kind: 'link' });
  }
  return out;
};
