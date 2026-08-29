// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrgScopedRepository } from '../../common/repositories/org-scoped.repository';
import { SuppressionReason } from '../../shared/enums/suppression-reason.enum';
import { Suppression, SuppressionDocument } from './schemas/suppression.schema';

@Injectable()
export class SuppressionsRepository extends OrgScopedRepository<SuppressionDocument> {
  constructor(
    @InjectModel(Suppression.name) model: Model<SuppressionDocument>,
  ) {
    super(model);
  }

  isSuppressed(organizationId: string, email: string): Promise<boolean> {
    return this.exists(organizationId, { email: email.toLowerCase() });
  }

  /** Idempotent — a bounce/complaint/unsubscribe replay must never throw on a duplicate (§9.3, §18). */
  async upsert(
    organizationId: string,
    email: string,
    reason: SuppressionReason,
  ): Promise<void> {
    await this.model
      .updateOne(
        { organizationId, email: email.toLowerCase() },
        {
          $setOnInsert: { organizationId, email: email.toLowerCase(), reason },
        },
        { upsert: true },
      )
      .exec();
  }

  findByEmail(organizationId: string, email: string) {
    return this.findOne(organizationId, { email: email.toLowerCase() });
  }
}
