// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
const UNSUBSCRIBE_TAG = '{{unsubscribeUrl}}';

/** Every template must carry an unsubscribe merge tag before it can be saved (§22.5). */
export function hasUnsubscribeTag(html: string): boolean {
  return html.includes(UNSUBSCRIBE_TAG);
}

export function renderMergeFields(
  html: string,
  values: Record<string, string>,
): string {
  return html.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );
}

export const SAMPLE_MERGE_FIELD_VALUES: Record<string, string> = {
  firstName: 'Asha',
  lastName: 'Rao',
  unsubscribeUrl: '#unsubscribe-preview',
};
