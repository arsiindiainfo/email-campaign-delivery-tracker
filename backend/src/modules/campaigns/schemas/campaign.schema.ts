// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { CampaignStatus } from '../../../shared/enums/campaign-status.enum';

export class CampaignStats {
  @Prop({ default: 0 }) queued: number;
  @Prop({ default: 0 }) sent: number;
  @Prop({ default: 0 }) delivered: number;
  @Prop({ default: 0 }) opened: number;
  @Prop({ default: 0 }) clicked: number;
  @Prop({ default: 0 }) bounced: number;
  @Prop({ default: 0 }) complained: number;
  @Prop({ default: 0 }) failed: number;
  @Prop({ default: 0 }) unsubscribed: number;
}

export type CampaignDocument = HydratedDocument<Campaign>;

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 3, maxlength: 120 })
  name: string;

  @Prop({ required: true, trim: true, minlength: 3, maxlength: 200 })
  subject: string;

  @Prop({ required: true, trim: true })
  fromName: string;

  @Prop({ required: true, trim: true, lowercase: true })
  fromEmail: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  templateId: Types.ObjectId;

  @Prop({
    type: [SchemaTypes.ObjectId],
    required: true,
    validate: (v: unknown[]) => v.length > 0,
  })
  listIds: Types.ObjectId[];

  @Prop({
    type: String,
    required: true,
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Prop()
  scheduledAt?: Date;

  @Prop()
  sentAt?: Date;

  @Prop({ type: CampaignStats, default: () => ({}) })
  stats: CampaignStats;

  @Prop({ default: 1 })
  version: number;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  createdBy: Types.ObjectId;

  @Prop()
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
CampaignSchema.index({ organizationId: 1, status: 1 });
CampaignSchema.index({ organizationId: 1, name: 1 });
