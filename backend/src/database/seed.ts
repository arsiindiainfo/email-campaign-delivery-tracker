// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
/**
 * Loads the fictional "NovaMail Retail Co." demo org: sample contacts,
 * templates, and three campaigns in different lifecycle states, so a
 * reviewer can see the full funnel without sending a single real email
 * (§27, §29, §33). Idempotent-ish for local iteration: re-running against a
 * fresh database is the supported path — see docs/portfolio-demo.md.
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from '../app.module';
import { EventSource, EventType } from '../shared/enums/event-type.enum';
import { Role } from '../shared/enums/role.enum';
import { AuthService } from '../modules/auth/auth.service';
import { CampaignsService } from '../modules/campaigns/campaigns.service';
import { CampaignRecipientsRepository } from '../modules/campaigns/campaign-recipients.repository';
import { ContactsService } from '../modules/contacts/contacts.service';
import { ListsService } from '../modules/contacts/lists.service';
import { EventsService } from '../modules/events/events.service';
import { OrganizationsService } from '../modules/organizations/organizations.service';
import { TemplatesService } from '../modules/templates/templates.service';
import { UsersService } from '../modules/users/users.service';

const CONTACTS = [
  {
    email: 'priya.sharma@novamail.demo',
    firstName: 'Priya',
    lastName: 'Sharma',
  },
  { email: 'rahul.gupta@novamail.demo', firstName: 'Rahul', lastName: 'Gupta' },
  { email: 'ananya.iyer@novamail.demo', firstName: 'Ananya', lastName: 'Iyer' },
  { email: 'vikram.rao@novamail.demo', firstName: 'Vikram', lastName: 'Rao' },
  { email: 'sneha.patel@novamail.demo', firstName: 'Sneha', lastName: 'Patel' },
  { email: 'arjun.mehta@novamail.demo', firstName: 'Arjun', lastName: 'Mehta' },
  { email: 'divya.nair@novamail.demo', firstName: 'Divya', lastName: 'Nair' },
  { email: 'karan.singh@novamail.demo', firstName: 'Karan', lastName: 'Singh' },
];

const TEMPLATE_HTML = `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1>Hi {{firstName}},</h1>
  <p>The NovaMail Spring Sale is live — up to 40% off best-sellers this week only.</p>
  <p><a href="https://novamail.demo/sale">Shop the sale</a></p>
  <p style="color:#888; font-size:12px;">
    You're receiving this because you're subscribed to NovaMail Retail Co. updates.
    <a href="{{unsubscribeUrl}}">Unsubscribe</a>
  </p>
</div>`;

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  const authService = app.get(AuthService);
  const organizationsService = app.get(OrganizationsService);
  const usersService = app.get(UsersService);
  const templatesService = app.get(TemplatesService);
  const listsService = app.get(ListsService);
  const contactsService = app.get(ContactsService);
  const campaignsService = app.get(CampaignsService);
  const campaignRecipientsRepository = app.get(CampaignRecipientsRepository);
  const eventsService = app.get(EventsService);

  const { organization, user: owner } = await authService.register(
    {
      organizationName: 'NovaMail Retail Co.',
      name: 'Asha Rao',
      email: 'arsi.india.info@gmail.com',
      password: 'Rajib@1984',
      recaptchaToken: 'seed-bypass',
    },
    { skipRecaptcha: true, skipNotificationEmails: true },
  );
  logger.log(`Created organization ${organization.name} (${organization.id})`);

  await organizationsService.updateProfile(organization.id, {
    senderDomain: 'novamail.demo',
    senderEmail: 'hello@novamail.demo',
  });
  await organizationsService.markSenderVerified(organization.id);

  await usersService.invite(organization.id, {
    name: 'Meera Joshi',
    email: 'meera@novamail.demo',
    role: Role.MARKETER,
  });
  await usersService.invite(organization.id, {
    name: 'Rohan Das',
    email: 'rohan@novamail.demo',
    role: Role.ANALYST,
  });

  const list = await listsService.create(organization.id, owner.id, {
    name: 'All Subscribers',
  });
  for (const contact of CONTACTS) {
    await contactsService.addContact(organization.id, list.id, contact);
  }
  logger.log(`Seeded list "${list.name}" with ${CONTACTS.length} contacts`);

  const template = await templatesService.create(organization.id, owner.id, {
    name: 'Spring Sale Announcement',
    subject: 'Spring Sale — up to 40% off',
    htmlBody: TEMPLATE_HTML,
  });

  const draftCampaign = await campaignsService.create(
    organization.id,
    owner.id,
    {
      name: 'Newsletter #4',
      subject: 'This month at NovaMail',
      fromName: 'NovaMail Retail Co.',
      fromEmail: 'hello@novamail.demo',
      templateId: template.id,
      listIds: [list.id],
    },
  );
  logger.log(`Created DRAFT campaign "${draftCampaign.name}"`);

  const scheduledCampaign = await campaignsService.create(
    organization.id,
    owner.id,
    {
      name: 'Cart Reminder',
      subject: 'You left something in your cart',
      fromName: 'NovaMail Retail Co.',
      fromEmail: 'hello@novamail.demo',
      templateId: template.id,
      listIds: [list.id],
    },
  );
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await campaignsService.schedule(organization.id, scheduledCampaign.id, {
    scheduledAt: tomorrow,
  });
  logger.log(`Scheduled campaign "${scheduledCampaign.name}" for ${tomorrow}`);

  const sentCampaign = await campaignsService.create(
    organization.id,
    owner.id,
    {
      name: 'Spring Sale Launch',
      subject: 'Spring Sale — up to 40% off',
      fromName: 'NovaMail Retail Co.',
      fromEmail: 'hello@novamail.demo',
      templateId: template.id,
      listIds: [list.id],
    },
  );
  await campaignsService.schedule(organization.id, sentCampaign.id, {});

  // Deterministic funnel data for screenshots, independent of whether a worker
  // process happens to be running against the same queues right now.
  const recipients = await campaignRecipientsRepository.find(organization.id, {
    campaignId: sentCampaign.id,
  });
  for (const recipient of recipients) {
    await campaignsService.processSendJob({
      organizationId: organization.id,
      campaignId: sentCampaign.id,
      campaignRecipientId: recipient.id as string,
    });
  }
  const refreshed = await campaignRecipientsRepository.find(organization.id, {
    campaignId: sentCampaign.id,
  });
  const [opened1, opened2, clicked1, bounced1] = refreshed;
  const now = new Date();
  if (opened1) {
    await eventsService.applyEvent({
      organizationId: organization.id,
      campaignId: sentCampaign.id,
      campaignRecipientId: opened1.id as string,
      email: opened1.email,
      type: EventType.DELIVERED,
      source: EventSource.WEBHOOK,
      occurredAt: now,
    });
    await eventsService.applyEvent({
      organizationId: organization.id,
      campaignId: sentCampaign.id,
      campaignRecipientId: opened1.id as string,
      email: opened1.email,
      type: EventType.OPENED,
      source: EventSource.TRACKING_PIXEL,
      occurredAt: now,
    });
  }
  if (opened2) {
    await eventsService.applyEvent({
      organizationId: organization.id,
      campaignId: sentCampaign.id,
      campaignRecipientId: opened2.id as string,
      email: opened2.email,
      type: EventType.DELIVERED,
      source: EventSource.WEBHOOK,
      occurredAt: now,
    });
  }
  if (clicked1) {
    await eventsService.applyEvent({
      organizationId: organization.id,
      campaignId: sentCampaign.id,
      campaignRecipientId: clicked1.id as string,
      email: clicked1.email,
      type: EventType.DELIVERED,
      source: EventSource.WEBHOOK,
      occurredAt: now,
    });
    await eventsService.applyEvent({
      organizationId: organization.id,
      campaignId: sentCampaign.id,
      campaignRecipientId: clicked1.id as string,
      email: clicked1.email,
      type: EventType.OPENED,
      source: EventSource.TRACKING_PIXEL,
      occurredAt: now,
    });
    await eventsService.applyEvent({
      organizationId: organization.id,
      campaignId: sentCampaign.id,
      campaignRecipientId: clicked1.id as string,
      email: clicked1.email,
      type: EventType.CLICKED,
      source: EventSource.TRACKING_LINK,
      occurredAt: now,
    });
  }
  if (bounced1) {
    await eventsService.applyEvent({
      organizationId: organization.id,
      campaignId: sentCampaign.id,
      campaignRecipientId: bounced1.id as string,
      email: bounced1.email,
      type: EventType.BOUNCED,
      source: EventSource.WEBHOOK,
      occurredAt: now,
      meta: { bounceType: 'Permanent' },
      providerEventId: `seed-bounce-${bounced1.id as string}`,
    });
  }

  logger.log(
    `Campaign "${sentCampaign.name}" is SENT with a simulated open/click/bounce funnel.`,
  );
  logger.log('Seed complete. Sign in with arsi.india.info@gmail.com / Rajib@1984');

  await app.close();
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
