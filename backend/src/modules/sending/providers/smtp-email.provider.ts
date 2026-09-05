// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { AppConfig } from '../../../config/configuration';
import {
  EmailProvider,
  SendEmailParams,
  SendEmailResult,
} from '../email-provider.interface';

/** Every non-production environment routes here — Mailhog, never a real inbox (§27 demo-safety callout). */
@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor(configService: ConfigService<AppConfig>) {
    const host = configService.get('email.smtpHost', { infer: true }) as string;
    const port = configService.get('email.smtpPort', { infer: true }) as number;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
    });
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const info: SMTPTransport.SentMessageInfo = await this.transporter.sendMail(
      {
        to: params.to,
        from: `${params.fromName} <${params.fromEmail}>`,
        subject: params.subject,
        html: params.html,
        text: params.text,
      },
    );
    return { providerMessageId: info.messageId };
  }
}
