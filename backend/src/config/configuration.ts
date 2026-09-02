// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
export interface AppConfig {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  corsOrigins: string[];
  publicBaseUrl: string;
  appBaseUrl: string;
  email: {
    provider: 'smtp' | 'ses';
    smtpHost: string;
    smtpPort: number;
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
  ses: {
    verifiedDomains: string[];
  };
  sns: {
    webhookSigningSecret: string;
  };
  sqs: {
    sendQueueUrl: string;
    sendQueueDlqUrl: string;
    webhookQueueUrl: string;
    webhookQueueDlqUrl: string;
    importQueueUrl: string;
    importQueueDlqUrl: string;
  };
  s3: {
    uploadsBucket: string;
  };
  throttle: {
    ttlMs: number;
    limit: number;
  };
  recaptcha: {
    secretKey: string;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongodbUri: process.env.MONGODB_URI ?? '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000',
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:5173',
  email: {
    provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'ses') ?? 'smtp',
    smtpHost: process.env.SMTP_HOST ?? 'localhost',
    smtpPort: parseInt(process.env.SMTP_PORT ?? '1025', 10),
  },
  aws: {
    region: process.env.AWS_REGION ?? 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    endpoint: process.env.AWS_ENDPOINT || undefined,
  },
  ses: {
    verifiedDomains: (process.env.SES_FROM_VERIFIED_DOMAINS ?? 'novamail.demo')
      .split(',')
      .map((s) => s.trim()),
  },
  sns: {
    webhookSigningSecret: process.env.SNS_WEBHOOK_SIGNING_SECRET ?? '',
  },
  sqs: {
    sendQueueUrl: process.env.SQS_SEND_QUEUE_URL ?? '',
    sendQueueDlqUrl: process.env.SQS_SEND_QUEUE_DLQ_URL ?? '',
    webhookQueueUrl: process.env.SQS_WEBHOOK_QUEUE_URL ?? '',
    webhookQueueDlqUrl: process.env.SQS_WEBHOOK_QUEUE_DLQ_URL ?? '',
    importQueueUrl: process.env.SQS_IMPORT_QUEUE_URL ?? '',
    importQueueDlqUrl: process.env.SQS_IMPORT_QUEUE_DLQ_URL ?? '',
  },
  s3: {
    uploadsBucket:
      process.env.S3_UPLOADS_BUCKET ?? 'email-campaign-tracker-uploads',
  },
  throttle: {
    ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
  },
  recaptcha: {
    secretKey: process.env.RECAPTCHA_SECRET_KEY ?? '',
  },
});
