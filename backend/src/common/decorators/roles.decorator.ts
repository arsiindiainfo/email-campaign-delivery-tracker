// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../shared/enums/role.enum';

export const ROLES_KEY = 'roles';

/** Grants access to the given role and every role above it in the hierarchy (§6.2). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
