// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { EventsModule } from '../events/events.module';
import { QueueModule } from '../queue/queue.module';
import { WebhookLog, WebhookLogSchema } from './schemas/webhook-log.schema';
import { WebhookLogsRepository } from './webhook-logs.repository';
import { WebhookProcessorService } from './webhook-processor.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebhookLog.name, schema: WebhookLogSchema },
    ]),
    QueueModule,
    CampaignsModule,
    EventsModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookLogsRepository, WebhookProcessorService],
  exports: [WebhookProcessorService],
})
export class WebhooksModule {}
