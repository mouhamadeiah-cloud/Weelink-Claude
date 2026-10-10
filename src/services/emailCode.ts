// A new owner who signs up with email and password confirms the email with a 6-digit code sent by
// /api/email-code (Google accounts come already verified). Accounts made before VERIFY_SINCE are
// left as they are.
import { User } from 'firebase/auth';

const VERIFY_SINCE = Date.parse('2026-10-09T00:00:00Z');

export const needsEmailCode = (user: User, accountId: string) =>
  !user.emailVerified &&
  user.providerData.some((p) => p.providerId === 'password') &&
  Date.parse(user.metadata.creationTime || '') >= VERIFY_SINCE &&
  // An old account claimed on this sign-in is not a new registration.
  !accountId.startsWith('sim_');

export type EmailCodeError = 'too_soon' | 'too_many' | 'send_failed' | 'expired' | 'wrong_code' | 'too_many_attempts' | 'network';

export class EmailCodeProblem extends Error {
  constructor(public kind: EmailCodeError, public waitSeconds = 0, public attemptsLeft = 0, public detail = '') {
    super(kind);
  }
}

const call = async (user: User, body: object) => {
  let res: Response;
  try {
    res = await fetch('/api/email-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new EmailCodeProblem('network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const known: EmailCodeError[] = ['too_soon', 'too_many', 'send_failed', 'expired', 'wrong_code', 'too_many_attempts'];
    throw new EmailCodeProblem(known.includes(data.error) ? data.error : 'network', data.waitSeconds || 0, data.attemptsLeft || 0, typeof data.detail === 'string' ? data.detail : '');
  }
  return data as { sent?: boolean; skipped?: boolean; verified?: boolean };
};

// 'skipped' while the server has no email set up yet: the sign-up then goes on without a code.
export const sendEmailCode = async (user: User): Promise<'sent' | 'skipped' | 'verified'> => {
  const r = await call(user, { action: 'send' });
  return r.skipped ? 'skipped' : r.verified ? 'verified' : 'sent';
};

export const verifyEmailCode = async (user: User, code: string) => {
  await call(user, { action: 'verify', code });
  // Pick up emailVerified in the user and in the token the rules see.
  await user.reload();
  await user.getIdToken(true);
};

export const emailCodeErrorText = (e: unknown) => {
  const p = e instanceof EmailCodeProblem ? e : new EmailCodeProblem('network');
  if (p.kind === 'too_soon') return `انتظر ${p.waitSeconds} ثانية قبل طلب رمز جديد.`;
  if (p.kind === 'too_many') return 'طلبت رموزاً كثيرة اليوم. حاول غداً.';
  if (p.kind === 'send_failed') return `تعذر إرسال الرمز إلى هذا البريد. تأكد من كتابته بشكل صحيح.${p.detail ? ` (${p.detail})` : ''}`;
  if (p.kind === 'expired') return 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.';
  if (p.kind === 'wrong_code') return p.attemptsLeft > 0 ? `الرمز غير صحيح. بقيت ${p.attemptsLeft} محاولات.` : 'الرمز غير صحيح. اطلب رمزاً جديداً.';
  if (p.kind === 'too_many_attempts') return 'محاولات كثيرة خاطئة. اطلب رمزاً جديداً.';
  return 'تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.';
};
