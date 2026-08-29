// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { AppConfig } from '../../config/configuration';
import { InvalidWebhookSignatureException } from '../../shared/exceptions/domain.exception';
import { QueueService } from '../queue/queue.service';
import { isValidWebhookSignature } from './sns-signature.util';
import { WebhookLogsRepository } from './webhook-logs.repository';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly webhookLogsRepository: WebhookLogsRepository,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  /**
   * §17 — this endpoint only ever rejects on a bad signature; every other
   * failure mode is absorbed here and handled later via the queue's own
   * retry/DLQ, because ESPs disable a webhook endpoint that returns errors.
   */
  async handleSesWebhook(
    rawBody: Buffer,
    signatureHeader: string | undefined,
  ): Promise<{ accepted: true; duplicate: boolean }> {
    const secret = this.configService.get('sns.webhookSigningSecret', {
      infer: true,
    })!;
    if (!isValidWebhookSignature(rawBody, signatureHeader, secret)) {
      throw new InvalidWebhookSignatureException();
    }

    const payloadHash = createHash('sha256').update(rawBody).digest('hex');
    const isNew = await this.webhookLogsRepository.recordIfNew(
      payloadHash,
      rawBody.toString('utf8'),
    );
    if (!isNew) {
      return { accepted: true, duplicate: true };
    }

    await this.queueService.send(
      this.configService.get('sqs.webhookQueueUrl', { infer: true })!,
      JSON.parse(rawBody.toString('utf8')) as unknown,
    );
    return { accepted: true, duplicate: false };
  }
}
