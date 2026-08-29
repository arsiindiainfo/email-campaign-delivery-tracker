// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/configuration';
import {
  EmailProvider,
  SendEmailParams,
  SendEmailResult,
} from '../email-provider.interface';

@Injectable()
export class SesEmailProvider implements EmailProvider {
  private readonly client: SESClient;

  constructor(configService: ConfigService<AppConfig>) {
    const aws = configService.get('aws', { infer: true })!;
    this.client = new SESClient({
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

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const result = await this.client.send(
      new SendEmailCommand({
        Source: `${params.fromName} <${params.fromEmail}>`,
        Destination: { ToAddresses: [params.to] },
        Message: {
          Subject: { Data: params.subject },
          Body: { Html: { Data: params.html } },
        },
      }),
    );
    return { providerMessageId: result.MessageId ?? '' };
  }
}
