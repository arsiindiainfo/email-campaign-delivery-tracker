// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { RecipientStatus } from '../../../shared/enums/recipient-status.enum';

export type CampaignRecipientDocument = HydratedDocument<CampaignRecipient>;

/** One row per (campaign, contact) — the per-recipient delivery pipeline of §8.2. */
@Schema({ timestamps: true })
export class CampaignRecipient {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  campaignId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  contactId: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({
    type: String,
    required: true,
    enum: RecipientStatus,
    default: RecipientStatus.QUEUED,
  })
  status: RecipientStatus;

  @Prop({ required: true })
  trackingToken: string;

  @Prop()
  providerMessageId?: string;

  @Prop()
  lastEventAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CampaignRecipientSchema =
  SchemaFactory.createForClass(CampaignRecipient);
CampaignRecipientSchema.index({ campaignId: 1, status: 1 });
CampaignRecipientSchema.index({ trackingToken: 1 }, { unique: true });
