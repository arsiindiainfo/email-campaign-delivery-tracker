// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrgScopedRepository } from '../../common/repositories/org-scoped.repository';
import {
  RECIPIENT_STATUS_RANK,
  RecipientStatus,
} from '../../shared/enums/recipient-status.enum';
import {
  CampaignRecipient,
  CampaignRecipientDocument,
} from './schemas/campaign-recipient.schema';

export interface NewRecipient {
  organizationId: string;
  campaignId: string;
  contactId: string;
  email: string;
  trackingToken: string;
}

@Injectable()
export class CampaignRecipientsRepository extends OrgScopedRepository<CampaignRecipientDocument> {
  constructor(
    @InjectModel(CampaignRecipient.name)
    model: Model<CampaignRecipientDocument>,
  ) {
    super(model);
  }

  async insertMany(
    recipients: NewRecipient[],
  ): Promise<CampaignRecipientDocument[]> {
    if (recipients.length === 0) return [];
    return this.model.insertMany(
      recipients.map((r) => ({
        organizationId: new Types.ObjectId(r.organizationId),
        campaignId: new Types.ObjectId(r.campaignId),
        contactId: new Types.ObjectId(r.contactId),
        email: r.email,
        trackingToken: r.trackingToken,
        status: RecipientStatus.QUEUED,
      })),
      { ordered: false },
    );
  }

  findQueuedByCampaign(organizationId: string, campaignId: string) {
    return this.find(organizationId, {
      campaignId,
      status: RecipientStatus.QUEUED,
    });
  }

  /** Not org-scoped — public tracking/webhook routes resolve purely by the unguessable token (§8.2, §18). */
  findByTrackingToken(trackingToken: string) {
    return this.model.findOne({ trackingToken }).exec();
  }

  /** Not org-scoped — inbound SES/SNS webhooks correlate purely by the provider's own message id (§17). */
  findByProviderMessageId(providerMessageId: string) {
    return this.model.findOne({ providerMessageId }).exec();
  }

  async setProviderMessageId(
    recipientId: string,
    providerMessageId: string,
  ): Promise<void> {
    await this.model
      .updateOne({ _id: recipientId }, { $set: { providerMessageId } })
      .exec();
  }

  findByCampaignAndEmail(campaignId: string, email: string) {
    return this.model
      .findOne({ campaignId, email: email.toLowerCase() })
      .exec();
  }

  /**
   * Never downgrades: applies the new status only if its forward-rank is
   * strictly greater than the current one, so an out-of-order or replayed
   * webhook can't move a CLICKED recipient back to DELIVERED (§8.2).
   */
  async advanceStatus(
    recipientId: string,
    newStatus: RecipientStatus,
    occurredAt: Date,
  ): Promise<boolean> {
    const recipient = await this.model.findById(recipientId).exec();
    if (!recipient) return false;
    if (
      RECIPIENT_STATUS_RANK[newStatus] <=
      RECIPIENT_STATUS_RANK[recipient.status]
    ) {
      return false;
    }
    await this.model
      .updateOne(
        { _id: recipientId },
        { $set: { status: newStatus, lastEventAt: occurredAt } },
      )
      .exec();
    return true;
  }

  countByCampaignAndStatus(campaignId: string, status: RecipientStatus) {
    return this.model.countDocuments({ campaignId, status }).exec();
  }
}
