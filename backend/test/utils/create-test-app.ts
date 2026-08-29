// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';

/**
 * `rawBody: true` must be passed at app-creation time (mirroring main.ts's
 * NestFactory.create call) — it can't be applied afterwards, and without it
 * `req.rawBody` is undefined, breaking the webhook signature verification
 * path (§9.2) in any e2e test that exercises it.
 */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication<INestApplication<App>>({
    rawBody: true,
  });
  configureApp(app);
  await app.init();
  return app;
}

export async function createTestingModuleAndApp(): Promise<{
  app: INestApplication<App>;
  moduleFixture: TestingModule;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication<INestApplication<App>>({
    rawBody: true,
  });
  configureApp(app);
  await app.init();
  return { app, moduleFixture };
}
