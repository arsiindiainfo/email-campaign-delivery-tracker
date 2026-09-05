// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Role } from '../../../shared/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  /**
   * Globally unique (not just per-org): §14 login authenticates by email alone
   * with no organization selector, so two users sharing an email across
   * different orgs would make login ambiguous.
   */
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ type: String, required: true, enum: Role, default: Role.MARKETER })
  role: Role;

  @Prop({ select: false })
  refreshTokenHash?: string;

  @Prop({ required: true, default: false })
  emailVerified: boolean;

  @Prop({ select: false })
  emailVerificationToken?: string;

  @Prop({ select: false })
  emailVerificationExpiresAt?: Date;

  /** Platform-wide admin (cross-organization) — separate from the per-org Role enum. Only ever set manually. */
  @Prop({ required: true, default: false })
  isPlatformAdmin: boolean;

  /** Set only by a platform admin (§ admin.service.ts) — a blocked user can no longer log in. */
  @Prop({ required: true, default: false })
  isBlocked: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
