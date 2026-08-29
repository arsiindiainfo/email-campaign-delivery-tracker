// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResponse } from '../dto/paginated-response.dto';

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMetaShape;
}

interface PaginationMetaShape {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Wraps every controller return value in the { success, data, meta? } envelope (§12).
 * A PaginatedResponse is unwrapped into data + meta; anything else becomes bare data.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessEnvelope<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessEnvelope<T>> {
    return next.handle().pipe(
      map((result) => {
        if (result instanceof PaginatedResponse) {
          return {
            success: true,
            data: result.data,
            meta: result.meta,
          } as SuccessEnvelope<T>;
        }
        return { success: true, data: result };
      }),
    );
  }
}
