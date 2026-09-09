// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/configuration';
import {
  EmailProvider,
  SendEmailParams,
  SendEmailResult,
} from '../email-provider.interface';

/**
 * Replaces SesEmailProvider for the system's own transactional email
 * (registration verification, admin notification) -- SES requires
 * per-account production access approval, and sandbox mode rejects
 * sending to any recipient that isn't individually pre-verified, so real
 * visitors registering with their own address never received a
 * verification email while the request was pending. Resend has no such
 * sandbox once the sending domain is verified.
 */
@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly apiKey: string;

  constructor(configService: ConfigService<AppConfig>) {
    this.apiKey = configService.get('resend.apiKey', { infer: true }) ?? '';
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    if (!this.apiKey) {
      throw new Error('Resend send failed: resend.apiKey is not configured.');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${params.fromName} <${params.fromEmail}>`,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.text ? { text: params.text } : {}),
      }),
    });

    if (!response.ok) {
      const reason = await response.text();
      throw new Error(`Resend send failed (HTTP ${response.status}): ${reason}`);
    }

    const body = (await response.json()) as { id?: string };
    return { providerMessageId: body.id ?? '' };
  }
}
