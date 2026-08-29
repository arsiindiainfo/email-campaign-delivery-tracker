// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { toIdString } from '../../../common/utils/mongo.util';
import { CampaignStatus } from '../../../shared/enums/campaign-status.enum';
import { CampaignDocument, CampaignStats } from '../schemas/campaign.schema';

export class CampaignResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() subject: string;
  @ApiProperty() fromName: string;
  @ApiProperty() fromEmail: string;
  @ApiProperty() templateId: string;
  @ApiProperty({ type: [String] }) listIds: string[];
  @ApiProperty({ enum: CampaignStatus }) status: CampaignStatus;
  @ApiProperty({ required: false }) scheduledAt?: Date;
  @ApiProperty({ required: false }) sentAt?: Date;
  @ApiProperty() stats: CampaignStats;
  @ApiProperty() version: number;
  @ApiProperty() createdAt: Date;

  static fromDocument(doc: CampaignDocument): CampaignResponseDto {
    const dto = new CampaignResponseDto();
    dto.id = toIdString(doc._id);
    dto.name = doc.name;
    dto.subject = doc.subject;
    dto.fromName = doc.fromName;
    dto.fromEmail = doc.fromEmail;
    dto.templateId = toIdString(doc.templateId);
    dto.listIds = doc.listIds.map((id) => toIdString(id));
    dto.status = doc.status;
    dto.scheduledAt = doc.scheduledAt;
    dto.sentAt = doc.sentAt;
    dto.stats = doc.stats;
    dto.version = doc.version;
    dto.createdAt = doc.createdAt as Date;
    return dto;
  }
}

export class CampaignSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: CampaignStatus }) status: CampaignStatus;
  @ApiProperty({ type: [String] }) listIds: string[];
  @ApiProperty({ required: false }) scheduledAt?: Date;
  @ApiProperty({ required: false }) sentAt?: Date;
  @ApiProperty() openRate: number;
  @ApiProperty() clickRate: number;

  static fromDocument(doc: CampaignDocument): CampaignSummaryDto {
    const dto = new CampaignSummaryDto();
    dto.id = toIdString(doc._id);
    dto.name = doc.name;
    dto.status = doc.status;
    dto.listIds = doc.listIds.map((id) => toIdString(id));
    dto.scheduledAt = doc.scheduledAt;
    dto.sentAt = doc.sentAt;
    dto.openRate =
      doc.stats.delivered > 0
        ? round1((doc.stats.opened / doc.stats.delivered) * 100)
        : 0;
    dto.clickRate =
      doc.stats.delivered > 0
        ? round1((doc.stats.clicked / doc.stats.delivered) * 100)
        : 0;
    return dto;
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
