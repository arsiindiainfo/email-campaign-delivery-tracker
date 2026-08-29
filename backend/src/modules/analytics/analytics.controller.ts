// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Org-wide dashboard totals across a date range' })
  overview(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.overview(user.organizationId, query);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Per-campaign funnel + time series' })
  campaignAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.analyticsService.campaignAnalytics(user.organizationId, id);
  }
}
