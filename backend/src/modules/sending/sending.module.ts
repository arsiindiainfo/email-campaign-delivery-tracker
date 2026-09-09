// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { QueueModule } from '../queue/queue.module';
import { EMAIL_PROVIDER, SYSTEM_EMAIL_PROVIDER } from './email-provider.interface';
import { ResendEmailProvider } from './providers/resend-email.provider';
import { SesEmailProvider } from './providers/ses-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { SendQueueProducer } from './send-queue.producer';

@Module({
  imports: [QueueModule],
  providers: [
    SmtpEmailProvider,
    SesEmailProvider,
    ResendEmailProvider,
    SendQueueProducer,
    {
      // Real customer campaign sends -- must stay SES/SMTP only; the
      // SNS -> SQS bounce/complaint webhook pipeline only understands SES's
      // event format.
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
    {
      // The system's own transactional email (registration verification,
      // admin notification) -- independent of the campaign provider above.
      // Resend in production (demo1.arsiindiainfo.com is a verified,
      // non-sandboxed sending identity); Mailhog everywhere else.
      provide: SYSTEM_EMAIL_PROVIDER,
      inject: [ConfigService, SmtpEmailProvider, ResendEmailProvider],
      useFactory: (
        configService: ConfigService<AppConfig>,
        smtp: SmtpEmailProvider,
        resend: ResendEmailProvider,
      ) => {
        const nodeEnv = configService.get('nodeEnv', { infer: true });
        return nodeEnv === 'production' ? resend : smtp;
      },
    },
  ],
  exports: [EMAIL_PROVIDER, SYSTEM_EMAIL_PROVIDER, SendQueueProducer],
})
export class SendingModule {}
