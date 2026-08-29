// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { OrgScopedRepository } from '../../common/repositories/org-scoped.repository';
import { toSetUpdate } from '../../common/utils/mongo-update.util';
import { CampaignStatus } from '../../shared/enums/campaign-status.enum';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';

@Injectable()
export class CampaignsRepository extends OrgScopedRepository<CampaignDocument> {
  constructor(@InjectModel(Campaign.name) model: Model<CampaignDocument>) {
    super(model);
  }

  findActiveById(organizationId: string, id: string) {
    return this.findOne(organizationId, {
      _id: id,
      deletedAt: { $exists: false },
    });
  }

  async nameTaken(
    organizationId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    return this.exists(organizationId, {
      name,
      deletedAt: { $exists: false },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
  }

  /**
   * §15 optimistic locking: the update only applies if `version` still matches
   * what the client last read; a mismatch (someone else edited it since) returns
   * null so the service can surface 409 VERSION_CONFLICT instead of silently
   * clobbering the other writer's change.
   */
  async updateWithVersionCheck(
    organizationId: string,
    id: string,
    expectedVersion: number,
    update: UpdateQuery<CampaignDocument>,
  ): Promise<CampaignDocument | null> {
    const patch = toSetUpdate(update) as Record<string, unknown>;
    const setClause = (patch.$set as Record<string, unknown>) ?? {};
    return this.model
      .findOneAndUpdate(
        { _id: id, organizationId, version: expectedVersion },
        { ...patch, $set: setClause, $inc: { version: 1 } },
        { new: true },
      )
      .exec();
  }

  /** Same version-safe increment, without the version *check* — used for state transitions the service already validated. */
  async updateAndBumpVersion(
    organizationId: string,
    id: string,
    update: Record<string, unknown>,
  ): Promise<CampaignDocument | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, organizationId },
        { $set: update, $inc: { version: 1 } },
        { new: true },
      )
      .exec();
  }

  /**
   * `stats` is a derived cache (§7.3), not a business field guarded by
   * optimistic locking — every event handler increments it directly and
   * never touches `version`.
   */
  async incrementStat(
    campaignId: string,
    statField: string,
    delta = 1,
  ): Promise<void> {
    await this.model
      .updateOne(
        { _id: campaignId },
        { $inc: { [`stats.${statField}`]: delta } },
      )
      .exec();
  }

  /**
   * Cross-tenant by design — this backs the worker's scheduled-send poller
   * (§15 "a CloudWatch Events rule... triggers the send at the target time"),
   * which is an internal system process, not a user-facing lookup.
   */
  findDueScheduled(now: Date) {
    return this.model
      .find({ status: CampaignStatus.SCHEDULED, scheduledAt: { $lte: now } })
      .exec();
  }
}
