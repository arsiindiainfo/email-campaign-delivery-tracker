// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Logger } from '@nestjs/common';

export interface QueueConsumerOptions {
  queueUrl: string;
  client: SQSClient;
  handler: (body: unknown, message: Message) => Promise<void>;
  logger?: Logger;
}

/**
 * Long-polls one queue forever. A handler that throws leaves the message
 * un-deleted so SQS's own visibility-timeout retry (and eventual DLQ
 * redrive after 5 attempts — §9.1) takes over; this loop never retries
 * in-process.
 */
export async function consumeQueueForever({
  queueUrl,
  client,
  handler,
  logger,
}: QueueConsumerOptions): Promise<never> {
  const log = logger ?? new Logger('QueueConsumer');
  if (!queueUrl) {
    log.warn(
      'No queue URL configured — consumer loop will not start for this queue.',
    );
    return new Promise<never>(() => {});
  }

  log.log(`Consuming ${queueUrl}`);
  for (;;) {
    try {
      const result = await client.send(
        new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 15,
          VisibilityTimeout: 30,
        }),
      );

      for (const message of result.Messages ?? []) {
        try {
          const body: unknown = message.Body
            ? JSON.parse(message.Body)
            : undefined;
          await handler(body, message);
          if (message.ReceiptHandle) {
            await client.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle,
              }),
            );
          }
        } catch (error) {
          log.error(
            `Handler failed for message ${message.MessageId ?? 'unknown'} — leaving for SQS retry/DLQ`,
            error as Error,
          );
        }
      }
    } catch (error) {
      log.error('Failed to poll queue, backing off', error as Error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
