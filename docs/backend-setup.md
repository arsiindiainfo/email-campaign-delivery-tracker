# Backend Setup

## Requirements

- Node.js 22+
- MongoDB 7 running as a (single-node is fine) **replica set** — required
  because `AuthService.register()` uses a multi-document transaction to
  create an organization and its owner user atomically.

## Install

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` — at minimum `MONGODB_URI` must point at a replica-set-enabled
Mongo. If you don't want to run one yourself, use the Docker Compose stack
in [docs/deployment.md](deployment.md), which starts Mongo with
`--replSet rs0` already.

## Entrypoints

| Command | Runs |
|---|---|
| `npm run start:dev` | The HTTP API (`src/main.ts`), watch mode |
| `npm run worker:dev` | The background worker (`src/worker.ts`), watch mode — consumes the send/webhook/import SQS queues and runs the scheduled-send poller |
| `npm run seed` | Loads the "NovaMail Retail Co." demo org (see [portfolio-demo.md](portfolio-demo.md)) |

The API and worker share the same NestJS module graph but are two separate
processes — the API never consumes a queue itself, and the worker never
listens on HTTP.

## Required environment variables

See `.env.example` for the full list and defaults. The ones you're most
likely to need to change:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string (replica set) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Any string ≥16 chars in dev |
| `EMAIL_PROVIDER` | `smtp` (Mailhog, default everywhere except production) or `ses` |
| `AWS_ENDPOINT` | Point this at LocalStack (`http://localhost:4566`) for local SQS/S3/SNS without a real AWS account |
| `SNS_WEBHOOK_SIGNING_SECRET` | Shared secret used to verify inbound `/webhooks/ses` calls (§9.2 note in the plan explains why this substitutes full SNS cert-chain verification for local/demo use) |

Config is validated at boot via a Joi schema (`src/config/env.validation.ts`)
— a missing required variable fails startup immediately rather than at first
use.

## Swagger

With `NODE_ENV` not set to `production`, the API serves interactive docs at
`/api/docs`.
