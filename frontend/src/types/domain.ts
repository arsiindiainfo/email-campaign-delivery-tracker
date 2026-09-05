// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
export type Role = 'OWNER' | 'ADMIN' | 'MARKETER' | 'ANALYST';

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'PAUSED' | 'SENT' | 'CANCELLED';

export type RecipientStatus =
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'OPENED'
  | 'CLICKED'
  | 'BOUNCED'
  | 'COMPLAINED'
  | 'FAILED'
  | 'UNSUBSCRIBED';

export type SuppressionReason = 'bounced' | 'complained' | 'unsubscribed' | 'manual';

export type ContactStatus = 'ACTIVE' | 'SUPPRESSED';

export type ImportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  isPlatformAdmin?: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  senderDomain?: string;
  senderEmail?: string;
  senderVerified: boolean;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSummary {
  id: string;
  name: string;
  subject: string;
  updatedAt: string;
}

export interface ContactList {
  id: string;
  name: string;
  contactCount: number;
  createdAt: string;
}

export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: ContactStatus;
  createdAt: string;
}

export interface CampaignStats {
  queued: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
  unsubscribed: number;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  templateId: string;
  listIds: string[];
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  stats: CampaignStats;
  version: number;
  createdAt: string;
}

export interface CampaignSummary {
  id: string;
  name: string;
  status: CampaignStatus;
  listIds: string[];
  scheduledAt?: string;
  sentAt?: string;
  openRate: number;
  clickRate: number;
}

export interface Recipient {
  id: string;
  email: string;
  status: RecipientStatus;
  lastEventAt?: string;
}

export interface Suppression {
  id: string;
  email: string;
  reason: SuppressionReason;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface HourlyPoint {
  hour: number;
  opened: number;
  clicked: number;
}

export interface CampaignAnalytics extends AnalyticsOverview {
  series: HourlyPoint[];
}

export interface ImportJob {
  id: string;
  listId: string;
  status: ImportJobStatus;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  skippedSamples: string[];
  errorMessage?: string;
}
