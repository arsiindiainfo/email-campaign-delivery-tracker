// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { EventSource, EventType } from '../../../shared/enums/event-type.enum';

export class EventMeta {
  @Prop() ip?: string;
  @Prop() userAgent?: string;
  @Prop() url?: string;
  @Prop() bounceType?: string;
}

export type EventDocument = HydratedDocument<Event>;

/** Append-only — the single source of truth analytics rollups are derived from (§7.3). */
@Schema({ timestamps: false })
export class Event {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  campaignId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  campaignRecipientId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: EventType })
  type: EventType;

  @Prop({ type: String, required: true, enum: EventSource })
  source: EventSource;

  @Prop({ required: true })
  occurredAt: Date;

  @Prop({ type: EventMeta })
  meta?: EventMeta;

  /** Dedup key from the ESP — only webhook-sourced events set this (§9.3). */
  @Prop()
  providerEventId?: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.index({ campaignId: 1, type: 1, occurredAt: 1 });
EventSchema.index(
  { campaignRecipientId: 1, type: 1, providerEventId: 1 },
  {
    unique: true,
    partialFilterExpression: { providerEventId: { $exists: true } },
  },
);
