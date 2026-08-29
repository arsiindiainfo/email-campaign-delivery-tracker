// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 80 })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ trim: true, lowercase: true })
  senderDomain?: string;

  @Prop({ trim: true, lowercase: true })
  senderEmail?: string;

  /**
   * Demo-simulated SES sender verification — a real integration would poll
   * SES's GetIdentityVerificationAttributes; here it's a boolean the org
   * owner flips after "verifying" in Settings (§22.8).
   */
  @Prop({ default: false })
  senderVerified: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
