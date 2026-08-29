// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './utils/create-test-app';

describe('App bootstrap (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  it('boots the full module graph with no missing/circular providers', () => {
    expect(app).toBeDefined();
  });

  it('GET /api/v1/about returns Arsi India Info branding (§31.2)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/about')
      .expect(200);
    const body = response.body as {
      success: boolean;
      data: { author: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.author).toBe('Arsi India Info');
  });

  it('sets the X-Powered-By branding header on every route', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/about');
    expect(response.headers['x-powered-by']).toBe('Arsi-India-Info');
  });
});
