// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export class CampaignNotFoundException extends NotFoundException {
  errorCode = ErrorCode.CAMPAIGN_NOT_FOUND;
  constructor(message = 'Campaign not found') {
    super(message);
  }
}

export class TemplateNotFoundException extends NotFoundException {
  errorCode = ErrorCode.TEMPLATE_NOT_FOUND;
  constructor(message = 'Template not found') {
    super(message);
  }
}

export class ListNotFoundException extends NotFoundException {
  errorCode = ErrorCode.LIST_NOT_FOUND;
  constructor(message = 'Contact list not found') {
    super(message);
  }
}

export class ContactNotFoundException extends NotFoundException {
  errorCode = ErrorCode.CONTACT_NOT_FOUND;
  constructor(message = 'Contact not found') {
    super(message);
  }
}

export class UserNotFoundException extends NotFoundException {
  errorCode = ErrorCode.USER_NOT_FOUND;
  constructor(message = 'User not found') {
    super(message);
  }
}

export class SuppressionNotFoundException extends NotFoundException {
  errorCode = ErrorCode.SUPPRESSION_NOT_FOUND;
  constructor(message = 'Suppression entry not found') {
    super(message);
  }
}

export class ImportJobNotFoundException extends NotFoundException {
  errorCode = ErrorCode.IMPORT_JOB_NOT_FOUND;
  constructor(message = 'Import job not found') {
    super(message);
  }
}

export class DuplicateNameException extends ConflictException {
  errorCode = ErrorCode.DUPLICATE_NAME;
  constructor(message = 'A record with that name already exists') {
    super(message);
  }
}

export class VersionConflictException extends ConflictException {
  errorCode = ErrorCode.VERSION_CONFLICT;
  constructor(message = 'The record was modified since it was last read') {
    super(message);
  }
}

export class SuppressedRecipientException extends ConflictException {
  errorCode = ErrorCode.SUPPRESSED_RECIPIENT;
  constructor(message = 'This address is on the suppression list') {
    super(message);
  }
}

export class SenderNotVerifiedException extends UnprocessableEntityException {
  errorCode = ErrorCode.SENDER_NOT_VERIFIED;
  constructor(message = 'From-email domain is not a verified sender identity') {
    super(message);
  }
}

export class InvalidStateTransitionException extends BadRequestException {
  errorCode = ErrorCode.INVALID_STATE_TRANSITION;
  constructor(
    message = 'This action is not valid for the record in its current state',
  ) {
    super(message);
  }
}

export class InvalidWebhookSignatureException extends UnauthorizedException {
  errorCode = ErrorCode.INVALID_WEBHOOK_SIGNATURE;
  constructor(message = 'Webhook signature verification failed') {
    super(message);
  }
}

export class ForbiddenRoleException extends ForbiddenException {
  errorCode = ErrorCode.FORBIDDEN_ROLE;
  constructor(message = 'Your role does not permit this action') {
    super(message);
  }
}
