// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SuppressionReason } from '../../shared/enums/suppression-reason.enum';
import { SuppressionNotFoundException } from '../../shared/exceptions/domain.exception';
import { ContactsRepository } from '../contacts/contacts.repository';
import { ContactStatus } from '../contacts/schemas/contact.schema';
import { CreateSuppressionDto } from './dto/create-suppression.dto';
import { SuppressionResponseDto } from './dto/suppression-response.dto';
import { SuppressionsRepository } from './suppressions.repository';

@Injectable()
export class SuppressionsService {
  constructor(
    private readonly suppressionsRepository: SuppressionsRepository,
    @Inject(forwardRef(() => ContactsRepository))
    private readonly contactsRepository: ContactsRepository,
  ) {}

  isSuppressed(organizationId: string, email: string): Promise<boolean> {
    return this.suppressionsRepository.isSuppressed(organizationId, email);
  }

  /** Bounce/complaint/unsubscribe events (§9, §18) call this directly — always idempotent. */
  async suppress(
    organizationId: string,
    email: string,
    reason: SuppressionReason,
  ): Promise<void> {
    await this.suppressionsRepository.upsert(organizationId, email, reason);
    const contact = await this.contactsRepository.findByEmail(
      organizationId,
      email,
    );
    if (contact) {
      await this.contactsRepository.updateById(
        organizationId,
        contact.id as string,
        {
          status: ContactStatus.SUPPRESSED,
        },
      );
    }
  }

  async list(
    organizationId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<SuppressionResponseDto>> {
    const filter = query.search
      ? { email: { $regex: query.search, $options: 'i' } }
      : {};
    const { data, total } = await this.suppressionsRepository.paginate(
      organizationId,
      filter,
      {
        skip: query.skip,
        limit: query.limit,
      },
    );
    return new PaginatedResponse(
      data.map((doc) => SuppressionResponseDto.fromDocument(doc)),
      total,
      query.page,
      query.limit,
    );
  }

  async manuallySuppress(
    organizationId: string,
    dto: CreateSuppressionDto,
  ): Promise<SuppressionResponseDto> {
    await this.suppress(organizationId, dto.email, SuppressionReason.MANUAL);
    const suppression = await this.suppressionsRepository.findByEmail(
      organizationId,
      dto.email,
    );
    return SuppressionResponseDto.fromDocument(suppression!);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const suppression = await this.suppressionsRepository.findById(
      organizationId,
      id,
    );
    if (!suppression) {
      throw new SuppressionNotFoundException();
    }
    if (suppression.reason !== SuppressionReason.MANUAL) {
      throw new BadRequestException(
        'Only manually-added suppressions can be removed — bounce/complaint/unsubscribe entries are permanent',
      );
    }
    await this.suppressionsRepository.deleteById(organizationId, id);
  }
}
