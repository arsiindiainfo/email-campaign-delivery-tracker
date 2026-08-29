// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrgScopedRepository } from '../../common/repositories/org-scoped.repository';
import {
  Contact,
  ContactDocument,
  ContactStatus,
} from './schemas/contact.schema';

@Injectable()
export class ContactsRepository extends OrgScopedRepository<ContactDocument> {
  constructor(@InjectModel(Contact.name) model: Model<ContactDocument>) {
    super(model);
  }

  findByEmail(organizationId: string, email: string) {
    return this.findOne(organizationId, { email: email.toLowerCase() });
  }

  /** Distinct, active, non-suppressed recipients across a campaign's lists (§15/§22.4 recipient count). */
  findActiveInLists(organizationId: string, listIds: string[]) {
    return this.model
      .find({
        organizationId,
        listIds: { $in: listIds.map((id) => new Types.ObjectId(id)) },
        status: ContactStatus.ACTIVE,
      })
      .exec();
  }

  countActiveInLists(organizationId: string, listIds: string[]) {
    return this.model
      .countDocuments({
        organizationId,
        listIds: { $in: listIds.map((id) => new Types.ObjectId(id)) },
        status: ContactStatus.ACTIVE,
      })
      .exec();
  }

  countInList(organizationId: string, listId: string) {
    return this.countDocuments(organizationId, {
      listIds: new Types.ObjectId(listId),
    });
  }

  async addToList(
    organizationId: string,
    contactId: string,
    listId: string,
  ): Promise<void> {
    await this.model
      .updateOne(
        { _id: contactId, organizationId },
        { $addToSet: { listIds: new Types.ObjectId(listId) } },
      )
      .exec();
  }

  async removeFromList(
    organizationId: string,
    contactId: string,
    listId: string,
  ): Promise<void> {
    await this.model
      .updateOne(
        { _id: contactId, organizationId },
        { $pull: { listIds: new Types.ObjectId(listId) } },
      )
      .exec();
  }

  /** Used by the CSV import worker: create-or-attach-to-list in one upsert per row (§16). */
  async upsertForImport(
    organizationId: string,
    listId: string,
    email: string,
    firstName: string | undefined,
    lastName: string | undefined,
  ): Promise<'created' | 'updated'> {
    const result = await this.model
      .updateOne(
        { organizationId, email: email.toLowerCase() },
        {
          $addToSet: { listIds: new Types.ObjectId(listId) },
          $setOnInsert: {
            organizationId: new Types.ObjectId(organizationId),
            email: email.toLowerCase(),
            status: ContactStatus.ACTIVE,
          },
          $set: {
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
          },
        },
        { upsert: true },
      )
      .exec();
    return result.upsertedCount > 0 ? 'created' : 'updated';
  }
}
