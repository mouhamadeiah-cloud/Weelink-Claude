// Wee AI writing the page's texts: gathers the text elements of a page, asks the server function
// /api/write-texts (which holds the AI key) for new texts, and turns its answer into changes.
import { auth } from './firebase';
import type { CanvasElement, Slide } from '../types';

const TEXT_KINDS = ['heading', 'paragraph', 'button', 'badge'] as const;
type TextKind = (typeof TEXT_KINDS)[number];

export interface WeeAnswers {
  personalInfo?: { title?: string; fullName?: string };
  addressInfo?: { governorate?: string; city?: string; street?: string; details?: string };
  contactInfo?: { whatsapp?: string; phone?: string; facebook?: string; tiktok?: string };
  catalogInfo?: { category?: string; specialty?: string; customCategory?: string; customSpecialty?: string };
  aiAnswers?: { description?: string; motionEffects?: string; specialInstructions?: string };
}

const plain = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// What the owner told Wee AI, as the few facts the writer needs.
export const businessFacts = (a: WeeAnswers, siteName: string): Record<string, string> => {
  const p = a.personalInfo || {};
  const ad = a.addressInfo || {};
  const c = a.contactInfo || {};
  const cat = a.catalogInfo || {};
  const ai = a.aiAnswers || {};
  const facts: Record<string, string> = {
    اسم_الموقع: siteName,
    صاحب_العمل: [p.title, p.fullName].filter(Boolean).join(' '),
    التصنيف: cat.customCategory || cat.category || '',
    الاختصاص: cat.customSpecialty || cat.specialty || '',
    الوصف: ai.description || '',
    العنوان: [ad.governorate, ad.city, ad.street].filter(Boolean).join('، '),
    واتساب: c.whatsapp || '',
    هاتف: c.phone || '',
    طابع_الصفحة: ai.motionEffects || '',
    ملاحظات: ai.specialInstructions || '',
  };
  return Object.fromEntries(Object.entries(facts).filter(([, v]) => v && v.trim()));
};

// The text elements of the page's slides, in page order, with room for about as much text as now.
export const pageTextItems = (elements: CanvasElement[], slides: Slide[]) => {
  const order = new Map(slides.map((s, i) => [s.id, i]));
  return elements
    .filter((el) => (TEXT_KINDS as readonly string[]).includes(el.type) && el.slideId && order.has(el.slideId) && !el.isLocked)
    .sort((a, b) => order.get(a.slideId!)! - order.get(b.slideId!)! || a.y - b.y || b.x - a.x)
    .map((el) => {
      const current = plain(el.content || '');
      const kind = el.type as TextKind;
      const room = kind === 'button' || kind === 'badge' ? 24 : kind === 'heading' ? 60 : 220;
      return {
        id: el.id,
        kind,
        slide: slides.find((s) => s.id === el.slideId)?.name || '',
        current,
        maxChars: Math.max(room, Math.min(400, Math.round(current.length * 1.3))),
      };
    });
};

export type WriteResult = { ok: true; texts: { id: string; text: string }[] } | { ok: false; message: string };

export const requestPageTexts = async (facts: Record<string, string>, items: ReturnType<typeof pageTextItems>): Promise<WriteResult> => {
  const user = auth.currentUser;
  if (!user) return { ok: false, message: 'سجّل الدخول أولاً حتى يكتب Wee AI نصوصك.' };
  try {
    const res = await fetch('/api/write-texts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ info: facts, items }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.texts)) return { ok: true, texts: data.texts };
    if (data.error === 'not_configured') return { ok: false, message: 'Wee AI غير مفعّل بعد على الخادم (ينقصه مفتاح الذكاء الاصطناعي).' };
    if (res.status === 401) return { ok: false, message: 'انتهت جلسة الدخول. سجّل الدخول من جديد وجرّب مرة ثانية.' };
    return { ok: false, message: 'ما قدر Wee AI يكتب النصوص هالمرة. جرّب بعد شوي.' };
  } catch {
    return { ok: false, message: 'ما في اتصال بالإنترنت أو الخادم ما رد. جرّب بعد شوي.' };
  }
};

// Puts the new texts in their elements (shown as plain text); everything else about each element stays.
export const applyPageTexts = (elements: CanvasElement[], texts: { id: string; text: string }[]) => {
  const byId = new Map(texts.map((t) => [t.id, t.text]));
  let changed = 0;
  const next = elements.map((el) => {
    const text = byId.get(el.id);
    if (!text) return el;
    changed++;
    return { ...el, content: text };
  });
  return { next, changed };
};
