// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsOverviewDto {
  @ApiProperty() totalSent: number;
  @ApiProperty() delivered: number;
  @ApiProperty() opened: number;
  @ApiProperty() clicked: number;
  @ApiProperty() bounced: number;
  @ApiProperty() complained: number;
  @ApiProperty() failed: number;
  @ApiProperty() unsubscribed: number;
  @ApiProperty() deliveryRate: number;
  @ApiProperty() openRate: number;
  @ApiProperty() clickRate: number;
  @ApiProperty() bounceRate: number;
}

export class HourlyPointDto {
  @ApiProperty() hour: number;
  @ApiProperty() opened: number;
  @ApiProperty() clicked: number;
}

export class CampaignAnalyticsDto extends AnalyticsOverviewDto {
  @ApiProperty({ type: [HourlyPointDto] })
  series: HourlyPointDto[];
}
