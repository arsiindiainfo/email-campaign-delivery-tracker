// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ContactsService } from './contacts.service';
import { AddContactDto } from './dto/add-contact.dto';
import { CreateListDto } from './dto/create-list.dto';
import { ImportRequestDto, PresignUploadDto } from './dto/presign-upload.dto';
import { ListsService } from './lists.service';

@ApiTags('lists')
@ApiBearerAuth()
@Controller('lists')
export class ListsController {
  constructor(
    private readonly listsService: ListsService,
    private readonly contactsService: ContactsService,
  ) {}

  @Post()
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Create an empty named list' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateListDto) {
    return this.listsService.create(user.organizationId, user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Paginated list of lists with contact counts' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.listsService.list(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'List detail' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listsService.getOne(user.organizationId, id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete a list' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.listsService.softDelete(user.organizationId, user.userId, id);
    return { deleted: true };
  }

  @Get(':id/contacts')
  @ApiOperation({ summary: 'Paginated contacts within the list' })
  listContacts(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.contactsService.listContacts(user.organizationId, id, query);
  }

  @Post(':id/contacts')
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Add a single contact manually' })
  addContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddContactDto,
  ) {
    return this.contactsService.addContact(user.organizationId, id, dto);
  }

  @Delete(':id/contacts/:contactId')
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Remove a contact from this list only' })
  async removeContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('contactId') contactId: string,
  ): Promise<{ removed: true }> {
    await this.contactsService.removeContact(
      user.organizationId,
      id,
      contactId,
    );
    return { removed: true };
  }

  @Post(':id/imports/presign')
  @Roles(Role.MARKETER)
  @ApiOperation({ summary: 'Get a presigned S3 upload URL for a CSV import' })
  presign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PresignUploadDto,
  ) {
    return this.contactsService.createUploadUrl(user.organizationId, id, dto);
  }

  @Post(':id/import')
  @Roles(Role.MARKETER)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Register an S3 CSV for async import' })
  import(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ImportRequestDto,
  ) {
    return this.contactsService.registerImport(
      user.organizationId,
      id,
      dto.s3Key,
    );
  }

  @Get(':id/imports/:jobId')
  @ApiOperation({ summary: 'Import job progress' })
  getImportJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
  ) {
    return this.contactsService.getImportJob(user.organizationId, jobId);
  }
}
