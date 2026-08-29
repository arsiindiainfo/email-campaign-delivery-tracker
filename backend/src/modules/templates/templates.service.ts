// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { hasUnsubscribeTag } from '../../common/utils/merge-fields.util';
import { CampaignStatus } from '../../shared/enums/campaign-status.enum';
import {
  DuplicateNameException,
  TemplateNotFoundException,
} from '../../shared/exceptions/domain.exception';
import { AuditService } from '../audit/audit.service';
import { CampaignsRepository } from '../campaigns/campaigns.repository';
import { CreateTemplateDto } from './dto/create-template.dto';
import {
  TemplateResponseDto,
  TemplateSummaryDto,
} from './dto/template-response.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesRepository } from './templates.repository';
import { TemplateDocument } from './schemas/template.schema';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly templatesRepository: TemplatesRepository,
    private readonly auditService: AuditService,
    @Inject(forwardRef(() => CampaignsRepository))
    private readonly campaignsRepository: CampaignsRepository,
  ) {}

  async create(
    organizationId: string,
    userId: string,
    dto: CreateTemplateDto,
  ): Promise<TemplateResponseDto> {
    this.assertUnsubscribeTag(dto.htmlBody);
    if (await this.templatesRepository.nameTaken(organizationId, dto.name)) {
      throw new DuplicateNameException(
        'A template with that name already exists',
      );
    }
    const template = await this.templatesRepository.create(organizationId, dto);
    this.auditService.record(
      organizationId,
      userId,
      'CREATE',
      'Template',
      template.id as string,
      undefined,
      dto,
    );
    return TemplateResponseDto.fromDocument(template);
  }

  async list(
    organizationId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<TemplateSummaryDto>> {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }
    const sortField =
      query.sort && ['name', 'updatedAt', 'createdAt'].includes(query.sort)
        ? query.sort
        : 'updatedAt';
    const { data, total } = await this.templatesRepository.paginate(
      organizationId,
      filter,
      {
        skip: query.skip,
        limit: query.limit,
        sort: { [sortField]: query.direction === 'asc' ? 1 : -1 },
      },
    );
    return new PaginatedResponse(
      data.map((doc) => TemplateSummaryDto.fromDocument(doc)),
      total,
      query.page,
      query.limit,
    );
  }

  async getOne(
    organizationId: string,
    id: string,
  ): Promise<TemplateResponseDto> {
    const template = await this.getActiveOrThrow(organizationId, id);
    return TemplateResponseDto.fromDocument(template);
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    dto: UpdateTemplateDto,
  ): Promise<TemplateResponseDto> {
    const before = await this.getActiveOrThrow(organizationId, id);
    if (dto.htmlBody !== undefined) {
      this.assertUnsubscribeTag(dto.htmlBody);
    }
    if (
      dto.name &&
      (await this.templatesRepository.nameTaken(organizationId, dto.name, id))
    ) {
      throw new DuplicateNameException(
        'A template with that name already exists',
      );
    }
    await this.assertNotReferencedByNonDraftCampaign(organizationId, id);

    const updated = await this.templatesRepository.updateById(
      organizationId,
      id,
      dto,
    );
    if (!updated) {
      throw new TemplateNotFoundException();
    }
    this.auditService.record(
      organizationId,
      userId,
      'UPDATE',
      'Template',
      id,
      { name: before.name, subject: before.subject },
      dto,
    );
    return TemplateResponseDto.fromDocument(updated);
  }

  async softDelete(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<void> {
    await this.getActiveOrThrow(organizationId, id);
    await this.assertNotReferencedByAnyCampaign(organizationId, id);
    await this.templatesRepository.updateById(organizationId, id, {
      deletedAt: new Date(),
    });
    this.auditService.record(organizationId, userId, 'DELETE', 'Template', id);
  }

  private async getActiveOrThrow(
    organizationId: string,
    id: string,
  ): Promise<TemplateDocument> {
    const template = await this.templatesRepository.findActiveById(
      organizationId,
      id,
    );
    if (!template) {
      throw new TemplateNotFoundException();
    }
    return template;
  }

  /** §15 — update is blocked while the template is referenced by a non-draft campaign. */
  private async assertNotReferencedByNonDraftCampaign(
    organizationId: string,
    templateId: string,
  ): Promise<void> {
    const referenced = await this.campaignsRepository.exists(organizationId, {
      templateId,
      status: { $ne: CampaignStatus.DRAFT },
      deletedAt: { $exists: false },
    });
    if (referenced) {
      throw new BadRequestException(
        'This template is used by a non-draft campaign and cannot be edited',
      );
    }
  }

  /** §15 — delete is blocked if referenced by any campaign at all. */
  private async assertNotReferencedByAnyCampaign(
    organizationId: string,
    templateId: string,
  ): Promise<void> {
    const referenced = await this.campaignsRepository.exists(organizationId, {
      templateId,
      deletedAt: { $exists: false },
    });
    if (referenced) {
      throw new BadRequestException(
        'This template is used by a campaign and cannot be deleted',
      );
    }
  }

  private assertUnsubscribeTag(html: string): void {
    if (!hasUnsubscribeTag(html)) {
      throw new BadRequestException(
        'Every template needs an unsubscribe link — insert {{unsubscribeUrl}}',
      );
    }
  }
}
