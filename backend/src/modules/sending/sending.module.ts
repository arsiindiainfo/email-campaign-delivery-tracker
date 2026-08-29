// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { QueueModule } from '../queue/queue.module';
import { EMAIL_PROVIDER } from './email-provider.interface';
import { SesEmailProvider } from './providers/ses-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { SendQueueProducer } from './send-queue.producer';

@Module({
  imports: [QueueModule],
  providers: [
    SmtpEmailProvider,
    SesEmailProvider,
    SendQueueProducer,
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService, SmtpEmailProvider, SesEmailProvider],
      useFactory: (
        configService: ConfigService<AppConfig>,
        smtp: SmtpEmailProvider,
        ses: SesEmailProvider,
      ) => {
        const provider = configService.get('email.provider', { infer: true });
        const nodeEnv = configService.get('nodeEnv', { infer: true });
        if (provider === 'ses' && nodeEnv !== 'production') {
          // §30 risk mitigation: a real SES key must never be reachable outside production.
          throw new Error(
            'EMAIL_PROVIDER=ses is only permitted when NODE_ENV=production — use smtp (Mailhog) everywhere else.',
          );
        }
        return provider === 'ses' ? ses : smtp;
      },
    },
  ],
  exports: [EMAIL_PROVIDER, SendQueueProducer],
})
export class SendingModule {}
