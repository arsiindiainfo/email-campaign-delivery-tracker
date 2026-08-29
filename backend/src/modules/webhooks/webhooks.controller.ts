// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Controller, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';

@ApiExcludeController()
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  @Post('ses')
  handleSesWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['x-webhook-signature'] as string | undefined;
    return this.webhooksService.handleSesWebhook(req.rawBody!, signature);
  }
}
