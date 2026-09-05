// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DemoSendLog,
  DemoSendLogSchema,
} from '../campaigns/schemas/demo-send-log.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import {
  Organization,
  OrganizationSchema,
} from '../organizations/schemas/organization.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: DemoSendLog.name, schema: DemoSendLogSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
