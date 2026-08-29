// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { QueueService } from '../queue/queue.service';

export interface SendJobMessage {
  organizationId: string;
  campaignId: string;
  campaignRecipientId: string;
}

@Injectable()
export class SendQueueProducer {
  constructor(
    private readonly queueService: QueueService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async enqueue(message: SendJobMessage): Promise<void> {
    await this.queueService.send(
      this.configService.get('sqs.sendQueueUrl', { infer: true })!,
      message,
    );
  }
}
