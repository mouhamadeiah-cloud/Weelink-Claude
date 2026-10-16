// Letting the hired designer into the customer's page, the browser's side (the server's is
// api/design-access.ts). The customer makes a code that works for three days; the designer opens the
// page with it, edits it in the editor and saves. Only the page's design goes through; see the server
// file for what the designer can never reach.
import type { User } from 'firebase/auth';

class AccessError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

const call = async <T,>(user: User, body: Record<string, unknown>): Promise<T> => {
  let res: Response;
  try {
    res = await fetch('/api/design-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AccessError('network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AccessError(String(data.error || 'failed'));
  return data as T;
};

export const issueAccessCode = (user: User, id: string) => call<{ code: string; expiresAt: number }>(user, { action: 'issue', id });
export const revokeAccessCode = (user: User, id: string) => call<{ ok: true }>(user, { action: 'revoke', id });
export const accessStatus = (user: User, id: string) => call<{ active: boolean; expiresAt: number; saves: number; backupAt: number }>(user, { action: 'status', id });
export const activeAccess = (user: User) => call<{ rows: { id: string; designerName: string; expiresAt: number }[] }>(user, { action: 'active' });
export const restorePage = (user: User, id: string) => call<{ ok: true }>(user, { action: 'restore', id });
export const openClientPage = (user: User, id: string, code: string) => call<{ pages: any[]; elements: any[]; expiresAt: number }>(user, { action: 'open', id, code });
export const saveClientPage = (user: User, id: string, code: string, pages: unknown, elements: unknown) => call<{ ok: true }>(user, { action: 'save', id, code, pages, elements });

export const accessErrorText = (e: unknown) => {
  const code = e instanceof AccessError ? e.code : 'network';
  const map: Record<string, string> = {
    unverified: 'أكّد بريدك الإلكتروني أولاً.',
    wrong_code: 'الرمز غير صحيح.',
    locked: 'تكررت المحاولات الخاطئة. اطلب من الزبون رمزاً جديداً.',
    expired: 'انتهى الرمز أو سحبه الزبون. اطلب رمزاً جديداً.',
    bad_state: 'الرمز متاح فقط للطلبات المدفوعة قبل الاستلام.',
    no_page: 'لا توجد صفحة لدى الزبون بعد.',
    html_not_allowed: 'حاوية HTML غير مسموحة في صفحة الزبون. احذفها ثم احفظ.',
    in_use: 'سحب الرمز أولاً: لا يمكن استرجاع الصفحة والمصمم داخلها.',
    no_backup: 'لا توجد نسخة محفوظة.',
    too_big: 'الصفحة أكبر من أن تُحفظ.',
    too_many_saves: 'وصلت الحد الأقصى من الحفظ لهذا الرمز.',
  };
  return map[code] || 'تعذّر تنفيذ الطلب. تأكد من اتصالك وجرّب مرة ثانية.';
};
