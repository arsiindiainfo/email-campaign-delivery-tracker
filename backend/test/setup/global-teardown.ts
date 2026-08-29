// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { MongoMemoryReplSet } from 'mongodb-memory-server';

export default async function globalTeardown(): Promise<void> {
  const replSet = (globalThis as Record<string, unknown>).__MONGO_REPLSET__ as
    MongoMemoryReplSet | undefined;
  await replSet?.stop();
}
