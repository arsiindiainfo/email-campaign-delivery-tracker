// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { CampaignsService } from './modules/campaigns/campaigns.service';
import { ContactsService } from './modules/contacts/contacts.service';
import type { ImportQueueMessage } from './modules/contacts/contacts.service';
import { consumeQueueForever } from './modules/queue/queue-consumer';
import { QueueService } from './modules/queue/queue.service';
import type { SendJobMessage } from './modules/sending/send-queue.producer';
import { WebhookProcessorService } from './modules/webhooks/webhook-processor.service';

const SCHEDULER_TICK_MS = 30_000;

/**
 * Separate entrypoint from main.ts (§4) — same module graph, no HTTP
 * listener. Consumes all three SQS queues plus a short-interval poller that
 * stands in for a real CloudWatch Events rule (§15).
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(PinoLogger));

  const configService = app.get(ConfigService<AppConfig>);
  const queueService = app.get(QueueService);
  const campaignsService = app.get(CampaignsService);
  const contactsService = app.get(ContactsService);
  const webhookProcessor = app.get(WebhookProcessorService);
  const logger = new Logger('Worker');

  void consumeQueueForever({
    queueUrl: configService.get('sqs.sendQueueUrl', { infer: true })!,
    client: queueService.client,
    handler: (body) => campaignsService.processSendJob(body as SendJobMessage),
    logger: new Logger('SendQueueConsumer'),
  });

  void consumeQueueForever({
    queueUrl: configService.get('sqs.webhookQueueUrl', { infer: true })!,
    client: queueService.client,
    handler: (body) => webhookProcessor.process(body),
    logger: new Logger('WebhookQueueConsumer'),
  });

  void consumeQueueForever({
    queueUrl: configService.get('sqs.importQueueUrl', { infer: true })!,
    client: queueService.client,
    handler: (body) =>
      contactsService.processImportJob(body as ImportQueueMessage),
    logger: new Logger('ImportQueueConsumer'),
  });

  setInterval(() => {
    campaignsService.runSchedulerTick().catch((error: Error) => {
      logger.error('Scheduler tick failed', error.stack);
    });
  }, SCHEDULER_TICK_MS);

  logger.log('Worker process started — consuming send/webhook/import queues.');
}

void bootstrap();
