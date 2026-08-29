// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RecipientStatus } from '../../../shared/enums/recipient-status.enum';

export class ListRecipientsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RecipientStatus })
  @IsOptional()
  @IsEnum(RecipientStatus)
  status?: RecipientStatus;
}
