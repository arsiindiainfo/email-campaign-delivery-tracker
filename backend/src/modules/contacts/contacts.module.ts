// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { QueueModule } from '../queue/queue.module';
import { StorageModule } from '../storage/storage.module';
import { SuppressionsModule } from '../suppressions/suppressions.module';
import { ContactsRepository } from './contacts.repository';
import { ContactsService } from './contacts.service';
import { ImportJobsRepository } from './import-jobs.repository';
import { ListsController } from './lists.controller';
import { ListsRepository } from './lists.repository';
import { ListsService } from './lists.service';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { ContactList, ContactListSchema } from './schemas/contact-list.schema';
import { ImportJob, ImportJobSchema } from './schemas/import-job.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContactList.name, schema: ContactListSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: ImportJob.name, schema: ImportJobSchema },
    ]),
    StorageModule,
    QueueModule,
    AuditModule,
    forwardRef(() => SuppressionsModule),
    forwardRef(() => CampaignsModule),
  ],
  controllers: [ListsController],
  providers: [
    ListsService,
    ListsRepository,
    ContactsService,
    ContactsRepository,
    ImportJobsRepository,
  ],
  exports: [ListsRepository, ContactsRepository, ContactsService, ListsService],
})
export class ContactsModule {}
