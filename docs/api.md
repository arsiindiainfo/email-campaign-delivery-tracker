# API Reference

The authoritative, always-current API reference is the generated Swagger UI
at **`/api/docs`** (non-production environments) — every DTO's validation
constraints are documented inline via `@ApiProperty`, so "Try it out" in
Swagger reflects the exact same rules the server enforces.

This file is a static index into that surface, organized the way the plan
document (`doc/plans/Email-Campaign-Delivery-Tracker-PLAN.html`) groups it.

| Area | Plan section | Base path |
|---|---|---|
| Auth & Users | §14 | `/api/v1/auth/*`, `/api/v1/users/*` |
| Organizations | §14, §22.8 | `/api/v1/organizations/*` |
| Campaigns & Templates | §15 | `/api/v1/campaigns/*`, `/api/v1/templates/*` |
| Recipient Lists & Contacts | §16 | `/api/v1/lists/*` |
| Suppressions | §20 | `/api/v1/suppressions/*` |
| Sending & Webhook Ingestion | §17 | `/api/v1/webhooks/ses` |
| Public Tracking & Unsubscribe | §18 | `/t/o/:token`, `/t/c/:token`, `/api/v1/unsubscribe/:token` |
| Analytics & Reporting | §19 | `/api/v1/analytics/*` |

## Conventions (§11–§13)

- All authenticated routes are prefixed `/api/v1`; the pixel/click-redirect
  routes are intentionally unversioned since they're embedded in
  already-sent emails.
- `Authorization: Bearer <accessToken>` on every route except
  `/auth/{login,register,refresh}` and the public tracking/webhook/unsubscribe
  routes.
- Every response is `{ success: true, data, meta? }` or
  `{ success: false, error: { code, message, details? } }` — see the error
  code catalog in §13 of the plan document, mirrored in
  `backend/src/shared/enums/error-code.enum.ts`.
- List endpoints share one pagination shape:
  `?page=1&limit=20&search=...&sort=...&direction=asc|desc`.
