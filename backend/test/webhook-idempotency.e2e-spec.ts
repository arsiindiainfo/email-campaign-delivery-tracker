// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { INestApplication } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestingModuleAndApp } from './utils/create-test-app';
import { CampaignRecipientsRepository } from '../src/modules/campaigns/campaign-recipients.repository';
import { CampaignsRepository } from '../src/modules/campaigns/campaigns.repository';
import { WebhookProcessorService } from '../src/modules/webhooks/webhook-processor.service';
import { RecipientStatus } from '../src/shared/enums/recipient-status.enum';

const WEBHOOK_SECRET = 'test-webhook-signing-secret';

function signatureFor(body: object): string {
  return createHmac('sha256', WEBHOOK_SECRET)
    .update(Buffer.from(JSON.stringify(body)))
    .digest('hex');
}

describe('Webhook idempotency (e2e, §9.3)', () => {
  let app: INestApplication<App>;
  let recipientsRepository: CampaignRecipientsRepository;
  let campaignsRepository: CampaignsRepository;
  let webhookProcessor: WebhookProcessorService;
  let organizationId: string;
  let campaignId: string;
  let recipientId: string;

  beforeAll(async () => {
    const created = await createTestingModuleAndApp();
    app = created.app;
    const moduleFixture = created.moduleFixture;
    recipientsRepository = moduleFixture.get(CampaignRecipientsRepository);
    campaignsRepository = moduleFixture.get(CampaignsRepository);
    webhookProcessor = moduleFixture.get(WebhookProcessorService);

    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        organizationName: 'Webhook Test Co.',
        name: 'Test Owner',
        email: 'owner@webhooktest.demo',
        password: 'Str0ngPass!23',
        recaptchaToken: 'test-bypass',
      })
      .expect(201);
    const body = register.body as {
      data: { organization: { id: string }; accessToken: string };
    };
    organizationId = body.data.organization.id;
    const token = body.data.accessToken;
    const auth = (req: request.Test) =>
      req.set('Authorization', `Bearer ${token}`);

    await auth(request(app.getHttpServer()).put('/api/v1/organizations/me'))
      .send({
        senderDomain: 'webhooktest.demo',
        senderEmail: 'hello@webhooktest.demo',
      })
      .expect(200);
    await auth(
      request(app.getHttpServer()).post(
        '/api/v1/organizations/me/verify-sender',
      ),
    )
      .send({})
      .expect(201);

    const template = await auth(
      request(app.getHttpServer()).post('/api/v1/templates'),
    )
      .send({
        name: 'T1',
        subject: 'Subject line long enough',
        htmlBody:
          '<p>Hi {{firstName}}</p><a href="{{unsubscribeUrl}}">unsub</a>',
      })
      .expect(201);
    const templateId = (template.body as { data: { id: string } }).data.id;

    const list = await auth(request(app.getHttpServer()).post('/api/v1/lists'))
      .send({ name: 'L1' })
      .expect(201);
    const listId = (list.body as { data: { id: string } }).data.id;

    await auth(
      request(app.getHttpServer()).post(`/api/v1/lists/${listId}/contacts`),
    )
      .send({ email: 'contact@webhooktest.demo', firstName: 'Sam' })
      .expect(201);

    const campaign = await auth(
      request(app.getHttpServer()).post('/api/v1/campaigns'),
    )
      .send({
        name: 'Campaign 1',
        subject: 'Subject line long enough',
        fromName: 'Webhook Test Co.',
        fromEmail: 'hello@webhooktest.demo',
        templateId,
        listIds: [listId],
      })
      .expect(201);
    campaignId = (campaign.body as { data: { id: string } }).data.id;

    await auth(
      request(app.getHttpServer()).post(
        `/api/v1/campaigns/${campaignId}/schedule`,
      ),
    )
      .send({})
      .expect(201);

    const allRecipients = await recipientsRepository.find(organizationId, {
      campaignId,
    });
    const [recipient] = allRecipients;
    recipientId = recipient.id as string;
    // The queue no-ops in tests (no LocalStack) — simulate the worker having
    // already sent and recorded the provider's message id.
    await recipientsRepository.setProviderMessageId(
      recipientId,
      'test-message-id-001',
    );
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  const bounceNotification = {
    notificationType: 'Bounce',
    mail: {
      messageId: 'test-message-id-001',
      destination: ['contact@webhooktest.demo'],
    },
    bounce: { bounceType: 'Permanent', bounceSubType: 'General' },
  };

  it('rejects a payload with no/invalid signature', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/webhooks/ses')
      .send(bounceNotification)
      .expect(401);
    expect((response.body as { error: { code: string } }).error.code).toBe(
      'INVALID_WEBHOOK_SIGNATURE',
    );
  });

  it('layer 1 (webhook_logs): an identical retry from the provider is dropped at the ingestion door', async () => {
    const signature = signatureFor(bounceNotification);
    const post = () =>
      request(app.getHttpServer())
        .post('/api/v1/webhooks/ses')
        .set('x-webhook-signature', signature)
        .send(bounceNotification);

    const first = await post().expect(201);
    expect(
      (first.body as { data: { duplicate: boolean } }).data.duplicate,
    ).toBe(false);

    const retry = await post().expect(201);
    expect(
      (retry.body as { data: { duplicate: boolean } }).data.duplicate,
    ).toBe(true);
  });

  it('layer 2 (events unique index): processing the same notification twice never double-counts', async () => {
    await webhookProcessor.process(bounceNotification);
    await webhookProcessor.process(bounceNotification);

    const recipient = await recipientsRepository.findById(
      organizationId,
      recipientId,
    );
    expect(recipient?.status).toBe(RecipientStatus.BOUNCED);

    const campaign = await campaignsRepository.findById(
      organizationId,
      campaignId,
    );
    expect(campaign?.stats.bounced).toBe(1);
  });
});
