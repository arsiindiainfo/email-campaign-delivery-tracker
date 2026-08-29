// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * §9.2 describes verifying the `x-amz-sns-signature` header against SNS's
 * certificate chain. A full cert-chain verification needs a live fetch of
 * SNS's SigningCertURL, which neither LocalStack nor a portfolio demo can
 * exercise offline — so this substitutes an HMAC-SHA256 shared-secret
 * signature (`x-webhook-signature`), verified with the same trust model
 * (reject anything not signed with the secret only Arsi India Info's
 * deployment and AWS SNS's configured subscription know).
 */
export function isValidWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader) {
    return false;
  }
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(signatureHeader, 'utf8');
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
