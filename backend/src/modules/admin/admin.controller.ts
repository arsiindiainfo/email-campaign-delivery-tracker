// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformAdminOnly } from '../../common/decorators/platform-admin-only.decorator';
import { ContactApprovalStatus } from '../contacts/schemas/contact.schema';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@PlatformAdminOnly()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List every user across every organization (platform admin only)' })
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block a user — they can no longer log in' })
  blockUser(@Param('id') id: string) {
    return this.adminService.setUserBlocked(id, true).then(() => ({ blocked: true }));
  }

  @Patch('users/:id/unblock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock a previously-blocked user' })
  unblockUser(@Param('id') id: string) {
    return this.adminService.setUserBlocked(id, false).then(() => ({ blocked: false }));
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a user account' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id).then(() => ({ deleted: true }));
  }

  @Get('contacts')
  @ApiOperation({ summary: 'List contacts across every organization, optionally filtered by approval status' })
  listContacts(@Query('status') status?: ContactApprovalStatus) {
    return this.adminService.listContacts(status);
  }

  @Patch('contacts/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a contact — it becomes a valid send target' })
  approveContact(@Param('id') id: string) {
    return this.adminService
      .setContactApproval(id, ContactApprovalStatus.APPROVED)
      .then(() => ({ approvalStatus: ContactApprovalStatus.APPROVED }));
  }

  @Patch('contacts/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a contact — it stays blocked from receiving mail' })
  rejectContact(@Param('id') id: string) {
    return this.adminService
      .setContactApproval(id, ContactApprovalStatus.REJECTED)
      .then(() => ({ approvalStatus: ContactApprovalStatus.REJECTED }));
  }

  @Get('send-log')
  @ApiOperation({ summary: 'Audit report: who sent mail, when, and what (all organizations)' })
  listSendLog() {
    return this.adminService.listSendLog();
  }
}
