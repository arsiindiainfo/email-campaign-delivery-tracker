// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

/**
 * One row per send action (test send or campaign dispatch), used only to
 * enforce the public-demo abuse guard (§ demo-send-guard.service.ts) — this
 * is not analytics, just a rolling/lifetime counter per organization.
 */
@Schema({ timestamps: { createdAt: 'sentAt', updatedAt: false } })
export class DemoSendLog {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  count: number;

  @Prop({ trim: true })
  subject?: string;

  @Prop({ type: [String], default: [] })
  recipients: string[];

  sentAt?: Date;
}

export type DemoSendLogDocument = HydratedDocument<DemoSendLog>;
export const DemoSendLogSchema = SchemaFactory.createForClass(DemoSendLog);
DemoSendLogSchema.index({ organizationId: 1, sentAt: 1 });
