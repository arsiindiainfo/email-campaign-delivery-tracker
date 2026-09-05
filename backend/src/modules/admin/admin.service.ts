// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Contact,
  ContactApprovalStatus,
  ContactDocument,
} from '../contacts/schemas/contact.schema';
import {
  Organization,
  OrganizationDocument,
} from '../organizations/schemas/organization.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  DemoSendLog,
  DemoSendLogDocument,
} from '../campaigns/schemas/demo-send-log.schema';

/** Cross-organization admin views — deliberately bypasses the org-scoped repository pattern used everywhere else, since a platform admin must see across all tenants. */
@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    @InjectModel(DemoSendLog.name)
    private readonly demoSendLogModel: Model<DemoSendLogDocument>,
  ) {}

  private async organizationNameMap(
    organizationIds: string[],
  ): Promise<Map<string, string>> {
    const orgs = await this.organizationModel
      .find({ _id: { $in: organizationIds } })
      .select('name')
      .exec();
    return new Map(orgs.map((o) => [o.id as string, o.name]));
  }

  async listUsers(): Promise<{ items: unknown[]; total: number }> {
    const users = await this.userModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
    const orgNames = await this.organizationNameMap(
      users.map((u) => u.organizationId.toString()),
    );
    const items = users.map((u) => ({
      id: u.id as string,
      name: u.name,
      email: u.email,
      role: u.role,
      organizationId: u.organizationId.toString(),
      organizationName: orgNames.get(u.organizationId.toString()) ?? 'Unknown',
      emailVerified: u.emailVerified,
      isBlocked: u.isBlocked,
      isPlatformAdmin: u.isPlatformAdmin,
      createdAt: u.createdAt,
    }));
    return { items, total: items.length };
  }

  async setUserBlocked(userId: string, isBlocked: boolean): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    if (user.isPlatformAdmin) {
      throw new BadRequestException('Cannot block a platform admin account');
    }
    user.isBlocked = isBlocked;
    await user.save();
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    if (user.isPlatformAdmin) {
      throw new BadRequestException('Cannot delete a platform admin account');
    }
    await this.userModel.deleteOne({ _id: userId }).exec();
  }

  async listContacts(
    status?: ContactApprovalStatus,
  ): Promise<{ items: unknown[]; total: number }> {
    const filter = status ? { approvalStatus: status } : {};
    const contacts = await this.contactModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .exec();
    const orgNames = await this.organizationNameMap(
      contacts.map((c) => c.organizationId.toString()),
    );
    const items = contacts.map((c) => ({
      id: c.id as string,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      organizationId: c.organizationId.toString(),
      organizationName: orgNames.get(c.organizationId.toString()) ?? 'Unknown',
      approvalStatus: c.approvalStatus,
      createdAt: c.createdAt,
    }));
    return { items, total: items.length };
  }

  async setContactApproval(
    contactId: string,
    status: ContactApprovalStatus,
  ): Promise<void> {
    const result = await this.contactModel
      .findByIdAndUpdate(contactId, { $set: { approvalStatus: status } })
      .exec();
    if (!result) throw new NotFoundException('Contact not found');
  }

  async listSendLog(): Promise<{ items: unknown[]; total: number }> {
    const logs = await this.demoSendLogModel
      .find()
      .sort({ sentAt: -1 })
      .limit(500)
      .exec();
    const orgNames = await this.organizationNameMap(
      logs.map((l) => l.organizationId.toString()),
    );
    const users = await this.userModel
      .find({ _id: { $in: logs.map((l) => l.userId) } })
      .select('name email')
      .exec();
    const userMap = new Map(
      users.map((u) => [u.id as string, { name: u.name, email: u.email }]),
    );
    const items = logs.map((l) => {
      const userInfo = userMap.get(l.userId.toString());
      return {
        id: l.id as string,
        organizationId: l.organizationId.toString(),
        organizationName:
          orgNames.get(l.organizationId.toString()) ?? 'Unknown',
        userId: l.userId.toString(),
        userName: userInfo?.name ?? 'Unknown',
        userEmail: userInfo?.email ?? 'Unknown',
        count: l.count,
        subject: l.subject,
        recipients: l.recipients,
        sentAt: l.sentAt,
      };
    });
    return { items, total: items.length };
  }
}
