// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationResponseDto } from '../../organizations/dto/organization-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

/** No tokens here by design — the account isn't usable until the email is verified (see AuthService.register). */
export class RegisterResponseDto {
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
  @ApiProperty({ type: OrganizationResponseDto })
  organization: OrganizationResponseDto;
  @ApiProperty() message: string;
}
