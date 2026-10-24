// Editing a design that is already in the gallery, the browser's side (the server's is server/galleryEdit.ts). A designer
// edits a design of their own (Firebase sign-in, api/gallery); the admin edits any (the admin's session, handed to the
// editor tab by services/adminApi.openGalleryEditor, api/admin).
import type { User } from 'firebase/auth';
import { signInWithCustomToken } from 'firebase/auth';
import { HANDOFF_KEY } from './adminApi';
import { auth } from './firebase';

export interface EditableDesign {
  id: string;
  kind: 'slide' | 'page';
  name: string;
  category: string;
  status: string;
  designerName: string;
  slide: any;
  page: any;
  elements: any[];
}

class EditError extends Error {
  constructor(public code: string, public kinds: string[] = []) {
    super(code);
  }
}

const post = async (url: string, headers: Record<string, string>, body: Record<string, unknown>) => {
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  } catch {
    throw new EditError('network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new EditError(String(data.error || 'failed'), Array.isArray(data.kinds) ? data.kinds : []);
  return data;
};

const designerCall = async (user: User, body: Record<string, unknown>) => post('/api/gallery', { Authorization: `Bearer ${await user.getIdToken()}` }, body);
const adminCall = (token: string, body: Record<string, unknown>) => post('/api/admin', { Authorization: `Bearer ${token}` }, body);

export const designerEditOpen = async (user: User, id: string) => (await designerCall(user, { action: 'edit-open', id })) as { design: EditableDesign; pendingEdit: boolean; editRejected: string };
export const designerEditSave = async (user: User, id: string, d: { page: any; elements: any[] }) => (await designerCall(user, { action: 'edit-save', id, ...d })) as { ok: true; mode: 'review' | 'direct' };
export const adminEditOpen = async (token: string, id: string) => (await adminCall(token, { action: 'gallery-doc', id })) as { design: EditableDesign; pendingEdit: boolean };
export const adminEditSave = async (token: string, id: string, d: { page: any; elements: any[] }) => (await adminCall(token, { action: 'gallery-doc-save', id, ...d })) as { ok: true };

// The admin's ready slides (server/readySlides.ts): opened and saved the same way; a new one has no id until its first save.
export interface ReadySaved { ok: true; id: string; category: string; eligible: boolean; slots: number; problems: string[] }
export const readyEditOpen = async (token: string, id: string) => (await adminCall(token, { action: 'ready-doc', id })) as { design: { id: string; name: string; category: string; slide: any; elements: any[] } };
export const readyEditSave = async (token: string, id: string, d: { page: any; elements: any[]; name: string; category: string }) => (await adminCall(token, { action: 'ready-doc-save', id, ...d })) as ReadySaved;

// Reads what the admin site left for this tab without taking it.
const peekAdminHandoff = (): string => {
  try {
    const frag = /^#h=(.+)$/.exec(window.location.hash)?.[1];
    const raw = frag ? decodeURIComponent(frag) : localStorage.getItem(HANDOFF_KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v.token === 'string' && Date.now() - Number(v.at) < 120_000 ? v.token : '';
  } catch {
    return '';
  }
};

// The admin's editor tab signs in to Firebase as the admin (an account of his own, no email), so nothing of the customers
// signed in on the same browser is opened, read or saved by it. The tab's login lives in memory (services/firebase).
// The editor waits for this before it listens to the sign-in state.
export const adminEditorReady: Promise<void> =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('edit-gallery')
    ? (async () => {
        try {
          const token = peekAdminHandoff();
          if (!token) return;
          const { customToken } = (await adminCall(token, { action: 'editor-token' })) as { customToken?: string };
          if (customToken) await signInWithCustomToken(auth, customToken);
        } catch {
          /* the editor then opens without an account and says what is missing */
        }
      })()
    : Promise.resolve();

// What the admin site left for this tab (once, and only if it is fresh).
export const takeAdminHandoff = (): { id: string; token: string } | null => {
  try {
    const frag = /^#h=(.+)$/.exec(window.location.hash)?.[1];
    if (frag) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    let raw: string | null = frag ? decodeURIComponent(frag) : null;
    if (!raw) raw = localStorage.getItem(HANDOFF_KEY);
    localStorage.removeItem(HANDOFF_KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v.id === 'string' && typeof v.token === 'string' && v.token && Date.now() - Number(v.at) < 120_000 ? { id: v.id, token: v.token } : null;
  } catch {
    return null;
  }
};

export const editErrorText = (e: unknown) => {
  const code = e instanceof EditError ? e.code : 'network';
  const kinds: Record<string, string> = { phone: 'رقم هاتف', email: 'بريد إلكتروني', link: 'رابط', handle: 'اسم حساب' };
  const map: Record<string, string> = {
    unverified: 'أكّد بريدك الإلكتروني أولاً.',
    unauthorized: 'انتهت الجلسة. سجّل دخولك من جديد.',
    session: 'انتهت جلسة الإدارة. افتح الإدارة وسجّل دخولك ثم اضغط تعديل من جديد.',
    not_found: 'هذا التصميم لم يعد موجوداً.',
    html_not_allowed: 'حاوية HTML غير مسموحة في المعرض. احذفها ثم احفظ.',
    unsafe_link: 'فيه رابط غير آمن. اجعل الروابط http أو https أو بريد أو هاتف.',
    too_many_slides: 'الصفحة أكثر من ثلاث شرائح.',
    too_many_elements: 'عناصر كثيرة. خفّف التصميم.',
    too_big: 'التصميم أكبر من أن يُحفظ.',
    bad_request: 'تعذّر حفظ التصميم بهذا الشكل.',
  };
  if (code === 'contact') return `فيه بيانات تواصل (${(e as EditError).kinds.map((k) => kinds[k] || k).join('، ')}). ممنوعة في المعرض.`;
  return map[code] || 'تعذّر الحفظ. تأكد من اتصالك وجرّب مرة ثانية.';
};
