// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { TrackingService } from './tracking.service';

@ApiTags('unsubscribe')
@Controller('unsubscribe')
export class UnsubscribeController {
  constructor(private readonly trackingService: TrackingService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post(':token')
  @ApiOperation({ summary: 'One-click unsubscribe confirmation (idempotent)' })
  async unsubscribe(
    @Param('token') token: string,
  ): Promise<{ unsubscribed: true }> {
    await this.trackingService.unsubscribe(token);
    return { unsubscribed: true };
  }
}
