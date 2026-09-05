// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
const SYSTEM_FROM_EMAIL = 'noreply@arsiindiainfo.com';
const SYSTEM_FROM_NAME = 'Email Campaign Tracker Demo';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapEmail(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Segoe UI,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:#1e1b4b;padding:24px 32px;">
              <span style="color:#ffffff;font-size:16px;font-weight:700;">Email Campaign & Delivery Tracking Platform</span>
              <div style="color:#a5b4fc;font-size:12px;margin-top:2px;">Public demo — arsiindiainfo.com</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildOwnerNotificationEmail(params: {
  name: string;
  email: string;
  organizationName: string;
}): string {
  const name = escapeHtml(params.name);
  const email = escapeHtml(params.email);
  const org = escapeHtml(params.organizationName);
  return wrapEmail(`
    <h1 style="margin:0 0 12px;font-size:18px;color:#111827;">New demo registration</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#6b7280;width:110px;">Name</td><td style="padding:6px 0;color:#111827;font-weight:600;">${name}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;color:#111827;font-weight:600;">${email}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Organization</td><td style="padding:6px 0;color:#111827;font-weight:600;">${org}</td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Automated notice from the public demo at demo1.arsiindiainfo.com.</p>
  `);
}

export function buildWelcomeAutoresponderEmail(params: { name: string }): string {
  const name = escapeHtml(params.name);
  return wrapEmail(`
    <h1 style="margin:0 0 12px;font-size:18px;color:#111827;">Welcome, ${name}!</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
      Your account on this public demo is ready. Since this demo sends real email through a shared account,
      a few limits keep it safe for everyone:
    </p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
      <li><strong>Maximum 5 recipients per send</strong> — one campaign or test send can target at most 5 people at a time.</li>
      <li><strong>Maximum 20 emails per 30 minutes</strong> — a short-term cap across all your sends combined.</li>
      <li><strong>Emails can only be sent to seeded/demo recipients or pre-approved real test addresses</strong> — newly imported contacts of your own won't actually receive mail unless they're on the approved list.</li>
    </ul>
    <p style="margin:0;font-size:13px;color:#6b7280;">
      Want a real address approved for testing? Reply to this email or reach out at
      <a href="mailto:arsi.india.info@gmail.com" style="color:#4f46e5;">arsi.india.info@gmail.com</a>.
    </p>
  `);
}

export { SYSTEM_FROM_EMAIL, SYSTEM_FROM_NAME };
