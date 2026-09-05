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
  private readonly configurationSet: string;

  constructor(configService: ConfigService<AppConfig>) {
    const aws = configService.get('aws', { infer: true })!;
    const ses = configService.get('ses', { infer: true })!;
    this.configurationSet = ses.configurationSet;
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
        // Without this, SES sends outside the configuration set and never
        // publishes bounce/complaint/delivery events to the SNS→SQS
        // webhook pipeline — tracking silently stops working (§ SES setup).
        ConfigurationSetName: this.configurationSet || undefined,
      }),
    );
    return { providerMessageId: result.MessageId ?? '' };
  }
}
