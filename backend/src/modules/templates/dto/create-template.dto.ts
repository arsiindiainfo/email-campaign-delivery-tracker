// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ minLength: 1, maxLength: 120 })
  @IsString()
  @Length(1, 120)
  name: string;

  @ApiProperty({ minLength: 3, maxLength: 200 })
  @IsString()
  @Length(3, 200)
  subject: string;

  @ApiProperty({ description: 'Must include the {{unsubscribeUrl}} merge tag' })
  @IsString()
  @Length(1, 200_000)
  htmlBody: string;
}
