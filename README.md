# Email Campaign & Delivery Tracking Platform

A production-style email marketing and delivery-analytics platform — campaign
authoring, recipient list management, queued sending, webhook-driven delivery
tracking (sent, delivered, opened, clicked, bounced, complained,
unsubscribed) and campaign analytics. Built with **NestJS**, **MongoDB**,
**React/TypeScript** and **AWS** (SES, SQS, S3, Lambda, CloudWatch).

Built and maintained by **[Arsi India Info](https://arsiindiainfo.com)** as a
portfolio project demonstrating backend engineering depth beyond CRUD: queue
processing, inbound webhook ingestion with signature verification, idempotent
event handling, and analytics rollups derived from an append-only event log.

> © 2026 Arsi India Info. Source code is MIT-licensed — see [LICENSE](LICENSE).
> The Arsi India Info name and logo are separately protected — see
> [TRADEMARK.md](TRADEMARK.md).

## What it demonstrates

- **Queue-based, at-least-once background processing** (SQS + worker process)
- **Inbound webhook ingestion** with HMAC signature verification and dedup
- **Idempotent event handling** — duplicate webhook delivery never double-counts
- **Append-only event log** as the source of truth for every analytics number
- **Optimistic locking** on campaign edits, **forward-only state machines** on
  a 9-state per-recipient delivery pipeline
- **Tenant isolation by construction** — every repository injects
  `organizationId` into its Mongo filter, not just a permission check

Scope is deliberately narrow where a demo doesn't need the breadth: one ESP
integration (Amazon SES, behind a provider-agnostic interface backed by SMTP/
Mailhog in every non-production environment), one org per workspace, and
synthetic seed data only — no real email is ever sent outside `production`.

## Architecture

```
React (SPA)
   │
   ▼
NestJS API ──┬── Campaign Service   (CRUD, schedule, stats read)
             ├── Sending Service    (builds send jobs, calls SES/SMTP)
             └── Webhook Service    (verifies signature, dedups, enqueues)
                    │                              │
                    ▼                              ▼
             SQS: send-queue                SQS: webhook-queue
                    │                              │
                    ▼                              ▼
             Worker process                  Worker process
             (calls EmailProvider)     (writes events, advances
                    │                   campaign_recipients + stats)
                    ▼                              │
             Amazon SES ──(bounce/complaint via SNS)──▶ webhook-queue
                    │
                    ▼
                MongoDB  ◀─────────────────────────┘
        (poison messages after 5 attempts → DLQ, alarmed via CloudWatch)
```

See `doc/plans/Email-Campaign-Delivery-Tracker-PLAN.html` for the full design
document (data model, API contract, screens, state machines).

## Quick start (Docker Compose — recommended)

```bash
git clone https://github.com/arsiindiainfo/email-campaign-delivery-tracker.git
cd email-campaign-delivery-tracker
docker compose -f infrastructure/docker-compose.yml up --build
```

This brings up MongoDB (single-node replica set, for transactions), Mailhog
(SMTP catcher — stand-in inbox), LocalStack (SQS/S3/SNS, no AWS account
needed), the API, the worker, and the React SPA.

Once it's up:

```bash
cd backend
npm run seed   # loads the fictional "NovaMail Retail Co." demo org
```

Then visit:

- **App**: http://localhost:5173 — sign in with `asha@novamail.demo` / `Str0ngPass!23`
- **API docs (Swagger)**: http://localhost:3000/api/docs
- **Mailhog inbox**: http://localhost:8025 — every "sent" email lands here

See [docs/portfolio-demo.md](docs/portfolio-demo.md) for a guided walkthrough.

## Running without Docker

See [docs/backend-setup.md](docs/backend-setup.md) and
[docs/frontend-setup.md](docs/frontend-setup.md).

## Documentation

| Document | Covers |
|---|---|
| [docs/backend-setup.md](docs/backend-setup.md) | API + worker entrypoints, env vars, seed script |
| [docs/frontend-setup.md](docs/frontend-setup.md) | React SPA install/run |
| [docs/testing.md](docs/testing.md) | Unit, integration (e2e) and coverage |
| [docs/deployment.md](docs/deployment.md) | Docker Compose (primary) and AWS (optional) |
| [docs/contributing.md](docs/contributing.md) | Branch naming, commits, CI |
| [docs/portfolio-demo.md](docs/portfolio-demo.md) | 5-minute reviewer walkthrough |
| [docs/data-model.md](docs/data-model.md) | Collection inventory, relationships, index rationale |
| API reference | Swagger UI at `/api/docs`, or `doc/plans/Email-Campaign-Delivery-Tracker-PLAN.html` §14–§20 |

## License

MIT — see [LICENSE](LICENSE). The Arsi India Info name and logo are not part
of that grant — see [TRADEMARK.md](TRADEMARK.md).
