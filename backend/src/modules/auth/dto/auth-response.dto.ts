// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationResponseDto } from '../../organizations/dto/organization-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
  @ApiProperty({ type: OrganizationResponseDto })
  organization: OrganizationResponseDto;
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
}

export class TokenPairDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
}
