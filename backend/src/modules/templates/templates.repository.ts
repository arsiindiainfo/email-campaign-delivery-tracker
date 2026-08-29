// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrgScopedRepository } from '../../common/repositories/org-scoped.repository';
import { Template, TemplateDocument } from './schemas/template.schema';

@Injectable()
export class TemplatesRepository extends OrgScopedRepository<TemplateDocument> {
  constructor(@InjectModel(Template.name) model: Model<TemplateDocument>) {
    super(model);
  }

  findActiveById(organizationId: string, id: string) {
    return this.findOne(organizationId, {
      _id: id,
      deletedAt: { $exists: false },
    });
  }

  async nameTaken(
    organizationId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    return this.exists(organizationId, {
      name,
      deletedAt: { $exists: false },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
  }
}
