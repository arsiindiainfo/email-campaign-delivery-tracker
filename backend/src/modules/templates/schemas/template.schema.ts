// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type TemplateDocument = HydratedDocument<Template>;

@Schema({ timestamps: true })
export class Template {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 120 })
  name: string;

  @Prop({ required: true, trim: true, minlength: 3, maxlength: 200 })
  subject: string;

  @Prop({ required: true })
  htmlBody: string;

  @Prop()
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
TemplateSchema.index({ organizationId: 1, name: 1 });
