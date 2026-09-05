// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppConfig } from '../../config/configuration';
import {
  DemoRecipientNotAllowedException,
  DemoSendQuotaExceededException,
} from '../../shared/exceptions/domain.exception';
import { DemoSendLog, DemoSendLogDocument } from './schemas/demo-send-log.schema';

const SEED_DOMAIN = '@novamail.demo';

// Public-demo abuse guard: this app sends real email through a shared AWS
// SES account, so an unrestricted public deployment is an open spam vector.
// These caps keep the blast radius small regardless of what a self-registered
// visitor tries to do — see the conversation notes on why each limit exists.
const MAX_RECIPIENTS_PER_ACTION = 5;
const MAX_SENDS_PER_ROLLING_WINDOW = 20;
const ROLLING_WINDOW_MS = 30 * 60 * 1000;
const MAX_SENDS_LIFETIME_PER_ORG = 200;

@Injectable()
export class DemoSendGuardService {
  private readonly allowedRecipients: Set<string>;

  constructor(
    configService: ConfigService<AppConfig>,
    @InjectModel(DemoSendLog.name)
    private readonly demoSendLogModel: Model<DemoSendLogDocument>,
  ) {
    const demoGuard = configService.get('demoGuard', { infer: true })!;
    this.allowedRecipients = new Set(demoGuard.allowedRecipients);
  }

  private isAllowedRecipient(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    return (
      normalized.endsWith(SEED_DOMAIN) ||
      this.allowedRecipients.has(normalized)
    );
  }

  /** Strict check for explicit, hand-entered recipient lists (e.g. sendTest) — rejects the whole action if any address isn't allowed. */
  assertRecipientsAllowed(emails: string[]): void {
    const blocked = emails.filter((email) => !this.isAllowedRecipient(email));
    if (blocked.length > 0) {
      throw new DemoRecipientNotAllowedException(
        `Not allowed in this public demo: ${blocked.join(', ')}. Only @novamail.demo seed contacts or pre-approved test addresses can receive mail here.`,
      );
    }
  }

  /** Lenient filter for bulk campaign recipients — silently drops disallowed contacts rather than failing the whole send. */
  filterAllowedRecipients<T extends { email: string }>(
    contacts: T[],
  ): { allowed: T[]; blockedCount: number } {
    const allowed = contacts.filter((c) => this.isAllowedRecipient(c.email));
    return { allowed, blockedCount: contacts.length - allowed.length };
  }

  async assertWithinQuota(
    organizationId: string,
    requestedCount: number,
  ): Promise<void> {
    if (requestedCount > MAX_RECIPIENTS_PER_ACTION) {
      throw new DemoSendQuotaExceededException(
        `This public demo allows at most ${MAX_RECIPIENTS_PER_ACTION} recipients per send action.`,
      );
    }

    const orgId = new Types.ObjectId(organizationId);
    const windowStart = new Date(Date.now() - ROLLING_WINDOW_MS);

    const [recentAgg, lifetimeAgg] = await Promise.all([
      this.demoSendLogModel.aggregate<{ total: number }>([
        { $match: { organizationId: orgId, sentAt: { $gte: windowStart } } },
        { $group: { _id: null, total: { $sum: '$count' } } },
      ]),
      this.demoSendLogModel.aggregate<{ total: number }>([
        { $match: { organizationId: orgId } },
        { $group: { _id: null, total: { $sum: '$count' } } },
      ]),
    ]);

    const recentTotal = recentAgg[0]?.total ?? 0;
    const lifetimeTotal = lifetimeAgg[0]?.total ?? 0;

    if (recentTotal + requestedCount > MAX_SENDS_PER_ROLLING_WINDOW) {
      throw new DemoSendQuotaExceededException(
        `This public demo allows at most ${MAX_SENDS_PER_ROLLING_WINDOW} emails per 30 minutes per account — please wait and try again.`,
      );
    }
    if (lifetimeTotal + requestedCount > MAX_SENDS_LIFETIME_PER_ORG) {
      throw new DemoSendQuotaExceededException(
        `This public demo caps each account at ${MAX_SENDS_LIFETIME_PER_ORG} emails total.`,
      );
    }
  }

  async recordSend(organizationId: string, count: number): Promise<void> {
    if (count <= 0) return;
    await this.demoSendLogModel.create({
      organizationId: new Types.ObjectId(organizationId),
      count,
    });
  }
}
