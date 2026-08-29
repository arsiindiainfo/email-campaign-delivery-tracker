// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { slugify } from '../../common/utils/slugify.util';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsRepository } from './organizations.repository';
import { OrganizationDocument } from './schemas/organization.schema';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  async createOrganization(
    name: string,
    session?: ClientSession,
  ): Promise<OrganizationDocument> {
    const slug = await this.generateUniqueSlug(name);
    return this.organizationsRepository.create({ name, slug }, session);
  }

  async getById(id: string): Promise<OrganizationDocument> {
    const organization = await this.organizationsRepository.findById(id);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  async updateProfile(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationDocument> {
    const update: Record<string, unknown> = { ...dto };
    if (dto.senderDomain || dto.senderEmail) {
      // Any change to sender identity resets demo verification until re-confirmed.
      update.senderVerified = false;
    }
    const organization = await this.organizationsRepository.updateById(
      id,
      update,
    );
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  async markSenderVerified(id: string): Promise<OrganizationDocument> {
    const organization = await this.organizationsRepository.updateById(id, {
      senderVerified: true,
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  /** §15 — a campaign's fromEmail domain must match the org's verified sender identity. */
  async isFromEmailVerified(
    organizationId: string,
    fromEmail: string,
  ): Promise<boolean> {
    const organization = await this.getById(organizationId);
    if (!organization.senderVerified || !organization.senderDomain) {
      return false;
    }
    const domain = fromEmail.split('@')[1]?.toLowerCase();
    return domain === organization.senderDomain.toLowerCase();
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'org';
    let candidate = base;
    let suffix = 1;
    while (await this.organizationsRepository.slugExists(candidate)) {
      candidate = `${base}-${++suffix}`;
    }
    return candidate;
  }
}
