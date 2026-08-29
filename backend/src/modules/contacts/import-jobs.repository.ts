// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrgScopedRepository } from '../../common/repositories/org-scoped.repository';
import { ImportJob, ImportJobDocument } from './schemas/import-job.schema';

@Injectable()
export class ImportJobsRepository extends OrgScopedRepository<ImportJobDocument> {
  constructor(@InjectModel(ImportJob.name) model: Model<ImportJobDocument>) {
    super(model);
  }
}
