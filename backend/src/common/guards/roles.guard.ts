// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_RANK, Role } from '../../shared/enums/role.enum';
import { ForbiddenRoleException } from '../../shared/exceptions/domain.exception';
import { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RequestWithUser {
  user: AuthenticatedUser;
}

/**
 * A @Roles(Role.ADMIN) decorator grants ADMIN and every role above it (OWNER) —
 * reflects the "ADMIN+" shorthand used throughout §14-§20.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    const minimumRequiredRank = Math.min(
      ...requiredRoles.map((role) => ROLE_RANK[role]),
    );

    if (ROLE_RANK[user.role] < minimumRequiredRank) {
      throw new ForbiddenRoleException();
    }
    return true;
  }
}
