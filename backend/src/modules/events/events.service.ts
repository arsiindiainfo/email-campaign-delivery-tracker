// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable, Logger } from '@nestjs/common';
import { CampaignRecipientsRepository } from '../campaigns/campaign-recipients.repository';
import { CampaignsRepository } from '../campaigns/campaigns.repository';
import { EventSource, EventType } from '../../shared/enums/event-type.enum';
import { RecipientStatus } from '../../shared/enums/recipient-status.enum';
import { SuppressionReason } from '../../shared/enums/suppression-reason.enum';
import { SuppressionsService } from '../suppressions/suppressions.service';
import { EventsRepository } from './events.repository';

const EVENT_TO_STAT_FIELD: Record<EventType, string> = {
  [EventType.QUEUED]: 'queued',
  [EventType.SENT]: 'sent',
  [EventType.DELIVERED]: 'delivered',
  [EventType.OPENED]: 'opened',
  [EventType.CLICKED]: 'clicked',
  [EventType.BOUNCED]: 'bounced',
  [EventType.COMPLAINED]: 'complained',
  [EventType.FAILED]: 'failed',
  [EventType.UNSUBSCRIBED]: 'unsubscribed',
};

const EVENT_TO_RECIPIENT_STATUS: Record<EventType, RecipientStatus> = {
  [EventType.QUEUED]: RecipientStatus.QUEUED,
  [EventType.SENT]: RecipientStatus.SENT,
  [EventType.DELIVERED]: RecipientStatus.DELIVERED,
  [EventType.OPENED]: RecipientStatus.OPENED,
  [EventType.CLICKED]: RecipientStatus.CLICKED,
  [EventType.BOUNCED]: RecipientStatus.BOUNCED,
  [EventType.COMPLAINED]: RecipientStatus.COMPLAINED,
  [EventType.FAILED]: RecipientStatus.FAILED,
  [EventType.UNSUBSCRIBED]: RecipientStatus.UNSUBSCRIBED,
};

export interface ApplyEventParams {
  organizationId: string;
  campaignId: string;
  campaignRecipientId: string;
  email: string;
  type: EventType;
  source: EventSource;
  occurredAt?: Date;
  meta?: { ip?: string; userAgent?: string; url?: string; bounceType?: string };
  providerEventId?: string;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly campaignRecipientsRepository: CampaignRecipientsRepository,
    private readonly campaignsRepository: CampaignsRepository,
    private readonly suppressionsService: SuppressionsService,
  ) {}

  /**
   * The single entry point for every status-changing event in the system —
   * worker sends, SES/SNS webhooks, the tracking pixel, click redirects, and
   * unsubscribes all funnel through here. Two independent safeguards live in
   * one place instead of being re-implemented per caller: duplicate-event
   * dedup (§9.3) and the forward-only recipient state-rank guard (§8.2).
   */
  async applyEvent(
    params: ApplyEventParams,
  ): Promise<{ applied: boolean; duplicate: boolean }> {
    const occurredAt = params.occurredAt ?? new Date();

    const inserted = await this.eventsRepository.insert({
      organizationId: params.organizationId,
      campaignId: params.campaignId,
      campaignRecipientId: params.campaignRecipientId,
      type: params.type,
      source: params.source,
      occurredAt,
      meta: params.meta,
      providerEventId: params.providerEventId,
    });
    if (!inserted) {
      return { applied: false, duplicate: true };
    }

    const advanced = await this.campaignRecipientsRepository.advanceStatus(
      params.campaignRecipientId,
      EVENT_TO_RECIPIENT_STATUS[params.type],
      occurredAt,
    );
    if (advanced) {
      await this.campaignsRepository.incrementStat(
        params.campaignId,
        EVENT_TO_STAT_FIELD[params.type],
      );
    }

    if (params.type === EventType.BOUNCED) {
      await this.suppressionsService.suppress(
        params.organizationId,
        params.email,
        SuppressionReason.BOUNCED,
      );
    } else if (params.type === EventType.COMPLAINED) {
      await this.suppressionsService.suppress(
        params.organizationId,
        params.email,
        SuppressionReason.COMPLAINED,
      );
    } else if (params.type === EventType.UNSUBSCRIBED) {
      await this.suppressionsService.suppress(
        params.organizationId,
        params.email,
        SuppressionReason.UNSUBSCRIBED,
      );
    }

    return { applied: advanced, duplicate: false };
  }

  /**
   * QUEUED is the recipient's initial status on insert, so applyEvent's
   * forward-rank guard would never fire for it (rank 0 vs rank 0) — this
   * records the QUEUED event batch and bumps stats.queued directly instead.
   */
  async recordQueuedBatch(
    organizationId: string,
    campaignId: string,
    recipientIds: string[],
  ): Promise<void> {
    if (recipientIds.length === 0) return;
    const occurredAt = new Date();
    await Promise.all(
      recipientIds.map((campaignRecipientId) =>
        this.eventsRepository.insert({
          organizationId,
          campaignId,
          campaignRecipientId,
          type: EventType.QUEUED,
          source: EventSource.WORKER,
          occurredAt,
        }),
      ),
    );
    await this.campaignsRepository.incrementStat(
      campaignId,
      'queued',
      recipientIds.length,
    );
  }
}
