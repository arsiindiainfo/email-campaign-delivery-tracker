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
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ListCampaignsQueryDto } from './dto/list-campaigns-query.dto';
import { ListRecipientsQueryDto } from './dto/list-recipients-query.dto';
import { ScheduleCampaignDto } from './dto/schedule-campaign.dto';
import { SendTestDto } from './dto/send-test.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@ApiTags('campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Create a draft campaign' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(user.organizationId, user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Paginated campaign list' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCampaignsQueryDto,
  ) {
    return this.campaignsService.list(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Campaign detail + stats' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.campaignsService.getOne(user.organizationId, id);
  }

  @Put(':id')
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Edit a draft campaign' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(
      user.organizationId,
      user.userId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete a draft campaign' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.campaignsService.remove(user.organizationId, user.userId, id);
    return { deleted: true };
  }

  @Post(':id/send-test')
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Send preview to up to 5 test addresses' })
  sendTest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendTestDto,
  ) {
    return this.campaignsService.sendTest(user.organizationId, id, dto);
  }

  @Post(':id/schedule')
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Schedule or immediately queue the send' })
  schedule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ScheduleCampaignDto,
  ) {
    return this.campaignsService.schedule(user.organizationId, id, dto);
  }

  @Post(':id/pause')
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Pause a SENDING campaign' })
  pause(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.campaignsService.pause(user.organizationId, id);
  }

  @Post(':id/resume')
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Resume a PAUSED campaign' })
  resume(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.campaignsService.resume(user.organizationId, id);
  }

  @Post(':id/cancel')
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Cancel not-yet-dispatched sends' })
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.campaignsService.cancel(user.organizationId, id);
  }

  @Get(':id/recipients')
  @ApiOperation({ summary: 'Per-recipient delivery status' })
  listRecipients(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: ListRecipientsQueryDto,
  ) {
    return this.campaignsService.listRecipients(user.organizationId, id, query);
  }
}
