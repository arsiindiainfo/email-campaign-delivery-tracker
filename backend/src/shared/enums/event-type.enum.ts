// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
export enum EventType {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  BOUNCED = 'BOUNCED',
  COMPLAINED = 'COMPLAINED',
  FAILED = 'FAILED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
}

export enum EventSource {
  WORKER = 'worker',
  WEBHOOK = 'webhook',
  TRACKING_PIXEL = 'tracking-pixel',
  TRACKING_LINK = 'tracking-link',
  MANUAL = 'manual',
}
