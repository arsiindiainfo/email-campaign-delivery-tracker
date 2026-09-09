// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
export interface SendEmailParams {
  to: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  html: string;
  /** Plain-text alternative — spam filters generally score multipart html+text mail better than html-only. */
  text?: string;
}

export interface SendEmailResult {
  providerMessageId: string;
}

/** Swappable without touching call sites — SES in production, SMTP/Mailhog everywhere else (§27, §5). */
export interface EmailProvider {
  send(params: SendEmailParams): Promise<SendEmailResult>;
}

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');

/**
 * The system's own transactional email (registration verification, admin
 * notification) — deliberately a separate token from EMAIL_PROVIDER, which
 * campaigns.service.ts uses for real customer campaign sends and must stay
 * on SES: that's the only provider this app's bounce/complaint tracking
 * (SNS -> SQS webhook pipeline) knows how to consume. Switching this one
 * to Resend doesn't touch that.
 */
export const SYSTEM_EMAIL_PROVIDER = Symbol('SYSTEM_EMAIL_PROVIDER');
