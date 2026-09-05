// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenRoleException } from '../../shared/exceptions/domain.exception';
import { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface';
import { PLATFORM_ADMIN_KEY } from '../decorators/platform-admin-only.decorator';

interface RequestWithUser {
  user: AuthenticatedUser;
}

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresPlatformAdmin = this.reflector.getAllAndOverride<boolean>(
      PLATFORM_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiresPlatformAdmin) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!user?.isPlatformAdmin) {
      throw new ForbiddenRoleException(
        'This action is restricted to platform administrators',
      );
    }
    return true;
  }
}
