// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { toIdString } from '../../../common/utils/mongo.util';
import {
  ImportJobDocument,
  ImportJobStatus,
} from '../schemas/import-job.schema';

export class ImportJobResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() listId: string;
  @ApiProperty({ enum: ImportJobStatus }) status: ImportJobStatus;
  @ApiProperty() totalRows: number;
  @ApiProperty() importedCount: number;
  @ApiProperty() skippedCount: number;
  @ApiProperty({ type: [String] }) skippedSamples: string[];
  @ApiProperty({ required: false }) errorMessage?: string;

  static fromDocument(doc: ImportJobDocument): ImportJobResponseDto {
    const dto = new ImportJobResponseDto();
    dto.id = toIdString(doc._id);
    dto.listId = toIdString(doc.listId);
    dto.status = doc.status;
    dto.totalRows = doc.totalRows;
    dto.importedCount = doc.importedCount;
    dto.skippedCount = doc.skippedCount;
    dto.skippedSamples = doc.skippedSamples;
    dto.errorMessage = doc.errorMessage;
    return dto;
  }
}
