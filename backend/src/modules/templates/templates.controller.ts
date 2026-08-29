// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesService } from './templates.service';

@ApiTags('templates')
@ApiBearerAuth()
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Create a reusable HTML/text template' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.create(user.organizationId, user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Paginated template list' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.templatesService.list(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Full template body for the editor/preview' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.templatesService.getOne(user.organizationId, id);
  }

  @Put(':id')
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Update a template' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(
      user.organizationId,
      user.userId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete a template' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.templatesService.softDelete(
      user.organizationId,
      user.userId,
      id,
    );
    return { deleted: true };
  }
}
