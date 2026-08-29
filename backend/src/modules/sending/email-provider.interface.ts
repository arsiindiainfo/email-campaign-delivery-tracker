// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
export interface SendEmailParams {
  to: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  providerMessageId: string;
}

/** Swappable without touching call sites — SES in production, SMTP/Mailhog everywhere else (§27, §5). */
export interface EmailProvider {
  send(params: SendEmailParams): Promise<SendEmailResult>;
}

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
