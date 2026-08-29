// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable, Logger } from '@nestjs/common';
import { CampaignRecipientsRepository } from '../campaigns/campaign-recipients.repository';
import { EventSource, EventType } from '../../shared/enums/event-type.enum';
import { EventsService } from '../events/events.service';

export interface TrackingMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly campaignRecipientsRepository: CampaignRecipientsRepository,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * §18 — unknown tokens still return the pixel (never a 404), so this never
   * throws; it just silently no-ops when the token doesn't resolve.
   */
  async recordOpen(token: string, meta: TrackingMeta): Promise<void> {
    const recipient =
      await this.campaignRecipientsRepository.findByTrackingToken(token);
    if (!recipient) return;

    await this.eventsService.applyEvent({
      organizationId: recipient.organizationId.toString(),
      campaignId: recipient.campaignId.toString(),
      campaignRecipientId: recipient.id as string,
      email: recipient.email,
      type: EventType.OPENED,
      source: EventSource.TRACKING_PIXEL,
      meta,
    });
  }

  /** Returns the original URL to redirect to — the click is recorded on a best-effort basis, the redirect must never fail. */
  async recordClickAndResolveUrl(
    token: string,
    originalUrl: string,
    meta: TrackingMeta,
  ): Promise<string> {
    const recipient =
      await this.campaignRecipientsRepository.findByTrackingToken(token);
    if (!recipient) {
      return originalUrl;
    }

    try {
      // A click implies an open (§18) — applying OPENED first is a safe no-op if it already happened.
      await this.eventsService.applyEvent({
        organizationId: recipient.organizationId.toString(),
        campaignId: recipient.campaignId.toString(),
        campaignRecipientId: recipient.id as string,
        email: recipient.email,
        type: EventType.OPENED,
        source: EventSource.TRACKING_LINK,
        meta,
      });
      await this.eventsService.applyEvent({
        organizationId: recipient.organizationId.toString(),
        campaignId: recipient.campaignId.toString(),
        campaignRecipientId: recipient.id as string,
        email: recipient.email,
        type: EventType.CLICKED,
        source: EventSource.TRACKING_LINK,
        meta: { ...meta, url: originalUrl },
      });
    } catch (error) {
      this.logger.error(
        `Failed to record click for token ${token}`,
        error as Error,
      );
    }
    return originalUrl;
  }

  /** Idempotent — unsubscribing twice is a no-op success (§18). */
  async unsubscribe(token: string): Promise<{ organizationName?: string }> {
    const recipient =
      await this.campaignRecipientsRepository.findByTrackingToken(token);
    if (!recipient) {
      return {};
    }
    await this.eventsService.applyEvent({
      organizationId: recipient.organizationId.toString(),
      campaignId: recipient.campaignId.toString(),
      campaignRecipientId: recipient.id as string,
      email: recipient.email,
      type: EventType.UNSUBSCRIBED,
      source: EventSource.MANUAL,
    });
    return {};
  }
}
