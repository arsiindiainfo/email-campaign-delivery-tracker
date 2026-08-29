// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AppConfig } from '../../config/configuration';
import { TRACKING_PIXEL_GIF } from './tracking-pixel';
import { TrackingService } from './tracking.service';

/** Unversioned, public routes embedded in already-sent emails — must never break (§11, §18). */
@ApiExcludeController()
@Controller('t')
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  @Public()
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  @Get('o/:token')
  async openPixel(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.trackingService.recordOpen(token, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(TRACKING_PIXEL_GIF);
  }

  @Public()
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  @Get('c/:token')
  async clickRedirect(
    @Param('token') token: string,
    @Query('u') url: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const fallback = this.configService.get('appBaseUrl', { infer: true })!;
    const destination = await this.trackingService.recordClickAndResolveUrl(
      token,
      url ?? fallback,
      {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    );
    res.redirect(302, destination);
  }
}
