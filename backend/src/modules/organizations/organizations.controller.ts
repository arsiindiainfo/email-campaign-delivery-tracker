// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Org profile + sender domain status' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const organization = await this.organizationsService.getById(
      user.organizationId,
    );
    return OrganizationResponseDto.fromDocument(organization);
  }

  @Put('me')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update org profile / sender identity' })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const organization = await this.organizationsService.updateProfile(
      user.organizationId,
      dto,
    );
    return OrganizationResponseDto.fromDocument(organization);
  }

  @Post('me/verify-sender')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Demo-simulated SES sender identity verification' })
  async verifySender(@CurrentUser() user: AuthenticatedUser) {
    const organization = await this.organizationsService.markSenderVerified(
      user.organizationId,
    );
    return OrganizationResponseDto.fromDocument(organization);
  }
}
