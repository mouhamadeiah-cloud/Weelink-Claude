// Editing a design that is already in the gallery, the browser's side (the server's is server/galleryEdit.ts). A designer
// edits a design of their own (Firebase sign-in, api/gallery); the admin edits any (the admin's session, handed to the
// editor tab by services/adminApi.openGalleryEditor, api/admin).
import type { User } from 'firebase/auth';
import { HANDOFF_KEY } from './adminApi';

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
