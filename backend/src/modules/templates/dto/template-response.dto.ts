// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { toIdString } from '../../../common/utils/mongo.util';
import { TemplateDocument } from '../schemas/template.schema';

export class TemplateResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() subject: string;
  @ApiProperty() htmlBody: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromDocument(doc: TemplateDocument): TemplateResponseDto {
    const dto = new TemplateResponseDto();
    dto.id = toIdString(doc._id);
    dto.name = doc.name;
    dto.subject = doc.subject;
    dto.htmlBody = doc.htmlBody;
    dto.createdAt = doc.createdAt as Date;
    dto.updatedAt = doc.updatedAt as Date;
    return dto;
  }
}

export class TemplateSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() subject: string;
  @ApiProperty() updatedAt: Date;

  static fromDocument(doc: TemplateDocument): TemplateSummaryDto {
    const dto = new TemplateSummaryDto();
    dto.id = toIdString(doc._id);
    dto.name = doc.name;
    dto.subject = doc.subject;
    dto.updatedAt = doc.updatedAt as Date;
    return dto;
  }
}
