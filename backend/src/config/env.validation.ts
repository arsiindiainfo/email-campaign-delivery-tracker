// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  MONGODB_URI: Joi.string().uri().required(),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),

  PUBLIC_BASE_URL: Joi.string().uri().default('http://localhost:3000'),
  APP_BASE_URL: Joi.string().uri().default('http://localhost:5173'),

  EMAIL_PROVIDER: Joi.string().valid('smtp', 'ses').default('smtp'),
  SMTP_HOST: Joi.string().default('localhost'),
  SMTP_PORT: Joi.number().default(1025),

  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  AWS_ENDPOINT: Joi.string().uri().allow('').default(''),

  SES_FROM_VERIFIED_DOMAINS: Joi.string().default('novamail.demo'),
  SNS_WEBHOOK_SIGNING_SECRET: Joi.string().default(
    'demo-webhook-signing-secret',
  ),

  SQS_SEND_QUEUE_URL: Joi.string().allow('').default(''),
  SQS_SEND_QUEUE_DLQ_URL: Joi.string().allow('').default(''),
  SQS_WEBHOOK_QUEUE_URL: Joi.string().allow('').default(''),
  SQS_WEBHOOK_QUEUE_DLQ_URL: Joi.string().allow('').default(''),
  SQS_IMPORT_QUEUE_URL: Joi.string().allow('').default(''),
  SQS_IMPORT_QUEUE_DLQ_URL: Joi.string().allow('').default(''),

  S3_UPLOADS_BUCKET: Joi.string().default('email-campaign-tracker-uploads'),

  THROTTLE_TTL_MS: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(120),

  RECAPTCHA_SECRET_KEY: Joi.string().allow('').default(''),
});
