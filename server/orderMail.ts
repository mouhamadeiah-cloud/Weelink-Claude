// The emails of a design order (hiring a designer): who is told what. Shared by api/design-orders.ts,
// api/design-access.ts and api/admin.ts (the file starts with «_», so Vercel does not make it a route).
// A mail never carries a phone number, email or link of the other side, only that something happened and
// where to look («طلبات التصميم»). A failed or skipped mail never fails the action (EMAIL_FROM and
// RESEND_API_KEY missing = nothing is sent). DESIGN_ALERT_EMAIL is the office's own address for complaints
// that waited too long.
import { Resend } from 'resend';

export type OrderEvent =
  | 'paid' | 'new_message' | 'delivered' | 'confirmed' | 'auto_confirmed' | 'disputed'
  | 'paid_out' | 'refunded' | 'cancelled_unpaid' | 'confirm_reminder' | 'access_code';

const TEXT: Record<OrderEvent, { subject: string; line: string }> = {
  paid: { subject: 'طلب تصميم جديد مدفوع', line: 'دفع زبون طلب تصميم وأكّد المكتب استلام المبلغ. يمكنك الآن بدء العمل والتواصل معه داخل الطلب.' },
  new_message: { subject: 'رسالة جديدة في طلب التصميم', line: 'وصلتك رسالة جديدة في أحد طلبات التصميم.' },
  delivered: { subject: 'سلّم المصمم عملك', line: 'سلّم المصمم تصميم صفحتك. راجعه ثم اضغط «استلمت التصميم»، أو افتح شكوى إن كان فيه ما يحتاج حلاً.' },
  confirmed: { subject: 'أكّد الزبون استلام التصميم', line: 'أكّد الزبون استلام التصميم. سيحوّل المكتب حصتك قريباً.' },
  auto_confirmed: { subject: 'اعتُبر طلب التصميم مستلَماً', line: 'مرّت المدة المحددة على التسليم دون ردّ، فاعتُبر الطلب مستلَماً وسيحوّل المكتب حصة المصمم.' },
  disputed: { subject: 'شكوى على طلب تصميم', line: 'فتح الزبون شكوى على أحد طلباتك. سيراجعها فريق Weelink ويقرر.' },
  paid_out: { subject: 'حوّل المكتب حصتك', line: 'حوّل المكتب حصتك من طلب التصميم. اكتمل الطلب.' },
  refunded: { subject: 'استرداد طلب تصميم', line: 'ردّ المكتب مبلغ طلب التصميم للزبون وأُغلق الطلب.' },
  cancelled_unpaid: { subject: 'أُلغي طلب التصميم', line: 'أُلغي طلب التصميم لأنه لم يُدفع خلال المدة المحددة. يمكنك طلبه من جديد متى شئت.' },
  confirm_reminder: { subject: 'تذكير: ردّ على تسليم المصمم', line: 'سلّم المصمم عملك ولم تردّ بعد. إن لم تؤكد الاستلام أو تفتح شكوى قريباً سيُعتبر الطلب مستلَماً تلقائياً.' },
  access_code: { subject: 'أعطاك الزبون رمز دخول لصفحته', line: 'أعطاك الزبون رمز دخول لمدة 3 أيام لتعديل تصميم صفحته. اطلب الرمز منه داخل محادثة الطلب إن لم يصلك.' },
};

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const page = (line: string, orderId: string) => `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.8;color:#1d1d1f">
<p>${escape(line)}</p>
<p>رقم الطلب: <b dir="ltr">${escape(orderId.slice(0, 6).toUpperCase())}</b>. ادخل إلى Weelink ثم «طلبات التصميم».</p>
<p style="color:#86868b;font-size:12px">رسالة آلية من Weelink.</p></div>`;

// Tests set a tap to record mails instead of sending them (no loader tricks, so it behaves the same everywhere).
// The tap lives on globalThis so a second loaded copy of this module still sees it.
type Tap = ((entry: string) => void) | null;
const holder = globalThis as { __mailTap?: Tap };
export const setMailTap = (fn: Tap) => { holder.__mailTap = fn; };

// Mails the person behind `uid`. `auth` is firebase-admin's Auth. Never throws.
export const mailOrder = async (auth: { getUser: (uid: string) => Promise<{ email?: string }> }, uid: string, event: OrderEvent, orderId: string): Promise<'sent' | 'skipped' | 'failed'> => {
  if (holder.__mailTap) { holder.__mailTap(`${uid}:${event}`); return 'sent'; }
  const from = process.env.EMAIL_FROM;
  const key = process.env.RESEND_API_KEY;
  if (!from || !key || !uid) return 'skipped';
  try {
    const to = (await auth.getUser(uid)).email;
    if (!to) return 'skipped';
    const { error } = await new Resend(key).emails.send({ from, to, subject: TEXT[event].subject, html: page(TEXT[event].line, orderId) });
    if (error) {
      console.error('order mail refused:', error.message);
      return 'failed';
    }
    return 'sent';
  } catch (e) {
    console.error('order mail failed:', e);
    return 'failed';
  }
};

// The office's own alert for a complaint that waited too long.
export const mailOffice = async (orderId: string, text: string): Promise<void> => {
  if (holder.__mailTap) { holder.__mailTap(`office:${orderId}`); return; }
  const from = process.env.EMAIL_FROM;
  const key = process.env.RESEND_API_KEY;
  const to = process.env.DESIGN_ALERT_EMAIL;
  if (!from || !key || !to) return;
  try {
    await new Resend(key).emails.send({ from, to, subject: 'شكوى طلب تصميم متأخرة', html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif"><p>${escape(text)}</p><p>الطلب: <b dir="ltr">${escape(orderId.slice(0, 6).toUpperCase())}</b></p></div>` });
  } catch (e) {
    console.error('office mail failed:', e);
  }
};
