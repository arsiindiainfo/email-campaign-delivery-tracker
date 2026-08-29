// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ClientSession } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../../shared/enums/role.enum';
import { UserNotFoundException } from '../../shared/exceptions/domain.exception';
import { InviteUserDto } from './dto/invite-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';

const BCRYPT_COST = 12;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /** Used only by AuthService.register, inside the org+user creation transaction (§14). */
  async createOwner(
    organizationId: string,
    name: string,
    email: string,
    passwordHash: string,
    session: ClientSession,
  ): Promise<UserDocument> {
    return this.usersRepository.create(
      organizationId,
      { name, email: email.toLowerCase(), role: Role.OWNER, passwordHash },
      session,
    );
  }

  async findMe(
    organizationId: string,
    userId: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(organizationId, userId);
    if (!user) {
      throw new UserNotFoundException();
    }
    return UserResponseDto.fromDocument(user);
  }

  async list(
    organizationId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const { data, total } = await this.usersRepository.paginate(
      organizationId,
      {},
      { skip: query.skip, limit: query.limit, sort: { createdAt: -1 } },
    );
    return new PaginatedResponse(
      data.map((doc) => UserResponseDto.fromDocument(doc)),
      total,
      query.page,
      query.limit,
    );
  }

  /**
   * Demo invite flow: creates the user immediately with a generated temp
   * password rather than sending a real invite email (the sending pipeline
   * lands in Phase 2 and this module must not depend on it). A production
   * build would email a signed invite link instead of returning the password.
   */
  async invite(
    organizationId: string,
    dto: InviteUserDto,
  ): Promise<{ user: UserResponseDto; tempPassword: string }> {
    if (await this.usersRepository.emailExists(dto.email)) {
      throw new ConflictException('A user with that email already exists');
    }
    const tempPassword = randomBytes(9).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_COST);
    const user = await this.usersRepository.create(organizationId, {
      name: dto.name,
      email: dto.email.toLowerCase(),
      role: dto.role,
      passwordHash,
    });
    return { user: UserResponseDto.fromDocument(user), tempPassword };
  }
}
