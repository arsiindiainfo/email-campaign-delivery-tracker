// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'ISO-8601 date, defaults to 30 days before `to`',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO-8601 date, defaults to now' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
