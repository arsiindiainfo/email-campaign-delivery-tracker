// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { toIdString } from '../../../common/utils/mongo.util';
import { ContactListDocument } from '../schemas/contact-list.schema';

export class ListResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() contactCount: number;
  @ApiProperty() createdAt: Date;

  static fromDocument(doc: ContactListDocument): ListResponseDto {
    const dto = new ListResponseDto();
    dto.id = toIdString(doc._id);
    dto.name = doc.name;
    dto.contactCount = doc.contactCount;
    dto.createdAt = doc.createdAt as Date;
    return dto;
  }
}
