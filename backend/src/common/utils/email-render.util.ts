// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
const HREF_REGEX = /href\s*=\s*"([^"]+)"/gi;

/** Every link in a sent email is rewritten to route through /t/c/:token first (§18). */
export function rewriteLinksForClickTracking(
  html: string,
  clickBaseUrl: string,
  trackingToken: string,
): string {
  return html.replace(HREF_REGEX, (match, originalUrl: string) => {
    if (
      originalUrl.startsWith('mailto:') ||
      originalUrl.startsWith('#') ||
      originalUrl.startsWith('javascript:')
    ) {
      return match;
    }
    const redirect = `${clickBaseUrl}/${trackingToken}?u=${encodeURIComponent(originalUrl)}`;
    return `href="${redirect}"`;
  });
}

/** Embedded in every sent email; a hit records an OPENED event (§18). */
export function injectTrackingPixel(html: string, pixelUrl: string): string {
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" />`;
  return html.includes('</body>')
    ? html.replace('</body>', `${pixel}</body>`)
    : `${html}${pixel}`;
}
