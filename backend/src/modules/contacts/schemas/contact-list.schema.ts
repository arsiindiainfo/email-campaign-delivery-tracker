// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ContactListDocument = HydratedDocument<ContactList>;

@Schema({ timestamps: true })
export class ContactList {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 120 })
  name: string;

  /** Denormalized from contacts — refreshed on every add/remove/import (§7.3 pattern). */
  @Prop({ default: 0 })
  contactCount: number;

  @Prop()
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ContactListSchema = SchemaFactory.createForClass(ContactList);
