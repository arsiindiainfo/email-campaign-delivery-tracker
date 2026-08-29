// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CampaignStatus } from '../../shared/enums/campaign-status.enum';
import {
  DuplicateNameException,
  ListNotFoundException,
} from '../../shared/exceptions/domain.exception';
import { AuditService } from '../audit/audit.service';
import { CampaignsRepository } from '../campaigns/campaigns.repository';
import { CreateListDto } from './dto/create-list.dto';
import { ListResponseDto } from './dto/list-response.dto';
import { ListsRepository } from './lists.repository';
import { ContactListDocument } from './schemas/contact-list.schema';

const TERMINAL_CAMPAIGN_STATUSES = [
  CampaignStatus.SENT,
  CampaignStatus.CANCELLED,
];

@Injectable()
export class ListsService {
  constructor(
    private readonly listsRepository: ListsRepository,
    private readonly auditService: AuditService,
    @Inject(forwardRef(() => CampaignsRepository))
    private readonly campaignsRepository: CampaignsRepository,
  ) {}

  async create(
    organizationId: string,
    userId: string,
    dto: CreateListDto,
  ): Promise<ListResponseDto> {
    if (
      await this.listsRepository.exists(organizationId, {
        name: dto.name,
        deletedAt: { $exists: false },
      })
    ) {
      throw new DuplicateNameException('A list with that name already exists');
    }
    const list = await this.listsRepository.create(organizationId, dto);
    this.auditService.record(
      organizationId,
      userId,
      'CREATE',
      'ContactList',
      list.id as string,
      undefined,
      dto,
    );
    return ListResponseDto.fromDocument(list);
  }

  async list(
    organizationId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ListResponseDto>> {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }
    const { data, total } = await this.listsRepository.paginate(
      organizationId,
      filter,
      {
        skip: query.skip,
        limit: query.limit,
      },
    );
    return new PaginatedResponse(
      data.map((doc) => ListResponseDto.fromDocument(doc)),
      total,
      query.page,
      query.limit,
    );
  }

  async getOne(organizationId: string, id: string): Promise<ListResponseDto> {
    return ListResponseDto.fromDocument(
      await this.getActiveOrThrow(organizationId, id),
    );
  }

  async getActiveOrThrow(
    organizationId: string,
    id: string,
  ): Promise<ContactListDocument> {
    const list = await this.listsRepository.findActiveById(organizationId, id);
    if (!list) {
      throw new ListNotFoundException();
    }
    return list;
  }

  async softDelete(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<void> {
    await this.getActiveOrThrow(organizationId, id);
    const referencedByNonTerminalCampaign =
      await this.campaignsRepository.exists(organizationId, {
        listIds: id,
        status: { $nin: TERMINAL_CAMPAIGN_STATUSES },
        deletedAt: { $exists: false },
      });
    if (referencedByNonTerminalCampaign) {
      throw new BadRequestException(
        'This list is used by an active campaign and cannot be deleted',
      );
    }
    await this.listsRepository.updateById(organizationId, id, {
      deletedAt: new Date(),
    });
    this.auditService.record(
      organizationId,
      userId,
      'DELETE',
      'ContactList',
      id,
    );
  }
}
