import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SKIP_WRAP } from '../decorators/skip-wrap.decorator';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.get<boolean>(SKIP_WRAP, ctx.getHandler());
    if (skip) return next.handle();

    return next.handle().pipe(
      map((result: unknown) => {
        type ResponseEnvelope<T> = {
          status_code?: number;
          statusCode?: number;
          message?: string | null;
          data?: T | null;
        };

        const isEnvelope = (val: unknown): val is ResponseEnvelope<unknown> => {
          if (!val || typeof val !== 'object') return false;
          const obj = val as Record<string, unknown>;
          if ('status_code' in obj && 'message' in obj && 'data' in obj) {
            return true;
          }
          if ('statusCode' in obj && 'message' in obj && 'data' in obj) {
            return true;
          }
          return false;
        };

        if (isEnvelope(result)) {
          const envelope = result as ResponseEnvelope<unknown> & {
            meta?: unknown;
          };
          const response: Record<string, unknown> = {
            status_code: envelope.status_code ?? envelope.statusCode ?? 200,
            message: envelope.message ?? null,
            data: envelope.data ?? null,
          };
          // Preserve meta if it exists
          if ('meta' in envelope && envelope.meta !== undefined) {
            response.meta = envelope.meta;
          }
          return response;
        }

        const response = ctx
          .switchToHttp()
          .getResponse<{ statusCode?: number }>();
        const httpStatusCode: number =
          typeof response?.statusCode === 'number' ? response.statusCode : 200;

        let statusCode = httpStatusCode;
        if (
          result &&
          typeof result === 'object' &&
          !Array.isArray(result) &&
          !(result instanceof Date)
        ) {
          const resultObj = result as Record<string, unknown>;
          if (typeof resultObj.status_code === 'number') {
            statusCode = resultObj.status_code;
          } else if (typeof resultObj.statusCode === 'number') {
            statusCode = resultObj.statusCode;
          }
        }

        if (
          result &&
          typeof result === 'object' &&
          !Array.isArray(result) &&
          !(result instanceof Date) &&
          typeof (result as Record<string, unknown>).message === 'string'
        ) {
          const resultObj = result as Record<string, unknown>;
          const {
            message,
            status_code: sc,
            statusCode: scCamel,
            meta,
            ...rest
          } = resultObj;
          const hasKeys = Object.keys(rest).length > 0;
          const data: Record<string, unknown> | null = hasKeys ? rest : null;

          const response: Record<string, unknown> = {
            status_code: sc ?? scCamel ?? statusCode,
            message: message as string,
            data,
          };
          // Preserve meta if it exists
          if (meta !== undefined) {
            response.meta = meta;
          }
          return response;
        }

        if (
          result &&
          typeof result === 'object' &&
          !Array.isArray(result) &&
          !(result instanceof Date)
        ) {
          const resultObj = result as Record<string, unknown>;
          if ('status_code' in resultObj || 'statusCode' in resultObj) {
            const {
              status_code: sc,
              statusCode: scCamel,
              meta,
              ...rest
            } = resultObj;
            const hasKeys = Object.keys(rest).length > 0;
            const response: Record<string, unknown> = {
              status_code: sc ?? scCamel ?? statusCode,
              message:
                typeof resultObj.message === 'string'
                  ? resultObj.message
                  : null,
              data: hasKeys ? rest : null,
            };
            // Preserve meta if it exists
            if (meta !== undefined) {
              response.meta = meta;
            }
            return response;
          }
        }

        return {
          status_code: statusCode,
          message: null,
          data: result === undefined ? null : (result as unknown),
        };
      }),
    );
  }
}
