// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { SuppressionReason } from '../../../shared/enums/suppression-reason.enum';

export type SuppressionDocument = HydratedDocument<Suppression>;

@Schema({ timestamps: true })
export class Suppression {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ type: String, required: true, enum: SuppressionReason })
  reason: SuppressionReason;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SuppressionSchema = SchemaFactory.createForClass(Suppression);
SuppressionSchema.index({ organizationId: 1, email: 1 }, { unique: true });
