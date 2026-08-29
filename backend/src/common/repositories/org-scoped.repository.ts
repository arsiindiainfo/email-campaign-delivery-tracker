// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  ClientSession,
  Document,
  FilterQuery,
  Model,
  Types,
  UpdateQuery,
} from 'mongoose';
import { toSetUpdate } from '../utils/mongo-update.util';

export interface PaginateOptions {
  skip: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginateResult<TDocument> {
  data: TDocument[];
  total: number;
}

/**
 * Every method injects { organizationId } into the Mongo filter — a resource
 * belonging to another organization is architecturally unreachable through this
 * class, not just permission-checked (§6.1). Services in a module must go through
 * their module's repository rather than importing the raw Mongoose model.
 */
export abstract class OrgScopedRepository<TDocument extends Document> {
  protected constructor(protected readonly model: Model<TDocument>) {}

  async create(
    organizationId: string,
    data: object,
    session?: ClientSession,
  ): Promise<TDocument> {
    const doc = new this.model({ ...data, organizationId });
    return doc.save({ session });
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<TDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.model.findOne({ _id: id, organizationId }).exec();
  }

  async findOne(
    organizationId: string,
    filter: FilterQuery<TDocument>,
  ): Promise<TDocument | null> {
    return this.model.findOne({ ...filter, organizationId }).exec();
  }

  async find(
    organizationId: string,
    filter: FilterQuery<TDocument> = {},
  ): Promise<TDocument[]> {
    return this.model
      .find({ ...filter, organizationId } as FilterQuery<TDocument>)
      .exec();
  }

  async paginate(
    organizationId: string,
    filter: FilterQuery<TDocument>,
    { skip, limit, sort }: PaginateOptions,
  ): Promise<PaginateResult<TDocument>> {
    const scopedFilter = {
      ...filter,
      organizationId,
    } as FilterQuery<TDocument>;
    const [data, total] = await Promise.all([
      this.model
        .find(scopedFilter)
        .sort(sort ?? { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(scopedFilter).exec(),
    ]);
    return { data, total };
  }

  async updateById(
    organizationId: string,
    id: string,
    update: UpdateQuery<TDocument>,
  ): Promise<TDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.model
      .findOneAndUpdate({ _id: id, organizationId }, toSetUpdate(update), {
        new: true,
      })
      .exec();
  }

  async deleteById(
    organizationId: string,
    id: string,
  ): Promise<TDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.model.findOneAndDelete({ _id: id, organizationId }).exec();
  }

  async countDocuments(
    organizationId: string,
    filter: FilterQuery<TDocument> = {},
  ): Promise<number> {
    return this.model.countDocuments({ ...filter, organizationId }).exec();
  }

  async exists(
    organizationId: string,
    filter: FilterQuery<TDocument>,
  ): Promise<boolean> {
    const found = await this.model.exists({ ...filter, organizationId }).exec();
    return found !== null;
  }
}
