// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { MongoMemoryReplSet } from 'mongodb-memory-server';

/**
 * Jest's globalSetup/globalTeardown run in the main test-runner process
 * (not a worker), so state on `global` here is visible in global-teardown.ts.
 * This must set env vars *before* any test file's top-level `import {
 * AppModule }` runs, because @nestjs/config validates process.env the
 * moment ConfigModule.forRoot() is evaluated (i.e. at import time, not when
 * Test.createTestingModule() is later called) — globalSetup is the only
 * hook that runs early enough.
 */
export default async function globalSetup(): Promise<void> {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  (globalThis as Record<string, unknown>).__MONGO_REPLSET__ = replSet;

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = replSet.getUri();
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-0123456789';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789';
  process.env.EMAIL_PROVIDER = 'smtp';
  process.env.SMTP_HOST = 'localhost';
  process.env.SMTP_PORT = '1025';
  process.env.AWS_ENDPOINT = '';
  process.env.SQS_SEND_QUEUE_URL = '';
  process.env.SQS_WEBHOOK_QUEUE_URL = '';
  process.env.SQS_IMPORT_QUEUE_URL = '';
  process.env.SNS_WEBHOOK_SIGNING_SECRET = 'test-webhook-signing-secret';
}
