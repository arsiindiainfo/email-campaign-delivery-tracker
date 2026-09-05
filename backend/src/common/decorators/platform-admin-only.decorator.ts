// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { SetMetadata } from '@nestjs/common';

export const PLATFORM_ADMIN_KEY = 'platformAdminOnly';

/** Restricts a route to users with isPlatformAdmin=true (cross-organization, set only via seed/ops — never via any endpoint). */
export const PlatformAdminOnly = () => SetMetadata(PLATFORM_ADMIN_KEY, true);
