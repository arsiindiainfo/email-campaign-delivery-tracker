// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { toIdString } from '../../../common/utils/mongo.util';
import { RecipientStatus } from '../../../shared/enums/recipient-status.enum';
import { CampaignRecipientDocument } from '../schemas/campaign-recipient.schema';

export class RecipientResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: RecipientStatus }) status: RecipientStatus;
  @ApiProperty({ required: false }) lastEventAt?: Date;

  static fromDocument(doc: CampaignRecipientDocument): RecipientResponseDto {
    const dto = new RecipientResponseDto();
    dto.id = toIdString(doc._id);
    dto.email = doc.email;
    dto.status = doc.status;
    dto.lastEventAt = doc.lastEventAt;
    return dto;
  }
}
