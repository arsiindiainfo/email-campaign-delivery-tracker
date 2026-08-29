// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsModule } from '../contacts/contacts.module';
import { Suppression, SuppressionSchema } from './schemas/suppression.schema';
import { SuppressionsController } from './suppressions.controller';
import { SuppressionsRepository } from './suppressions.repository';
import { SuppressionsService } from './suppressions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Suppression.name, schema: SuppressionSchema },
    ]),
    forwardRef(() => ContactsModule),
  ],
  controllers: [SuppressionsController],
  providers: [SuppressionsService, SuppressionsRepository],
  exports: [SuppressionsService],
})
export class SuppressionsModule {}
