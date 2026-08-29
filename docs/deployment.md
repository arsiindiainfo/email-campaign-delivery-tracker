# Deployment

## Docker Compose (primary — clone and run)

```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

Services started:

| Service | Purpose |
|---|---|
| `mongo` | MongoDB 7, started as a single-node replica set (`rs0`) so multi-document transactions work |
| `mailhog` | SMTP catcher — the demo `EmailProvider` always resolves here outside `production`, so no real email can ever leave the stack |
| `localstack` | Emulates SQS (`send-queue`, `webhook-queue`, `import-queue` + their DLQs), S3, and SNS — no AWS account needed |
| `api` | The NestJS HTTP API |
| `worker` | Same image, `worker.ts` entrypoint — consumes the three SQS queues and runs the scheduled-send poller |
| `web` | The React SPA, built and served via nginx |

`infrastructure/localstack/init-aws.sh` runs automatically on LocalStack
startup and provisions every queue, DLQ, the S3 uploads bucket, and the SNS
topic — zero manual AWS setup.

## AWS (optional — a secondary, fully-scripted path)

The architecture maps directly onto managed AWS services:

- **SES** — outbound sending + bounce/complaint feedback via SNS
- **SQS** — `send-queue`, `webhook-queue`, `import-queue`, each with a DLQ
- **Lambda + API Gateway** — the NestJS API and worker, or run them on
  ECS/Fargate if you'd rather not adapt to a Lambda handler
- **S3** — CSV imports, template assets
- **CloudWatch** — structured logs (pino JSON), alarms on DLQ depth
- **CloudFront** — CDN for the React build

This path is intentionally **not** the primary "does it work" check for a
reviewer — the Docker Compose stack is. If you do want to run it against real
AWS:

1. Verify a sender identity/domain in SES and request production access (SES
   sandbox restricts you to verified recipient addresses only).
2. Create the three SQS queues + DLQs and the S3 bucket (or adapt
   `infrastructure/localstack/init-aws.sh` into Terraform/CDK — not included
   in this repo to keep the primary path dependency-free).
3. Set `EMAIL_PROVIDER=ses` **and** `NODE_ENV=production` — the app refuses
   to boot with `EMAIL_PROVIDER=ses` outside `production` (§30 risk
   mitigation: a real SES key must never be reachable from a non-production
   environment).
4. Point `AWS_ENDPOINT` at nothing (real AWS, not LocalStack) and set real
   `AWS_REGION`/credentials (prefer an IAM role over static keys).
5. Subscribe an SNS topic to your SES bounce/complaint/delivery notifications
   and point it at `POST /api/v1/webhooks/ses`, signed with the value in
   `SNS_WEBHOOK_SIGNING_SECRET`.
