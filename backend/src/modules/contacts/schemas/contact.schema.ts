// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export enum ContactStatus {
  ACTIVE = 'ACTIVE',
  SUPPRESSED = 'SUPPRESSED',
}

/** Public-demo abuse guard: gates whether this contact can ever receive real mail (§ demo-send-guard.service.ts). */
export enum ContactApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type ContactDocument = HydratedDocument<Contact>;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ trim: true })
  firstName?: string;

  @Prop({ trim: true })
  lastName?: string;

  @Prop({ type: [SchemaTypes.ObjectId], default: [], index: true })
  listIds: Types.ObjectId[];

  /** Mirrors the org-wide suppressions collection so list screens don't need a join (§7.3 pattern). */
  @Prop({
    type: String,
    required: true,
    enum: ContactStatus,
    default: ContactStatus.ACTIVE,
  })
  status: ContactStatus;

  @Prop({
    type: String,
    required: true,
    enum: ContactApprovalStatus,
    default: ContactApprovalStatus.PENDING,
    index: true,
  })
  approvalStatus: ContactApprovalStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
ContactSchema.index({ organizationId: 1, email: 1 }, { unique: true });
