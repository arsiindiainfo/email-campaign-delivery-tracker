// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebhookLog, WebhookLogDocument } from './schemas/webhook-log.schema';

const DUPLICATE_KEY_ERROR_CODE = 11000;

@Injectable()
export class WebhookLogsRepository {
  constructor(
    @InjectModel(WebhookLog.name)
    private readonly model: Model<WebhookLogDocument>,
  ) {}

  /** Atomic insert-if-absent — returns false on a duplicate hash instead of a separate exists+insert race. */
  async recordIfNew(payloadHash: string, rawBody: string): Promise<boolean> {
    try {
      await this.model.create({ payloadHash, rawBody });
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY_ERROR_CODE) {
        return false;
      }
      throw error;
    }
  }
}
