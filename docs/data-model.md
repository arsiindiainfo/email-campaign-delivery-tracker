# Data Model (MongoDB)

## Collection inventory

| Collection | Purpose | Key indexes |
|---|---|---|
| `organizations` | Workspace profile, verified sender domain/email | `{ slug: 1 }` unique |
| `users` | Team members, credentials, role | `{ email: 1 }` unique — **global**, not per-org: `POST /auth/login` authenticates by email alone with no organization selector, so two users sharing an email across different orgs would make login ambiguous |
| `templates` | Reusable HTML email templates | `{ organizationId: 1, name: 1 }` |
| `contact_lists` | Named recipient lists ("segments") | `{ organizationId: 1 }` |
| `contacts` | Individual recipients + list membership + status | `{ organizationId: 1, email: 1 }` unique, `{ listIds: 1 }` |
| `campaigns` | Campaign definition, schedule, status, rollup `stats`, `version` for optimistic locking | `{ organizationId: 1, status: 1 }`, `{ organizationId: 1, name: 1 }` |
| `campaign_recipients` | One row per (campaign, contact) — per-recipient delivery status + tracking token | `{ campaignId: 1, status: 1 }`, `{ trackingToken: 1 }` unique |
| `events` | Append-only tracking event log — the source of truth for analytics | `{ campaignId: 1, type: 1, occurredAt: 1 }`, `{ campaignRecipientId: 1, type: 1, providerEventId: 1 }` unique (partial — only when `providerEventId` is set) |
| `suppressions` | Org-wide do-not-send list (bounced/complained/unsubscribed/manual) | `{ organizationId: 1, email: 1 }` unique |
| `webhook_logs` | Raw inbound webhook payloads — idempotency dedup + replay/audit | `{ payloadHash: 1 }` unique |
| `audit_logs` | Append-only create/update/delete trail for campaigns, templates, lists, org settings | `{ organizationId: 1, entityType: 1, entityId: 1 }` |
| `import_jobs` | CSV import progress, polled by the frontend | `{ organizationId: 1 }`, `{ listId: 1 }` |

`import_jobs` isn't one of the plan document's headline ten collections, but
is required to back `GET /lists/:id/imports/:jobId` — a CSV import needs
somewhere to record its own progress between enqueue and completion.

## Relationships

```
organizations 1──* users
organizations 1──* templates, contact_lists, campaigns, suppressions
contact_lists *──* contacts        (via contacts.listIds)
campaigns 1──* campaign_recipients (one per resolved, non-suppressed contact)
campaign_recipients 1──* events    (every status transition is logged, never overwritten)
```

## Why `campaigns.stats` and `contacts.status` are caches, not sources of truth

Both are **derived** fields, recomputed from an append-only collection
(`events` for campaign stats, `suppressions` for a contact's `SUPPRESSED`
flag) rather than hand-maintained counters. The pattern in both cases:
mutate the append-only collection first, then update the cache — never the
reverse. This means a bug in the cache-update path is recoverable by
re-deriving from the log; a bug that only touched a mutable counter with no
log backing it would not be.

## Forward-only state machines

`campaign_recipients.status` never regresses: `EventsService.applyEvent()` is
the single call site for every status-changing event (worker sends, SES/SNS
webhooks, the tracking pixel, click redirects, unsubscribes) and applies a
rank check (`RECIPIENT_STATUS_RANK`) before writing — an out-of-order or
replayed webhook can't move a `CLICKED` recipient back to `DELIVERED`.
