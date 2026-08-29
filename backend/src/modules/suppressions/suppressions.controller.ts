// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateSuppressionDto } from './dto/create-suppression.dto';
import { SuppressionsService } from './suppressions.service';

@ApiTags('suppressions')
@ApiBearerAuth()
@Controller('suppressions')
export class SuppressionsController {
  constructor(private readonly suppressionsService: SuppressionsService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated suppression list' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.suppressionsService.list(user.organizationId, query);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Manually suppress an address' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSuppressionDto,
  ) {
    return this.suppressionsService.manuallySuppress(user.organizationId, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Remove a manual suppression (not bounce/complaint-based)',
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.suppressionsService.remove(user.organizationId, id);
    return { deleted: true };
  }
}
