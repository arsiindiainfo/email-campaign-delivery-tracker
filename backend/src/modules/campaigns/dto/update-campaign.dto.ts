// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { CreateCampaignDto } from './create-campaign.dto';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @ApiProperty({
    description:
      'Last-seen version — mismatch returns 409 VERSION_CONFLICT (§15)',
  })
  @IsInt()
  @Min(1)
  version: number;
}
