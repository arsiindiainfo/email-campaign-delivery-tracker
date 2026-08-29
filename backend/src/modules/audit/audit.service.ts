// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name) private readonly model: Model<AuditLogDocument>,
  ) {}

  /**
   * Fire-and-forget by design: an audit-write failure must never fail the
   * request that triggered it. Logged loudly instead so it's never silently lost.
   */
  record(
    organizationId: string,
    userId: string,
    action: AuditAction,
    entityType: string,
    entityId: string,
    before?: unknown,
    after?: unknown,
  ): void {
    this.model
      .create({
        organizationId,
        userId,
        action,
        entityType,
        entityId,
        before,
        after,
      })
      .catch((error: Error) => {
        this.logger.error(
          `Failed to write audit log for ${entityType}:${entityId}`,
          error.stack,
        );
      });
  }

  async list(
    organizationId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<AuditLogDocument>> {
    const filter = { organizationId };
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(query.skip)
        .limit(query.limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return new PaginatedResponse(data, total, query.page, query.limit);
  }
}
