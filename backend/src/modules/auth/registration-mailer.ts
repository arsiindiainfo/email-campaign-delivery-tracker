// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
const SYSTEM_FROM_EMAIL = 'noreply@arsiindiainfo.com';
const SYSTEM_FROM_NAME = 'Email Campaign Tracker Demo';
// Hosted on arsiindiainfo.com's own proven-working HTTPS, independent of
// this demo's own cert status — reliable regardless of demo1's setup state.
const LOGO_URL = 'https://www.arsiindiainfo.com/assets/images/logo-horizontal.png';

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
            <td align="center" style="background:#1e1b4b;padding:24px 32px;">
              <img src="${LOGO_URL}" alt="Arsi India Info" width="160" style="display:block;margin:0 auto 8px;">
              <div style="color:#a5b4fc;font-size:12px;">Email Campaign &amp; Delivery Tracking Platform &mdash; Public Demo</div>
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

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildOwnerNotificationEmail(params: {
  name: string;
  email: string;
  organizationName: string;
}): { html: string; text: string } {
  const name = escapeHtml(params.name);
  const email = escapeHtml(params.email);
  const org = escapeHtml(params.organizationName);
  const html = wrapEmail(`
    <h1 style="margin:0 0 12px;font-size:18px;color:#111827;">New demo registration</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#6b7280;width:110px;">Name</td><td style="padding:6px 0;color:#111827;font-weight:600;">${name}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;color:#111827;font-weight:600;">${email}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Organization</td><td style="padding:6px 0;color:#111827;font-weight:600;">${org}</td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Automated notice from the public demo at demo1.arsiindiainfo.com.</p>
  `);
  return { html, text: stripHtml(html) };
}

function demoCard(params: {
  number: string;
  accent: string;
  title: string;
  category: string;
  description: string;
  url: string;
}): string {
  return `
    <tr>
      <td style="padding:17px 18px;border:1px solid #e5ebf3;border-radius:12px;background:#fbfdff;">
        <div style="font-size:13px;font-weight:800;color:${params.accent};">${params.number}</div>
        <div style="margin-top:5px;font-size:16px;font-weight:700;color:#182b49;">
          ${params.title}
        </div>
        <div style="margin-top:5px;font-size:11px;font-weight:700;letter-spacing:.2px;color:${params.accent};">
          ${params.category}
        </div>
        <div style="margin-top:7px;font-size:13px;line-height:1.55;color:#718096;">
          ${params.description}
        </div>
        <a href="${params.url}" style="display:inline-block;margin-top:10px;color:#1769e8;font-size:13px;font-weight:700;text-decoration:none;">
          View Live Demo →
        </a>
      </td>
    </tr>
    <tr><td height="10" style="font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

export function buildVerificationEmail(params: {
  name: string;
  verifyUrl: string;
}): { html: string; text: string } {
  const name = escapeHtml(params.name);
  const verifyUrl = escapeHtml(params.verifyUrl);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Arsi India Info Demo Account</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#14213d;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Verify your Arsi India Info demo account and explore three practical business software platforms.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f7fb;">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
               style="max-width:680px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(31,59,93,.08);">

          <!-- Header -->
          <tr>
            <td style="padding:28px 36px;border-bottom:1px solid #edf1f7;background:#ffffff;">
              <img src="${LOGO_URL}" alt="Arsi India Info" width="360"
                   style="display:block;width:360px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:42px 36px 30px;background:linear-gradient(135deg,#eef6ff 0%,#ffffff 58%,#f3f8ff 100%);">
              <div style="display:inline-block;padding:9px 14px;border-radius:30px;background:#e7f1ff;color:#1769d2;font-size:12px;font-weight:700;">
                ACCOUNT VERIFICATION
              </div>

              <h1 style="margin:18px 0 12px;font-size:30px;line-height:1.2;color:#102a56;">
                Welcome to Arsi India Info
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#52627a;">
                Hi ${name},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#52627a;">
                Thank you for registering for the Email Campaign &amp; Delivery Tracking Platform demo.
                Please verify your email address to activate your account and continue.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius:10px;background:#1769e8;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;padding:15px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">
                      Verify My Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#8492a6;">
                For security, this verification link is intended only for the email address used during registration.
                The link expires in 24 hours.
              </p>
              <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:#8492a6;word-break:break-all;">
                Or paste this link into your browser: ${verifyUrl}
              </p>
            </td>
          </tr>

          <!-- Public demo limits -->
          <tr>
            <td style="padding:26px 36px 6px;">
              <div style="padding:18px 20px;border:1px solid #e5ebf3;border-radius:12px;background:#fbfdff;">
                <div style="font-size:13px;font-weight:800;color:#1769e8;margin-bottom:8px;">
                  ABOUT THIS PUBLIC DEMO
                </div>
                <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:#66758b;">
                  This demo sends real email through a shared account, so a few limits keep it safe for everyone:
                </p>
                <ul style="margin:0 0 10px;padding-left:18px;font-size:13px;line-height:1.8;color:#66758b;">
                  <li><strong style="color:#14213d;">Maximum 5 recipients per send</strong> &mdash; one campaign or test send can target at most 5 people at a time.</li>
                  <li><strong style="color:#14213d;">Maximum 20 emails per 30 minutes</strong> &mdash; a short-term cap across all your sends combined.</li>
                  <li><strong style="color:#14213d;">Emails can only be sent to seeded/demo recipients or pre-approved real test addresses</strong> &mdash; newly imported contacts of your own won't actually receive mail until an admin approves them.</li>
                </ul>
                <p style="margin:0;font-size:13px;line-height:1.7;color:#66758b;">
                  Want a real address approved for testing? Reply to this email or reach out at
                  <a href="mailto:arsi.india.info@gmail.com" style="color:#1769e8;text-decoration:none;">arsi.india.info@gmail.com</a>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Demo introduction -->
          <tr>
            <td style="padding:30px 36px 10px;">
              <h2 style="margin:0 0 10px;font-size:21px;color:#14213d;">
                Explore our live demos
              </h2>
              <p style="margin:0 0 22px;font-size:14px;line-height:1.7;color:#66758b;">
                These three demo applications showcase practical SaaS, marketing automation and secure cloud solutions. They are created and maintained by
                <strong style="color:#14213d;">Rajib Majumder</strong> of Arsi India Info
                to demonstrate practical business software solutions.
              </p>
            </td>
          </tr>

          <!-- Demo cards -->
          <tr>
            <td style="padding:0 36px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${demoCard({
                  number: 'DEMO 01',
                  accent: '#1769e8',
                  title: 'React + PHP SaaS CRM',
                  category: 'CRM &middot; SaaS &middot; Business Application',
                  description:
                    'A small-business CRM for companies, contacts, leads, conversion workflows, deal pipelines, tasks, activity timelines, dashboards and reports &mdash; built with React, PHP CodeIgniter 4 and MySQL.',
                  url: 'https://demo.arsiindiainfo.com/',
                })}
                ${demoCard({
                  number: 'DEMO 02',
                  accent: '#16a36a',
                  title: 'Email Campaign &amp; Delivery Tracking Platform',
                  category: 'Marketing Automation &middot; Email &middot; Cloud',
                  description:
                    'A campaign delivery and tracking platform covering contact lists, templates, a multi-step campaign wizard, queued delivery, suppressions and delivery/click tracking &mdash; built with React, NestJS and MongoDB.',
                  url: 'https://demo1.arsiindiainfo.com/',
                })}
                ${demoCard({
                  number: 'DEMO 03',
                  accent: '#8b55d9',
                  title: 'Secure Cloud Document Manager',
                  category: 'Cloud &middot; Document Management &middot; Security',
                  description:
                    'A Dropbox-style business document manager with folders, versioned documents, internal permission grants, expiring external share links and private, signed-URL S3 storage &mdash; built with React, PHP CodeIgniter 4 and MySQL.',
                  url: 'https://demo2.arsiindiainfo.com/',
                })}
              </table>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding:30px 36px;background:#f7faff;border-top:1px solid #e9eff7;">
              <h2 style="margin:0 0 9px;font-size:20px;color:#14213d;">
                Need a portal or eCommerce solution?
              </h2>

              <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#66758b;">
                Rajib Majumder / Arsi India Info can help with custom business portals,
                SaaS applications, eCommerce websites, integrations, APIs and ongoing technical support.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:8px;">
                    <a href="mailto:arsi.india.info@gmail.com"
                       style="display:inline-block;padding:11px 14px;border:1px solid #dbe5f2;border-radius:8px;background:#ffffff;color:#1769e8;text-decoration:none;font-size:13px;font-weight:700;">
                      Email Support
                    </a>
                  </td>
                  <td style="padding-right:8px;">
                    <a href="https://wa.me/919433796101"
                       style="display:inline-block;padding:11px 14px;border:1px solid #dbe5f2;border-radius:8px;background:#ffffff;color:#159447;text-decoration:none;font-size:13px;font-weight:700;">
                      WhatsApp
                    </a>
                  </td>
                  <td>
                    <a href="https://www.upwork.com/freelancers/~0172bf8ee328825a5a?mp_source=share"
                       style="display:inline-block;padding:11px 14px;border:1px solid #dbe5f2;border-radius:8px;background:#ffffff;color:#14a800;text-decoration:none;font-size:13px;font-weight:700;">
                      Hire on Upwork
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:17px 0 0;font-size:13px;line-height:1.6;color:#718096;">
                WhatsApp: <strong>+91 94337 96101</strong><br>
                Email: <a href="mailto:arsi.india.info@gmail.com" style="color:#1769e8;text-decoration:none;">arsi.india.info@gmail.com</a><br>
                Website: <a href="https://arsiindiainfo.com/contact" style="color:#1769e8;text-decoration:none;">Contact Arsi India Info</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px;text-align:center;background:#ffffff;">
              <p style="margin:0 0 8px;font-size:13px;color:#52627a;">
                Created by <strong>Rajib Majumder</strong> &middot; Arsi India Info
              </p>
              <p style="margin:0;font-size:11px;line-height:1.6;color:#9aa7b8;">
                This is an automated verification email. If you did not create this account,
                you can safely ignore this message.
              </p>
              <p style="margin:14px 0 0;font-size:11px;color:#a2adbb;">
                &copy; 2026 Arsi India Info. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { html, text: stripHtml(html) };
}

export { SYSTEM_FROM_EMAIL, SYSTEM_FROM_NAME };
