// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Module } from '@nestjs/common';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { EventsModule } from '../events/events.module';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { UnsubscribeController } from './unsubscribe.controller';

@Module({
  imports: [CampaignsModule, EventsModule],
  controllers: [TrackingController, UnsubscribeController],
  providers: [TrackingService],
})
export class TrackingModule {}
