// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Types } from 'mongoose';

/** Converts an ObjectId (or any stringifiable id) to a plain string for response DTOs. */
export function toIdString(id: unknown): string {
  if (id instanceof Types.ObjectId) {
    return id.toHexString();
  }
  return String(id);
}
