// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MARKETER = 'MARKETER',
  ANALYST = 'ANALYST',
}

export const ROLE_RANK: Record<Role, number> = {
  [Role.ANALYST]: 0,
  [Role.MARKETER]: 1,
  [Role.ADMIN]: 2,
  [Role.OWNER]: 3,
};
