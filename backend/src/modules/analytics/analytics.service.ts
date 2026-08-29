// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { BadRequestException, Injectable } from '@nestjs/common';
import { CampaignsRepository } from '../campaigns/campaigns.repository';
import { EventsRepository } from '../events/events.repository';
import { EventType } from '../../shared/enums/event-type.enum';
import { CampaignNotFoundException } from '../../shared/exceptions/domain.exception';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import {
  AnalyticsOverviewDto,
  CampaignAnalyticsDto,
  HourlyPointDto,
} from './dto/analytics-overview.dto';

const MAX_RANGE_MONTHS = 12;
const HOURLY_SERIES_WINDOW_HOURS = 48;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly campaignsRepository: CampaignsRepository,
  ) {}

  async overview(
    organizationId: string,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsOverviewDto> {
    const { from, to } = this.resolveRange(query);
    const rows = await this.eventsRepository.aggregateByType(
      organizationId,
      from,
      to,
    );
    return this.buildOverview(rows);
  }

  async campaignAnalytics(
    organizationId: string,
    campaignId: string,
  ): Promise<CampaignAnalyticsDto> {
    const campaign = await this.campaignsRepository.findActiveById(
      organizationId,
      campaignId,
    );
    if (!campaign) {
      throw new CampaignNotFoundException();
    }

    const from = campaign.sentAt ?? campaign.createdAt ?? new Date();
    const to = new Date();
    const [totalsRows, hourlyRows] = await Promise.all([
      this.eventsRepository.aggregateByType(
        organizationId,
        from,
        to,
        campaignId,
      ),
      this.eventsRepository.aggregateHourlySeries(
        campaignId,
        from,
        new Date(
          Math.min(
            to.getTime(),
            from.getTime() + HOURLY_SERIES_WINDOW_HOURS * 60 * 60 * 1000,
          ),
        ),
      ),
    ]);

    const overview = this.buildOverview(totalsRows);
    const series = this.buildHourlySeries(hourlyRows);
    return { ...overview, series };
  }

  private buildOverview(
    rows: { _id: string; count: number }[],
  ): AnalyticsOverviewDto {
    const counts = Object.fromEntries(
      rows.map((r) => [r._id, r.count]),
    ) as Record<EventType, number>;
    const totalSent = counts[EventType.SENT] ?? 0;
    const delivered = counts[EventType.DELIVERED] ?? 0;
    const opened = counts[EventType.OPENED] ?? 0;
    const clicked = counts[EventType.CLICKED] ?? 0;
    const bounced = counts[EventType.BOUNCED] ?? 0;
    const complained = counts[EventType.COMPLAINED] ?? 0;
    const failed = counts[EventType.FAILED] ?? 0;
    const unsubscribed = counts[EventType.UNSUBSCRIBED] ?? 0;

    return {
      totalSent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      failed,
      unsubscribed,
      deliveryRate: rate(delivered, totalSent),
      openRate: rate(opened, delivered),
      clickRate: rate(clicked, delivered),
      bounceRate: rate(bounced, totalSent),
    };
  }

  private buildHourlySeries(
    rows: { _id: { hour: number; type: EventType }; count: number }[],
  ): HourlyPointDto[] {
    const byHour = new Map<number, HourlyPointDto>();
    for (const row of rows) {
      const hour = Math.max(
        0,
        Math.min(HOURLY_SERIES_WINDOW_HOURS - 1, row._id.hour),
      );
      const point = byHour.get(hour) ?? { hour, opened: 0, clicked: 0 };
      if (row._id.type === EventType.OPENED) point.opened += row.count;
      if (row._id.type === EventType.CLICKED) point.clicked += row.count;
      byHour.set(hour, point);
    }
    return Array.from(
      { length: HOURLY_SERIES_WINDOW_HOURS },
      (_, hour) => byHour.get(hour) ?? { hour, opened: 0, clicked: 0 },
    );
  }

  private resolveRange(query: AnalyticsQueryDto): { from: Date; to: Date } {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (from > to) {
      throw new BadRequestException('`from` must be before `to`');
    }
    const maxRangeMs = MAX_RANGE_MONTHS * 30 * 24 * 60 * 60 * 1000;
    if (to.getTime() - from.getTime() > maxRangeMs) {
      throw new BadRequestException(
        `Date range cannot exceed ${MAX_RANGE_MONTHS} months`,
      );
    }
    return { from, to };
  }
}

function rate(numerator: number, denominator: number): number {
  return denominator > 0
    ? Math.round((numerator / denominator) * 1000) / 10
    : 0;
}
