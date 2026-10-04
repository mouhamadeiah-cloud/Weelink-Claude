// Vercel serverless function: sends an email through Resend.
// The Resend API key lives only in the Vercel environment variable RESEND_API_KEY — never in
// the frontend code, where every visitor could read it.
//
//   GET  /api/send-email  → a small test page with a "send test email" button
//   POST /api/send-email  → sends the test email
//
// The recipient is fixed here on the server, so this endpoint cannot be used to send mail to
// arbitrary addresses. onboarding@resend.dev can only deliver to the Resend account owner's own
// address; sending to customers needs a verified domain in Resend.

import { Resend } from 'resend';

const OWNER_EMAIL = 'mouhamadeiah@googlemail.com';

const TEST_PAGE = `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>اختبار البريد</title></head>
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#FBF6EF">
  <div style="text-align:center">
    <button id="send" style="padding:14px 28px;border:0;border-radius:999px;background:#B4532A;color:#fff;font-size:16px;cursor:pointer">إرسال رسالة تجريبية</button>
    <p id="out" style="margin-top:16px;color:#5A4C42"></p>
  </div>
  <script>
    document.getElementById('send').onclick = async () => {
      const out = document.getElementById('out');
      out.textContent = 'جارٍ الإرسال...';
      const res = await fetch(location.pathname, { method: 'POST' });
      const data = await res.json();
      out.textContent = res.ok ? 'تم الإرسال ✓ تحقق من بريدك' : 'فشل الإرسال: ' + data.error;
    };
  </script>
</body>
</html>`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'GET') {
      return new Response(TEST_PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return json({ error: 'RESEND_API_KEY is not set in the Vercel environment variables' }, 500);
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: OWNER_EMAIL,
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
    });

    if (error) {
      return json({ error: error.message }, 502);
    }
    return json({ id: data?.id });
  },
};
