// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WebhookLogDocument = HydratedDocument<WebhookLog>;

/** Layer 1 of the §9.3 dedup strategy — an identical retry from the provider is dropped at the door. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class WebhookLog {
  @Prop({ required: true, unique: true })
  payloadHash: string;

  @Prop({ required: true })
  rawBody: string;

  createdAt?: Date;
}

export const WebhookLogSchema = SchemaFactory.createForClass(WebhookLog);
