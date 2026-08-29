// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsMongoId,
  IsString,
  Length,
} from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ minLength: 3, maxLength: 120 })
  @IsString()
  @Length(3, 120)
  name: string;

  @ApiProperty({ minLength: 3, maxLength: 200 })
  @IsString()
  @Length(3, 200)
  subject: string;

  @ApiProperty()
  @IsString()
  @Length(1, 120)
  fromName: string;

  @ApiProperty()
  @IsEmail()
  fromEmail: string;

  @ApiProperty()
  @IsMongoId()
  templateId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  listIds: string[];
}
