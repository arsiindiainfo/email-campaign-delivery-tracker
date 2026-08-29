// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';

/**
 * Thin producer wrapper around the SQS client shared by every module that
 * enqueues background work (sending, webhook ingestion, CSV import — §9).
 * Consumption happens only in worker.ts, never in the API process.
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  readonly client: SQSClient;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const aws = configService.get('aws', { infer: true })!;
    this.client = new SQSClient({
      region: aws.region,
      endpoint: aws.endpoint,
      credentials:
        aws.accessKeyId && aws.secretAccessKey
          ? {
              accessKeyId: aws.accessKeyId,
              secretAccessKey: aws.secretAccessKey,
            }
          : undefined,
    });
  }

  async send(queueUrl: string, payload: unknown): Promise<void> {
    if (!queueUrl) {
      this.logger.warn(
        'Attempted to enqueue a message with no queue URL configured — dropping.',
      );
      return;
    }
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
      }),
    );
  }
}
