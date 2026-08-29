// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class ScheduleCampaignDto {
  @ApiPropertyOptional({
    description: 'Future ISO-8601 timestamp; omit to send immediately',
  })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}
