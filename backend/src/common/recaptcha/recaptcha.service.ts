// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

interface SiteVerifyResponse {
  success: boolean;
}

/**
 * Google reCAPTCHA v2 verification, used to gate registration and login
 * against automated abuse. Skipped in tests — the checkbox widget can't run
 * headlessly, and a real verification call would hit Google's API from CI.
 */
@Injectable()
export class RecaptchaService {
  constructor(private readonly configService: ConfigService<AppConfig>) {}

  async verify(token: string): Promise<boolean> {
    if (this.configService.get('nodeEnv', { infer: true }) === 'test') {
      return true;
    }

    const secretKey = this.configService.get('recaptcha.secretKey', {
      infer: true,
    });
    if (!secretKey) {
      return false;
    }

    const body = new URLSearchParams({ secret: secretKey, response: token });
    try {
      const response = await fetch(VERIFY_URL, { method: 'POST', body });
      const data = (await response.json()) as SiteVerifyResponse;
      return data.success === true;
    } catch {
      return false;
    }
  }
}
