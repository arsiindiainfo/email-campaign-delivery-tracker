// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { toIdString } from '../../../common/utils/mongo.util';
import { SuppressionReason } from '../../../shared/enums/suppression-reason.enum';
import { SuppressionDocument } from '../schemas/suppression.schema';

export class SuppressionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: SuppressionReason }) reason: SuppressionReason;
  @ApiProperty() createdAt: Date;

  static fromDocument(doc: SuppressionDocument): SuppressionResponseDto {
    const dto = new SuppressionResponseDto();
    dto.id = toIdString(doc._id);
    dto.email = doc.email;
    dto.reason = doc.reason;
    dto.createdAt = doc.createdAt as Date;
    return dto;
  }
}
