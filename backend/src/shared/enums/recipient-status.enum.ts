// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
export enum RecipientStatus {
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

/**
 * Forward-progress rank used to guard against out-of-order webhook delivery
 * downgrading a recipient's status (§8.2 of the plan). BOUNCED/FAILED/COMPLAINED
 * are terminal side-branches with no further forward rank of their own.
 */
export const RECIPIENT_STATUS_RANK: Record<RecipientStatus, number> = {
  [RecipientStatus.QUEUED]: 0,
  [RecipientStatus.SENT]: 1,
  [RecipientStatus.DELIVERED]: 2,
  [RecipientStatus.OPENED]: 3,
  [RecipientStatus.CLICKED]: 4,
  [RecipientStatus.UNSUBSCRIBED]: 5,
  [RecipientStatus.BOUNCED]: 100,
  [RecipientStatus.COMPLAINED]: 100,
  [RecipientStatus.FAILED]: 100,
};

export const TERMINAL_RECIPIENT_STATUSES = new Set<RecipientStatus>([
  RecipientStatus.BOUNCED,
  RecipientStatus.COMPLAINED,
  RecipientStatus.FAILED,
]);
