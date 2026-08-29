// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { toIdString } from '../../../common/utils/mongo.util';
import { OrganizationDocument } from '../schemas/organization.schema';

export class OrganizationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiProperty({ required: false }) senderDomain?: string;
  @ApiProperty({ required: false }) senderEmail?: string;
  @ApiProperty() senderVerified: boolean;
  @ApiProperty() createdAt: Date;

  static fromDocument(doc: OrganizationDocument): OrganizationResponseDto {
    const dto = new OrganizationResponseDto();
    dto.id = toIdString(doc._id);
    dto.name = doc.name;
    dto.slug = doc.slug;
    dto.senderDomain = doc.senderDomain;
    dto.senderEmail = doc.senderEmail;
    dto.senderVerified = doc.senderVerified;
    dto.createdAt = doc.createdAt as Date;
    return dto;
  }
}
