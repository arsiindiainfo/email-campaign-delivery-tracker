// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
export interface SesNotification {
  notificationType: string;
  mail: {
    messageId: string;
    destination: string[];
  };
  bounce?: {
    bounceType: string;
    bounceSubType: string;
  };
  complaint?: Record<string, unknown>;
  delivery?: Record<string, unknown>;
}
