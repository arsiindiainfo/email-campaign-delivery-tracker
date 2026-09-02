// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ minLength: 2, maxLength: 80 })
  @IsString()
  @Length(2, 80)
  organizationName: string;

  @ApiProperty()
  @IsString()
  @Length(1, 120)
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @Length(10, 128)
  @Matches(/\d/, { message: 'password must contain at least 1 number' })
  password: string;

  @ApiProperty({ description: 'Google reCAPTCHA v2 response token' })
  @IsString()
  @MinLength(1)
  recaptchaToken: string;
}
