// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { AppConfig } from '../../config/configuration';
import { CampaignStatus } from '../../shared/enums/campaign-status.enum';
import { EventSource, EventType } from '../../shared/enums/event-type.enum';
import { RecipientStatus } from '../../shared/enums/recipient-status.enum';
import {
  CampaignNotFoundException,
  DuplicateNameException,
  InvalidStateTransitionException,
  ListNotFoundException,
  SenderNotVerifiedException,
  TemplateNotFoundException,
  VersionConflictException,
} from '../../shared/exceptions/domain.exception';
import {
  hasUnsubscribeTag,
  renderMergeFields,
  SAMPLE_MERGE_FIELD_VALUES,
} from '../../common/utils/merge-fields.util';
import {
  injectTrackingPixel,
  rewriteLinksForClickTracking,
} from '../../common/utils/email-render.util';
import { AuditService } from '../audit/audit.service';
import { ContactsRepository } from '../contacts/contacts.repository';
import { ListsRepository } from '../contacts/lists.repository';
import { EventsService } from '../events/events.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { EMAIL_PROVIDER } from '../sending/email-provider.interface';
import type { EmailProvider } from '../sending/email-provider.interface';
import {
  SendJobMessage,
  SendQueueProducer,
} from '../sending/send-queue.producer';
import { SuppressionsService } from '../suppressions/suppressions.service';
import { TemplatesRepository } from '../templates/templates.repository';
import { CampaignRecipientsRepository } from './campaign-recipients.repository';
import { CampaignsRepository } from './campaigns.repository';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import {
  CampaignResponseDto,
  CampaignSummaryDto,
} from './dto/campaign-response.dto';
import { ListCampaignsQueryDto } from './dto/list-campaigns-query.dto';
import { ListRecipientsQueryDto } from './dto/list-recipients-query.dto';
import { RecipientResponseDto } from './dto/recipient-response.dto';
import { ScheduleCampaignDto } from './dto/schedule-campaign.dto';
import { SendTestDto } from './dto/send-test.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignDocument } from './schemas/campaign.schema';

const EDITABLE_ONLY_IN_DRAFT =
  'Editing is only allowed while the campaign is DRAFT';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly campaignsRepository: CampaignsRepository,
    private readonly campaignRecipientsRepository: CampaignRecipientsRepository,
    private readonly templatesRepository: TemplatesRepository,
    private readonly listsRepository: ListsRepository,
    private readonly contactsRepository: ContactsRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly suppressionsService: SuppressionsService,
    private readonly auditService: AuditService,
    private readonly sendQueueProducer: SendQueueProducer,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async create(
    organizationId: string,
    userId: string,
    dto: CreateCampaignDto,
  ): Promise<CampaignResponseDto> {
    await this.assertTemplateExists(organizationId, dto.templateId);
    await this.assertListsExist(organizationId, dto.listIds);
    await this.assertSenderVerified(organizationId, dto.fromEmail);
    if (await this.campaignsRepository.nameTaken(organizationId, dto.name)) {
      throw new DuplicateNameException(
        'A campaign with that name already exists',
      );
    }

    const campaign = await this.campaignsRepository.create(organizationId, {
      ...dto,
      createdBy: userId,
    });
    this.auditService.record(
      organizationId,
      userId,
      'CREATE',
      'Campaign',
      campaign.id as string,
      undefined,
      dto,
    );
    return CampaignResponseDto.fromDocument(campaign);
  }

  async list(organizationId: string, query: ListCampaignsQueryDto) {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (query.status) filter.status = query.status;
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };
    const allowedSort = ['createdAt', 'scheduledAt', 'name'];
    const sortField =
      query.sort && allowedSort.includes(query.sort) ? query.sort : 'createdAt';

    const { data, total } = await this.campaignsRepository.paginate(
      organizationId,
      filter,
      {
        skip: query.skip,
        limit: query.limit,
        sort: { [sortField]: query.direction === 'asc' ? 1 : -1 },
      },
    );
    return new PaginatedResponse(
      data.map((doc) => CampaignSummaryDto.fromDocument(doc)),
      total,
      query.page,
      query.limit,
    );
  }

  async getOne(
    organizationId: string,
    id: string,
  ): Promise<CampaignResponseDto> {
    return CampaignResponseDto.fromDocument(
      await this.getActiveOrThrow(organizationId, id),
    );
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    dto: UpdateCampaignDto,
  ): Promise<CampaignResponseDto> {
    const existing = await this.getActiveOrThrow(organizationId, id);
    if (existing.status !== CampaignStatus.DRAFT) {
      throw new InvalidStateTransitionException(EDITABLE_ONLY_IN_DRAFT);
    }
    if (dto.templateId)
      await this.assertTemplateExists(organizationId, dto.templateId);
    if (dto.listIds) await this.assertListsExist(organizationId, dto.listIds);
    if (dto.fromEmail)
      await this.assertSenderVerified(organizationId, dto.fromEmail);
    if (
      dto.name &&
      (await this.campaignsRepository.nameTaken(organizationId, dto.name, id))
    ) {
      throw new DuplicateNameException(
        'A campaign with that name already exists',
      );
    }

    const { version, ...patch } = dto;
    const updated = await this.campaignsRepository.updateWithVersionCheck(
      organizationId,
      id,
      version,
      patch,
    );
    if (!updated) {
      throw new VersionConflictException();
    }
    this.auditService.record(
      organizationId,
      userId,
      'UPDATE',
      'Campaign',
      id,
      undefined,
      patch,
    );
    return CampaignResponseDto.fromDocument(updated);
  }

  async remove(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<void> {
    const campaign = await this.getActiveOrThrow(organizationId, id);
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new InvalidStateTransitionException(
        'Only a draft campaign can be deleted',
      );
    }
    await this.campaignsRepository.updateById(organizationId, id, {
      deletedAt: new Date(),
    });
    this.auditService.record(organizationId, userId, 'DELETE', 'Campaign', id);
  }

  async sendTest(
    organizationId: string,
    id: string,
    dto: SendTestDto,
  ): Promise<{ sent: number }> {
    const campaign = await this.getActiveOrThrow(organizationId, id);
    const template = await this.templatesRepository.findActiveById(
      organizationId,
      campaign.templateId.toString(),
    );
    if (!template) {
      throw new TemplateNotFoundException();
    }

    const html = renderMergeFields(
      template.htmlBody,
      SAMPLE_MERGE_FIELD_VALUES,
    );
    await Promise.all(
      dto.emails.map((to) =>
        this.emailProvider.send({
          to,
          fromName: campaign.fromName,
          fromEmail: campaign.fromEmail,
          subject: `[TEST] ${campaign.subject}`,
          html,
        }),
      ),
    );
    return { sent: dto.emails.length };
  }

  async schedule(
    organizationId: string,
    id: string,
    dto: ScheduleCampaignDto,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.getActiveOrThrow(organizationId, id);
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new InvalidStateTransitionException(
        'Only a draft campaign can be scheduled',
      );
    }
    await this.assertSenderVerified(organizationId, campaign.fromEmail);

    const scheduledAt = dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : new Date();
    if (dto.scheduledAt && scheduledAt.getTime() <= Date.now()) {
      throw new InvalidStateTransitionException(
        'scheduledAt must be in the future',
      );
    }

    if (!dto.scheduledAt) {
      return CampaignResponseDto.fromDocument(
        await this.startSending(organizationId, id),
      );
    }

    const updated = await this.campaignsRepository.updateAndBumpVersion(
      organizationId,
      id,
      {
        status: CampaignStatus.SCHEDULED,
        scheduledAt,
      },
    );
    return CampaignResponseDto.fromDocument(updated!);
  }

  async pause(
    organizationId: string,
    id: string,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.getActiveOrThrow(organizationId, id);
    if (campaign.status !== CampaignStatus.SENDING) {
      throw new InvalidStateTransitionException(
        'Only a sending campaign can be paused',
      );
    }
    const updated = await this.campaignsRepository.updateAndBumpVersion(
      organizationId,
      id,
      {
        status: CampaignStatus.PAUSED,
      },
    );
    return CampaignResponseDto.fromDocument(updated!);
  }

  async resume(
    organizationId: string,
    id: string,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.getActiveOrThrow(organizationId, id);
    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new InvalidStateTransitionException(
        'Only a paused campaign can be resumed',
      );
    }
    const updated = await this.campaignsRepository.updateAndBumpVersion(
      organizationId,
      id,
      {
        status: CampaignStatus.SENDING,
      },
    );
    const stillQueued =
      await this.campaignRecipientsRepository.findQueuedByCampaign(
        organizationId,
        id,
      );
    await Promise.all(
      stillQueued.map((recipient) =>
        this.sendQueueProducer.enqueue({
          organizationId,
          campaignId: id,
          campaignRecipientId: recipient.id as string,
        }),
      ),
    );
    return CampaignResponseDto.fromDocument(updated!);
  }

  async cancel(
    organizationId: string,
    id: string,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.getActiveOrThrow(organizationId, id);
    if (
      ![
        CampaignStatus.DRAFT,
        CampaignStatus.SCHEDULED,
        CampaignStatus.PAUSED,
      ].includes(campaign.status)
    ) {
      throw new InvalidStateTransitionException(
        'Only a draft, scheduled, or paused campaign can be cancelled',
      );
    }
    const updated = await this.campaignsRepository.updateAndBumpVersion(
      organizationId,
      id,
      {
        status: CampaignStatus.CANCELLED,
      },
    );
    return CampaignResponseDto.fromDocument(updated!);
  }

  async listRecipients(
    organizationId: string,
    id: string,
    query: ListRecipientsQueryDto,
  ): Promise<PaginatedResponse<RecipientResponseDto>> {
    await this.getActiveOrThrow(organizationId, id);
    const filter: Record<string, unknown> = { campaignId: id };
    if (query.status) filter.status = query.status;
    const { data, total } = await this.campaignRecipientsRepository.paginate(
      organizationId,
      filter,
      {
        skip: query.skip,
        limit: query.limit,
      },
    );
    return new PaginatedResponse(
      data.map((doc) => RecipientResponseDto.fromDocument(doc)),
      total,
      query.page,
      query.limit,
    );
  }

  /**
   * Runs on the worker process on a short interval, standing in for the real
   * CloudWatch Events rule described in §15 that would trigger a scheduled
   * campaign's send at its target time.
   */
  async runSchedulerTick(): Promise<void> {
    const due = await this.campaignsRepository.findDueScheduled(new Date());
    for (const campaign of due) {
      try {
        await this.startSending(
          campaign.organizationId.toString(),
          campaign.id as string,
        );
      } catch (error) {
        this.logger.error(
          `Failed to start scheduled send for campaign ${campaign.id as string}`,
          error as Error,
        );
      }
    }
  }

  /** Resolves recipients, writes campaign_recipients + QUEUED events, enqueues send jobs, flips DRAFT/SCHEDULED → SENDING. */
  async startSending(
    organizationId: string,
    campaignId: string,
  ): Promise<CampaignDocument> {
    const campaign = await this.getActiveOrThrow(organizationId, campaignId);
    const contacts = await this.contactsRepository.findActiveInLists(
      organizationId,
      campaign.listIds.map((id) => id.toString()),
    );

    const inserted = await this.campaignRecipientsRepository.insertMany(
      contacts.map((contact) => ({
        organizationId,
        campaignId,
        contactId: contact.id as string,
        email: contact.email,
        trackingToken: randomUUID(),
      })),
    );

    await this.eventsService.recordQueuedBatch(
      organizationId,
      campaignId,
      inserted.map((r) => r.id as string),
    );

    await Promise.all(
      inserted.map((recipient) =>
        this.sendQueueProducer.enqueue({
          organizationId,
          campaignId,
          campaignRecipientId: recipient.id as string,
        }),
      ),
    );

    return (await this.campaignsRepository.updateAndBumpVersion(
      organizationId,
      campaignId,
      {
        status: CampaignStatus.SENDING,
        sentAt: new Date(),
      },
    ))!;
  }

  /** Runs on the worker process for every send-queue message (one per recipient). */
  async processSendJob(message: SendJobMessage): Promise<void> {
    const { organizationId, campaignId, campaignRecipientId } = message;
    const campaign = await this.campaignsRepository.findById(
      organizationId,
      campaignId,
    );
    if (
      !campaign ||
      campaign.status === CampaignStatus.CANCELLED ||
      campaign.status === CampaignStatus.PAUSED
    ) {
      this.logger.log(
        `Skipping send for recipient ${campaignRecipientId} — campaign is ${campaign?.status ?? 'missing'}`,
      );
      return;
    }

    const recipient = await this.campaignRecipientsRepository.findById(
      organizationId,
      campaignRecipientId,
    );
    if (!recipient || recipient.status !== RecipientStatus.QUEUED) {
      return;
    }

    if (
      await this.suppressionsService.isSuppressed(
        organizationId,
        recipient.email,
      )
    ) {
      await this.eventsService.applyEvent({
        organizationId,
        campaignId,
        campaignRecipientId,
        email: recipient.email,
        type: EventType.FAILED,
        source: EventSource.WORKER,
      });
      await this.maybeCompleteSending(organizationId, campaignId);
      return;
    }

    const template = await this.templatesRepository.findActiveById(
      organizationId,
      campaign.templateId.toString(),
    );
    const contact = await this.contactsRepository.findById(
      organizationId,
      recipient.contactId.toString(),
    );
    if (!template || !contact) {
      await this.eventsService.applyEvent({
        organizationId,
        campaignId,
        campaignRecipientId,
        email: recipient.email,
        type: EventType.FAILED,
        source: EventSource.WORKER,
      });
      await this.maybeCompleteSending(organizationId, campaignId);
      return;
    }

    const publicBaseUrl = this.configService.get('publicBaseUrl', {
      infer: true,
    })!;
    const appBaseUrl = this.configService.get('appBaseUrl', { infer: true })!;
    let html = renderMergeFields(template.htmlBody, {
      firstName: contact.firstName ?? 'there',
      lastName: contact.lastName ?? '',
      unsubscribeUrl: `${appBaseUrl}/unsubscribe/${recipient.trackingToken}`,
    });
    if (!hasUnsubscribeTag(template.htmlBody)) {
      this.logger.warn(
        `Template ${template.id as string} has no unsubscribe tag — sending anyway (should be unreachable)`,
      );
    }
    html = rewriteLinksForClickTracking(
      html,
      `${publicBaseUrl}/t/c`,
      recipient.trackingToken,
    );
    html = injectTrackingPixel(
      html,
      `${publicBaseUrl}/t/o/${recipient.trackingToken}`,
    );

    try {
      const result = await this.emailProvider.send({
        to: recipient.email,
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail,
        subject: campaign.subject,
        html,
      });
      if (result.providerMessageId) {
        await this.campaignRecipientsRepository.setProviderMessageId(
          campaignRecipientId,
          result.providerMessageId,
        );
      }
      await this.eventsService.applyEvent({
        organizationId,
        campaignId,
        campaignRecipientId,
        email: recipient.email,
        type: EventType.SENT,
        source: EventSource.WORKER,
      });
    } catch (error) {
      this.logger.error(
        `Send failed for recipient ${campaignRecipientId}`,
        error as Error,
      );
      await this.eventsService.applyEvent({
        organizationId,
        campaignId,
        campaignRecipientId,
        email: recipient.email,
        type: EventType.FAILED,
        source: EventSource.WORKER,
      });
    }

    await this.maybeCompleteSending(organizationId, campaignId);
  }

  private async maybeCompleteSending(
    organizationId: string,
    campaignId: string,
  ): Promise<void> {
    const remaining =
      await this.campaignRecipientsRepository.countByCampaignAndStatus(
        campaignId,
        RecipientStatus.QUEUED,
      );
    if (remaining > 0) return;
    const campaign = await this.campaignsRepository.findById(
      organizationId,
      campaignId,
    );
    if (campaign?.status === CampaignStatus.SENDING) {
      await this.campaignsRepository.updateAndBumpVersion(
        organizationId,
        campaignId,
        {
          status: CampaignStatus.SENT,
        },
      );
    }
  }

  private async getActiveOrThrow(
    organizationId: string,
    id: string,
  ): Promise<CampaignDocument> {
    const campaign = await this.campaignsRepository.findActiveById(
      organizationId,
      id,
    );
    if (!campaign) {
      throw new CampaignNotFoundException();
    }
    return campaign;
  }

  private async assertTemplateExists(
    organizationId: string,
    templateId: string,
  ): Promise<void> {
    const template = await this.templatesRepository.findActiveById(
      organizationId,
      templateId,
    );
    if (!template) {
      throw new TemplateNotFoundException();
    }
  }

  private async assertListsExist(
    organizationId: string,
    listIds: string[],
  ): Promise<void> {
    for (const listId of listIds) {
      const list = await this.listsRepository.findActiveById(
        organizationId,
        listId,
      );
      if (!list) {
        throw new ListNotFoundException();
      }
    }
  }

  private async assertSenderVerified(
    organizationId: string,
    fromEmail: string,
  ): Promise<void> {
    if (
      !(await this.organizationsService.isFromEmailVerified(
        organizationId,
        fromEmail,
      ))
    ) {
      throw new SenderNotVerifiedException();
    }
  }
}
