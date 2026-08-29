// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateSuppressionDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}
