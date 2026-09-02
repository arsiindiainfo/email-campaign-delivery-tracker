// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './utils/create-test-app';

interface RegisterResponse {
  data: { accessToken: string; organization: { id: string } };
}

async function registerOrg(
  app: INestApplication<App>,
  name: string,
  email: string,
) {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({
      organizationName: name,
      name: 'Owner',
      email,
      password: 'Str0ngPass!23',
      recaptchaToken: 'test-bypass',
    })
    .expect(201);
  const body = response.body as RegisterResponse;
  return {
    token: body.data.accessToken,
    organizationId: body.data.organization.id,
  };
}

/**
 * §6.1 guardrail: a resource belonging to another organization must be
 * architecturally unreachable, not merely permission-checked — asserted as
 * a 404 (never 403) so a caller can't even learn that the record exists.
 */
describe('Tenant isolation (e2e, §6.1)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  it('returns 404 (not 403) when Org B requests a list owned by Org A', async () => {
    const orgA = await registerOrg(app, 'Org A', 'owner@org-a.demo');
    const orgB = await registerOrg(app, 'Org B', 'owner@org-b.demo');

    const list = await request(app.getHttpServer())
      .post('/api/v1/lists')
      .set('Authorization', `Bearer ${orgA.token}`)
      .send({ name: "Org A's private list" })
      .expect(201);
    const listId = (list.body as { data: { id: string } }).data.id;

    const asOwner = await request(app.getHttpServer())
      .get(`/api/v1/lists/${listId}`)
      .set('Authorization', `Bearer ${orgA.token}`)
      .expect(200);
    expect((asOwner.body as { data: { id: string } }).data.id).toBe(listId);

    const asOtherOrg = await request(app.getHttpServer())
      .get(`/api/v1/lists/${listId}`)
      .set('Authorization', `Bearer ${orgB.token}`)
      .expect(404);
    expect((asOtherOrg.body as { error: { code: string } }).error.code).toBe(
      'LIST_NOT_FOUND',
    );
  });

  it('returns 404 (not 403) when Org B requests a campaign owned by Org A', async () => {
    const orgA = await registerOrg(app, 'Org C', 'owner@org-c.demo');
    const orgB = await registerOrg(app, 'Org D', 'owner@org-d.demo');
    const authA = (req: request.Test) =>
      req.set('Authorization', `Bearer ${orgA.token}`);

    await authA(request(app.getHttpServer()).put('/api/v1/organizations/me'))
      .send({ senderDomain: 'org-c.demo', senderEmail: 'hello@org-c.demo' })
      .expect(200);
    await authA(
      request(app.getHttpServer()).post(
        '/api/v1/organizations/me/verify-sender',
      ),
    )
      .send({})
      .expect(201);

    const template = await authA(
      request(app.getHttpServer()).post('/api/v1/templates'),
    )
      .send({
        name: 'T',
        subject: 'Subject line long enough',
        htmlBody: '<p>{{firstName}}</p><a href="{{unsubscribeUrl}}">unsub</a>',
      })
      .expect(201);
    const templateId = (template.body as { data: { id: string } }).data.id;

    const list = await authA(request(app.getHttpServer()).post('/api/v1/lists'))
      .send({ name: 'L' })
      .expect(201);
    const listId = (list.body as { data: { id: string } }).data.id;

    const campaign = await authA(
      request(app.getHttpServer()).post('/api/v1/campaigns'),
    )
      .send({
        name: 'Org C campaign',
        subject: 'Subject line long enough',
        fromName: 'Org C',
        fromEmail: 'hello@org-c.demo',
        templateId,
        listIds: [listId],
      })
      .expect(201);
    const campaignId = (campaign.body as { data: { id: string } }).data.id;

    const response = await request(app.getHttpServer())
      .get(`/api/v1/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${orgB.token}`)
      .expect(404);
    expect((response.body as { error: { code: string } }).error.code).toBe(
      'CAMPAIGN_NOT_FOUND',
    );
  });
});
