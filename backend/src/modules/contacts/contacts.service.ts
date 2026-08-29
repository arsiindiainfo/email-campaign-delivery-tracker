// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parse } from 'csv-parse';
import { AppConfig } from '../../config/configuration';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  ImportJobNotFoundException,
  SuppressedRecipientException,
} from '../../shared/exceptions/domain.exception';
import { QueueService } from '../queue/queue.service';
import { StorageService } from '../storage/storage.service';
import { SuppressionsService } from '../suppressions/suppressions.service';
import { AddContactDto } from './dto/add-contact.dto';
import { ContactResponseDto } from './dto/contact-response.dto';
import { ImportJobResponseDto } from './dto/import-job-response.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { ContactsRepository } from './contacts.repository';
import { ImportJobsRepository } from './import-jobs.repository';
import { ImportJobStatus } from './schemas/import-job.schema';
import { ListsRepository } from './lists.repository';
import { ListsService } from './lists.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_IMPORT_ROWS = 25_000;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export interface ImportQueueMessage {
  importJobId: string;
  organizationId: string;
  listId: string;
  s3Key: string;
}

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly contactsRepository: ContactsRepository,
    private readonly listsRepository: ListsRepository,
    private readonly listsService: ListsService,
    private readonly importJobsRepository: ImportJobsRepository,
    private readonly suppressionsService: SuppressionsService,
    private readonly storageService: StorageService,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async listContacts(
    organizationId: string,
    listId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ContactResponseDto>> {
    await this.listsService.getActiveOrThrow(organizationId, listId);
    const { data, total } = await this.contactsRepository.paginate(
      organizationId,
      { listIds: listId },
      { skip: query.skip, limit: query.limit },
    );
    return new PaginatedResponse(
      data.map((doc) => ContactResponseDto.fromDocument(doc)),
      total,
      query.page,
      query.limit,
    );
  }

  async addContact(
    organizationId: string,
    listId: string,
    dto: AddContactDto,
  ): Promise<ContactResponseDto> {
    await this.listsService.getActiveOrThrow(organizationId, listId);

    if (
      !dto.override &&
      (await this.suppressionsService.isSuppressed(organizationId, dto.email))
    ) {
      throw new SuppressedRecipientException();
    }

    let contact = await this.contactsRepository.findByEmail(
      organizationId,
      dto.email,
    );
    if (contact) {
      await this.contactsRepository.addToList(
        organizationId,
        contact.id as string,
        listId,
      );
    } else {
      contact = await this.contactsRepository.create(organizationId, {
        email: dto.email.toLowerCase(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        listIds: [listId],
      });
    }

    const count = await this.contactsRepository.countInList(
      organizationId,
      listId,
    );
    await this.listsRepository.recalculateContactCount(listId, count);

    const refreshed = await this.contactsRepository.findById(
      organizationId,
      contact.id as string,
    );
    return ContactResponseDto.fromDocument(refreshed!);
  }

  async removeContact(
    organizationId: string,
    listId: string,
    contactId: string,
  ): Promise<void> {
    await this.listsService.getActiveOrThrow(organizationId, listId);
    await this.contactsRepository.removeFromList(
      organizationId,
      contactId,
      listId,
    );
    const count = await this.contactsRepository.countInList(
      organizationId,
      listId,
    );
    await this.listsRepository.recalculateContactCount(listId, count);
  }

  async createUploadUrl(
    organizationId: string,
    listId: string,
    dto: PresignUploadDto,
  ) {
    await this.listsService.getActiveOrThrow(organizationId, listId);
    return this.storageService.createUploadUrl(organizationId, dto.filename);
  }

  async registerImport(
    organizationId: string,
    listId: string,
    s3Key: string,
  ): Promise<{ importJobId: string }> {
    await this.listsService.getActiveOrThrow(organizationId, listId);
    if (!this.storageService.belongsToOrganization(organizationId, s3Key)) {
      throw new BadRequestException(
        's3Key does not belong to this organization',
      );
    }
    if (!s3Key.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Only .csv files can be imported');
    }

    const importJob = await this.importJobsRepository.create(organizationId, {
      listId,
      s3Key,
    });
    const message: ImportQueueMessage = {
      importJobId: importJob.id as string,
      organizationId,
      listId,
      s3Key,
    };
    await this.queueService.send(
      this.configService.get('sqs.importQueueUrl', { infer: true })!,
      message,
    );
    return { importJobId: importJob.id as string };
  }

  async getImportJob(
    organizationId: string,
    jobId: string,
  ): Promise<ImportJobResponseDto> {
    const job = await this.importJobsRepository.findById(organizationId, jobId);
    if (!job) {
      throw new ImportJobNotFoundException();
    }
    return ImportJobResponseDto.fromDocument(job);
  }

  /**
   * Runs on the worker process only, triggered by an import-queue message.
   * Streams the CSV row-by-row so a 25k-row file never loads fully into
   * memory, matching §30's "never processed inline" mitigation.
   */
  async processImportJob(message: ImportQueueMessage): Promise<void> {
    const { importJobId, organizationId, listId, s3Key } = message;
    await this.importJobsRepository.updateById(organizationId, importJobId, {
      status: ImportJobStatus.PROCESSING,
    });

    let imported = 0;
    let skipped = 0;
    let total = 0;
    const skippedSamples: string[] = [];

    try {
      const stream = await this.storageService.getObjectStream(s3Key);
      const parser = stream.pipe(
        parse({ columns: true, trim: true, skip_empty_lines: true }),
      );

      for await (const rawRow of parser as AsyncIterable<
        Record<string, string>
      >) {
        total += 1;
        if (total > MAX_IMPORT_ROWS) {
          throw new Error(
            `CSV exceeds the ${MAX_IMPORT_ROWS}-row import limit`,
          );
        }

        const email = (rawRow.email ?? rawRow.Email ?? '').trim().toLowerCase();
        const firstName = rawRow.firstName ?? rawRow.FirstName;
        const lastName = rawRow.lastName ?? rawRow.LastName;

        if (!EMAIL_REGEX.test(email)) {
          skipped += 1;
          if (skippedSamples.length < 20)
            skippedSamples.push(`${rawRow.email ?? ''} — invalid email`);
          continue;
        }
        if (
          await this.suppressionsService.isSuppressed(organizationId, email)
        ) {
          skipped += 1;
          if (skippedSamples.length < 20)
            skippedSamples.push(`${email} — already suppressed`);
          continue;
        }

        await this.contactsRepository.upsertForImport(
          organizationId,
          listId,
          email,
          firstName,
          lastName,
        );
        imported += 1;
      }

      const count = await this.contactsRepository.countInList(
        organizationId,
        listId,
      );
      await this.listsRepository.recalculateContactCount(listId, count);

      await this.importJobsRepository.updateById(organizationId, importJobId, {
        status: ImportJobStatus.COMPLETED,
        totalRows: total,
        importedCount: imported,
        skippedCount: skipped,
        skippedSamples,
        completedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Import job ${importJobId} failed`, error as Error);
      await this.importJobsRepository.updateById(organizationId, importJobId, {
        status: ImportJobStatus.FAILED,
        totalRows: total,
        importedCount: imported,
        skippedCount: skipped,
        skippedSamples,
        errorMessage: (error as Error).message,
        completedAt: new Date(),
      });
    }
  }
}

export const IMPORT_LIMITS = { MAX_IMPORT_ROWS, MAX_IMPORT_BYTES };
