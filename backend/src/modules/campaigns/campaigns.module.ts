// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module';
import { ContactsModule } from '../contacts/contacts.module';
import { EventsModule } from '../events/events.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { SendingModule } from '../sending/sending.module';
import { SuppressionsModule } from '../suppressions/suppressions.module';
import { TemplatesModule } from '../templates/templates.module';
import { CampaignRecipientsRepository } from './campaign-recipients.repository';
import { CampaignsController } from './campaigns.controller';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import {
  CampaignRecipient,
  CampaignRecipientSchema,
} from './schemas/campaign-recipient.schema';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignRecipient.name, schema: CampaignRecipientSchema },
    ]),
    forwardRef(() => TemplatesModule),
    forwardRef(() => ContactsModule),
    OrganizationsModule,
    SuppressionsModule,
    AuditModule,
    SendingModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [CampaignsController],
  providers: [
    CampaignsService,
    CampaignsRepository,
    CampaignRecipientsRepository,
  ],
  exports: [
    CampaignsRepository,
    CampaignRecipientsRepository,
    CampaignsService,
  ],
})
export class CampaignsModule {}
