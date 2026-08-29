// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';

@Module({
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
