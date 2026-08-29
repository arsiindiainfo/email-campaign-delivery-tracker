// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { toSetUpdate } from '../../common/utils/mongo-update.util';
import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema';

@Injectable()
export class OrganizationsRepository {
  constructor(
    @InjectModel(Organization.name)
    private readonly model: Model<OrganizationDocument>,
  ) {}

  create(data: Partial<Organization>, session?: ClientSession) {
    return new this.model(data).save({ session });
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findBySlug(slug: string) {
    return this.model.findOne({ slug }).exec();
  }

  async slugExists(slug: string): Promise<boolean> {
    return (await this.model.exists({ slug }).exec()) !== null;
  }

  updateById(id: string, update: Partial<Organization>) {
    return this.model
      .findByIdAndUpdate(id, toSetUpdate(update), { new: true })
      .exec();
  }
}
