// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventSource, EventType } from '../../shared/enums/event-type.enum';
import { Event, EventDocument, EventMeta } from './schemas/event.schema';

export const DUPLICATE_KEY_ERROR_CODE = 11000;

export interface NewEvent {
  organizationId: string;
  campaignId: string;
  campaignRecipientId: string;
  type: EventType;
  source: EventSource;
  occurredAt: Date;
  meta?: EventMeta;
  providerEventId?: string;
}

@Injectable()
export class EventsRepository {
  constructor(
    @InjectModel(Event.name) private readonly model: Model<EventDocument>,
  ) {}

  /** Returns false (never throws) when a (recipient, type, providerEventId) duplicate is caught (§9.3). */
  async insert(event: NewEvent): Promise<boolean> {
    try {
      await this.model.create(event);
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY_ERROR_CODE) {
        return false;
      }
      throw error;
    }
  }

  findForCampaign(campaignId: string, from?: Date, to?: Date) {
    const filter: Record<string, unknown> = { campaignId };
    if (from || to) {
      filter.occurredAt = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }
    return this.model.find(filter).sort({ occurredAt: 1 }).exec();
  }

  aggregateByType(
    organizationId: string,
    from: Date,
    to: Date,
    campaignId?: string,
  ) {
    return this.model
      .aggregate<{ _id: string; count: number }>([
        {
          $match: {
            organizationId: new Types.ObjectId(organizationId),
            occurredAt: { $gte: from, $lte: to },
            ...(campaignId
              ? { campaignId: new Types.ObjectId(campaignId) }
              : {}),
          },
        },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ])
      .exec();
  }

  /** Hourly opens/clicks series for the campaign detail chart's first 48h (§19). */
  aggregateHourlySeries(campaignId: string, since: Date, until: Date) {
    return this.model
      .aggregate<{ _id: { hour: number; type: EventType }; count: number }>([
        {
          $match: {
            campaignId: new Types.ObjectId(campaignId),
            type: { $in: [EventType.OPENED, EventType.CLICKED] },
            occurredAt: { $gte: since, $lte: until },
          },
        },
        {
          $group: {
            _id: {
              hour: {
                $floor: {
                  $divide: [
                    { $subtract: ['$occurredAt', since] },
                    1000 * 60 * 60,
                  ],
                },
              },
              type: '$type',
            },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();
  }
}
