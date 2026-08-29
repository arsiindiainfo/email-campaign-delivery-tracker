// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { ApiProperty } from '@nestjs/swagger';
import { toIdString } from '../../../common/utils/mongo.util';
import { Role } from '../../../shared/enums/role.enum';
import { UserDocument } from '../schemas/user.schema';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: Role }) role: Role;
  @ApiProperty() organizationId: string;
  @ApiProperty() createdAt: Date;

  static fromDocument(doc: UserDocument): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = toIdString(doc._id);
    dto.name = doc.name;
    dto.email = doc.email;
    dto.role = doc.role;
    dto.organizationId = toIdString(doc.organizationId);
    dto.createdAt = doc.createdAt as Date;
    return dto;
  }
}
