// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
/**
 * MongoDB's updateOne/updateMany/findOneAndUpdate reject a plain
 * { field: value } document with "update document requires atomic
 * operators" — every field-patch call site in this codebase passes a plain
 * partial object, so this wraps it in $set once, here, instead of at every
 * repository call site.
 */
export function toSetUpdate(update: object): object {
  const hasOperators = Object.keys(update).some((key) => key.startsWith('$'));
  return hasOperators ? update : { $set: { ...update } };
}
