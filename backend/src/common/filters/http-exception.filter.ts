// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../../shared/enums/error-code.enum';

interface ErrorDetail {
  field: string;
  message: string;
}

interface ErrorEnvelope {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    details?: ErrorDetail[];
  };
}

type RequestWithId = Request & { id?: unknown };

/**
 * Converts every thrown error — domain, validation, or unexpected — into the
 * standard §12.3 error envelope. Unexpected errors never leak a stack trace
 * to the client; they are logged with the request's correlation id instead.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const errorCode = (exception as { errorCode?: ErrorCode }).errorCode;

      if (
        exception instanceof BadRequestException &&
        this.isValidationBody(body)
      ) {
        response.status(status).json(this.buildValidationEnvelope(body));
        return;
      }

      const message =
        typeof body === 'string'
          ? body
          : (body as { message?: string }).message || exception.message;

      response
        .status(status)
        .json(
          this.buildEnvelope(
            errorCode ?? this.defaultCodeForStatus(status),
            message,
          ),
        );
      return;
    }

    const correlationId =
      typeof request.id === 'string' || typeof request.id === 'number'
        ? request.id
        : 'unknown';
    this.logger.error(
      `Unhandled exception [correlationId=${correlationId}]`,
      (exception as Error)?.stack,
    );

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        this.buildEnvelope(
          ErrorCode.INTERNAL_ERROR,
          'An unexpected error occurred.',
        ),
      );
  }

  private isValidationBody(body: unknown): body is { message: string[] } {
    return (
      typeof body === 'object' &&
      body !== null &&
      Array.isArray((body as { message?: unknown }).message)
    );
  }

  private buildValidationEnvelope(body: { message: string[] }): ErrorEnvelope {
    const details: ErrorDetail[] = body.message.map((raw) => {
      const [field] = raw.split(' ');
      return { field, message: raw };
    });
    return this.buildEnvelope(
      ErrorCode.VALIDATION_ERROR,
      'Request payload failed validation.',
      details,
    );
  }

  private buildEnvelope(
    code: ErrorCode | string,
    message: string,
    details?: ErrorDetail[],
  ): ErrorEnvelope {
    return {
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
    };
  }

  private defaultCodeForStatus(status: HttpStatus): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN_ROLE;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
