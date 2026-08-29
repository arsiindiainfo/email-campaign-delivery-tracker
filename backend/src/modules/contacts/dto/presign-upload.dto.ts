// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class PresignUploadDto {
  @ApiProperty({ example: 'contacts.csv' })
  @IsString()
  @Matches(/\.csv$/i, { message: 'filename must end with .csv' })
  filename: string;
}

export class ImportRequestDto {
  @ApiProperty()
  @IsString()
  s3Key: string;
}
