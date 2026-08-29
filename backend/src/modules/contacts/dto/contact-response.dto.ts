// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { toIdString } from '../../../common/utils/mongo.util';
import { ContactDocument, ContactStatus } from '../schemas/contact.schema';

export class ContactResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty({ required: false }) firstName?: string;
  @ApiProperty({ required: false }) lastName?: string;
  @ApiProperty({ enum: ContactStatus }) status: ContactStatus;
  @ApiProperty() createdAt: Date;

  static fromDocument(doc: ContactDocument): ContactResponseDto {
    const dto = new ContactResponseDto();
    dto.id = toIdString(doc._id);
    dto.email = doc.email;
    dto.firstName = doc.firstName;
    dto.lastName = doc.lastName;
    dto.status = doc.status;
    dto.createdAt = doc.createdAt as Date;
    return dto;
  }
}
