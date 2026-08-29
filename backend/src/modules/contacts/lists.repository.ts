// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrgScopedRepository } from '../../common/repositories/org-scoped.repository';
import {
  ContactList,
  ContactListDocument,
} from './schemas/contact-list.schema';

@Injectable()
export class ListsRepository extends OrgScopedRepository<ContactListDocument> {
  constructor(
    @InjectModel(ContactList.name) model: Model<ContactListDocument>,
  ) {
    super(model);
  }

  findActiveById(organizationId: string, id: string) {
    return this.findOne(organizationId, {
      _id: id,
      deletedAt: { $exists: false },
    });
  }

  async incrementContactCount(listId: string, delta: number): Promise<void> {
    await this.model
      .updateOne({ _id: listId }, { $inc: { contactCount: delta } })
      .exec();
  }

  async recalculateContactCount(listId: string, count: number): Promise<void> {
    await this.model
      .updateOne({ _id: listId }, { $set: { contactCount: count } })
      .exec();
  }
}
