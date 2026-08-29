// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable, Logger } from '@nestjs/common';
import { EventSource, EventType } from '../../shared/enums/event-type.enum';
import { CampaignRecipientsRepository } from '../campaigns/campaign-recipients.repository';
import { EventsService } from '../events/events.service';
import { SesNotification } from './ses-notification.interface';

const NOTIFICATION_TYPE_TO_EVENT: Record<string, EventType> = {
  Delivery: EventType.DELIVERED,
  Bounce: EventType.BOUNCED,
  Complaint: EventType.COMPLAINED,
};

/** Runs on the worker process, consuming webhook-queue messages (§9, §17). */
@Injectable()
export class WebhookProcessorService {
  private readonly logger = new Logger(WebhookProcessorService.name);

  constructor(
    private readonly campaignRecipientsRepository: CampaignRecipientsRepository,
    private readonly eventsService: EventsService,
  ) {}

  async process(payload: unknown): Promise<void> {
    const notification = payload as SesNotification;
    const eventType = NOTIFICATION_TYPE_TO_EVENT[notification.notificationType];
    if (!eventType) {
      // Unrecognized notificationType values are accepted and logged, not rejected,
      // so a future SES/SNS field addition never causes dropped webhooks (§17).
      this.logger.log(
        `Ignoring unrecognized notificationType: ${notification.notificationType}`,
      );
      return;
    }

    const recipient =
      await this.campaignRecipientsRepository.findByProviderMessageId(
        notification.mail.messageId,
      );
    if (!recipient) {
      this.logger.warn(
        `No recipient found for provider messageId ${notification.mail.messageId}`,
      );
      return;
    }

    await this.eventsService.applyEvent({
      organizationId: recipient.organizationId.toString(),
      campaignId: recipient.campaignId.toString(),
      campaignRecipientId: recipient.id as string,
      email: recipient.email,
      type: eventType,
      source: EventSource.WEBHOOK,
      providerEventId: notification.mail.messageId,
      meta: notification.bounce
        ? { bounceType: notification.bounce.bounceType }
        : undefined,
    });
  }
}
