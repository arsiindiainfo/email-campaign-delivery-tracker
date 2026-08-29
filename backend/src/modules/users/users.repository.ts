// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrgScopedRepository } from '../../common/repositories/org-scoped.repository';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository extends OrgScopedRepository<UserDocument> {
  constructor(@InjectModel(User.name) model: Model<UserDocument>) {
    super(model);
  }

  /** Global lookup by email — used by auth (register/login), not org-scoped by design. */
  findByEmailWithPassword(email: string) {
    return this.model
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash +refreshTokenHash')
      .exec();
  }

  findByEmail(email: string) {
    return this.model.findOne({ email: email.toLowerCase() }).exec();
  }

  findByIdWithRefreshToken(id: string) {
    return this.model.findById(id).select('+refreshTokenHash').exec();
  }

  async emailExists(email: string): Promise<boolean> {
    return (
      (await this.model.exists({ email: email.toLowerCase() }).exec()) !== null
    );
  }

  /** Not org-scoped by id lookup — used only by AuthService, which already holds the id from a verified token. */
  setRefreshTokenHash(userId: string, refreshTokenHash: string | undefined) {
    const update = refreshTokenHash
      ? { $set: { refreshTokenHash } }
      : { $unset: { refreshTokenHash: 1 } };
    return this.model.findByIdAndUpdate(userId, update, { new: true }).exec();
  }
}
