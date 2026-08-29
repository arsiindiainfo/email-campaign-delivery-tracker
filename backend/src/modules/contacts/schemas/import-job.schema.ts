// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export enum ImportJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type ImportJobDocument = HydratedDocument<ImportJob>;

/**
 * Not one of the plan's headline ten collections, but required to back
 * §16's `GET /lists/:id/imports/:jobId` polling endpoint — a CSV import
 * needs somewhere to record its own progress between enqueue and completion.
 */
@Schema({ timestamps: true })
export class ImportJob {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  listId: Types.ObjectId;

  @Prop({ required: true })
  s3Key: string;

  @Prop({
    type: String,
    required: true,
    enum: ImportJobStatus,
    default: ImportJobStatus.PENDING,
  })
  status: ImportJobStatus;

  @Prop({ default: 0 })
  totalRows: number;

  @Prop({ default: 0 })
  importedCount: number;

  @Prop({ default: 0 })
  skippedCount: number;

  @Prop({ type: [String], default: [] })
  skippedSamples: string[];

  @Prop()
  errorMessage?: string;

  @Prop()
  completedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ImportJobSchema = SchemaFactory.createForClass(ImportJob);
