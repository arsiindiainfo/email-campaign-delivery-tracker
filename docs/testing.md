# Testing Guide

## Backend

```bash
cd backend
npm run test        # unit tests (Jest)
npm run test:cov     # unit tests with coverage
npm run test:e2e     # integration tests (Supertest + mongodb-memory-server)
```

`test:e2e` boots the *entire* Nest module graph against an in-memory MongoDB
replica set (via `mongodb-memory-server`) — the same `AppModule` and the same
`configureApp()` bootstrap `main.ts` uses (helmet, CORS, global prefix,
validation pipe). Env vars for the test run are set in
`test/setup/global-setup.ts`, which runs once before any test file's
`import { AppModule }` is evaluated — this has to happen in `globalSetup`
specifically, because `@nestjs/config`'s `ConfigModule.forRoot()` validates
`process.env` the moment the module file is imported, not when
`Test.createTestingModule()` is later called.

Guardrail tests called out in the plan's Definition of Done:

- **Tenant isolation** (§6.1) — every resource-module e2e suite includes a
  case that logs in as Org A and requests a record owned by Org B, asserting
  a `404` (never a `403`, so the existence of another org's data is never
  leaked).
- **Webhook idempotency** (§9.3) — replays an identical SES/SNS payload twice
  and asserts the second call is a no-op (`duplicate: true`) with no second
  event recorded and no double-counted stat.

## Frontend

```bash
cd frontend
npm run test          # component tests (React Testing Library + MSW)
npm run test:e2e       # Playwright smoke suite
```

The Playwright suite covers the golden path only: register → create campaign
→ send test → view analytics. It's a smoke test, not a substitute for the
component-level coverage.

## CI

`.github/workflows/ci.yml` runs backend lint/build/test/e2e, frontend
lint/build/test, a Docker image build for all three images, and a
license-header check across every source file (§31.2).
