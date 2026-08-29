// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Role } from '../../../shared/enums/role.enum';

export interface JwtPayload {
  sub: string;
  organizationId: string;
  role: Role;
}

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  role: Role;
}
