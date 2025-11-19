import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { BaseException } from '../base-exception';

interface IHttpExceptionResponse {
  message?: string | string[];
  error?: string | null;
}

interface IValidationErrorResponse {
  message?: string | string[];
  error?: string;
}

interface IValidationError {
  response?: IValidationErrorResponse;
  status?: number;
}

interface IDatabaseError {
  code?: string;
  message?: string;
  stack?: string;
  detail?: unknown;
  meta?: unknown;
}

interface IErrorResponse {
  status_code: number;
  message: string | string[];
  error: string | null;
  data: null;
  timestamp: string;
  path: string;
  method: string;
  stack?: string;
}

interface IRequestWithUser extends Request {
  user?: {
    id?: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<IRequestWithUser>();

    let status: number;
    let message: string | string[];
    let error: string | null = null;
    let stack: string | undefined;
    const isDev = process.env.NODE_ENV !== 'production';

    // Handle HttpException and its subclasses (including BaseException)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as IHttpExceptionResponse;
        message = responseObj.message || 'An error occurred';
        error = responseObj.error || null;
      } else {
        message = 'An error occurred';
      }

      // Capture stack trace for HttpException
      stack = exception instanceof Error ? exception.stack : undefined;

      // Log BaseException with additional context
      if (exception instanceof BaseException) {
        const logMessage = `${exception.name || 'BaseException'}: ${Array.isArray(message) ? message.join(', ') : message} - Status: ${status} - Path: ${request.method} ${request.url} - UserId: ${request.user?.id || 'anonymous'}`;
        const logLevel = status >= 500 ? 'error' : 'warn';
        if (logLevel === 'error') {
          this.logger.error(logMessage, stack, GlobalExceptionFilter.name);
        } else {
          this.logger.warn(logMessage, GlobalExceptionFilter.name);
        }
      } else {
        // Log other HttpExceptions
        const logMessage = `${exception.name || 'HttpException'}: ${Array.isArray(message) ? message.join(', ') : message} - Status: ${status} - Path: ${request.method} ${request.url}`;
        const logLevel = status >= 500 ? 'error' : 'warn';
        if (logLevel === 'error') {
          this.logger.error(logMessage, stack, GlobalExceptionFilter.name);
        } else {
          this.logger.warn(logMessage, GlobalExceptionFilter.name);
        }
      }
    }
    // Handle validation errors (class-validator)
    else if (
      exception &&
      typeof exception === 'object' &&
      'response' in exception &&
      ('message' in (exception as IValidationError).response ||
        'status' in exception)
    ) {
      const validationError = exception as IValidationError;
      status = validationError.status || HttpStatus.BAD_REQUEST;
      message = validationError.response?.message || 'Validation failed';
      error = validationError.response?.error || 'Validation Error';

      this.logger.warn(
        `Validation Error: ${Array.isArray(message) ? message.join(', ') : message} - Path: ${request.method} ${request.url}`,
        GlobalExceptionFilter.name,
      );
    }
    // Handle database errors (TypeORM, Prisma, etc.)
    else if (
      exception &&
      typeof exception === 'object' &&
      ('code' in exception || 'detail' in exception || 'meta' in exception)
    ) {
      const dbError = exception as IDatabaseError;
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database operation failed';
      error = dbError.code || 'DATABASE_ERROR';
      stack = dbError.stack;

      this.logger.error(
        `Database Error: ${dbError.message || 'Unknown database error'} - Code: ${error} - Path: ${request.method} ${request.url}`,
        stack,
        GlobalExceptionFilter.name,
      );
    }
    // Handle unknown errors
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'INTERNAL_SERVER_ERROR';

      const errorMessage =
        exception instanceof Error ? exception.message : 'Unknown error';
      const errorStack =
        exception instanceof Error ? exception.stack : undefined;

      // Log full error details
      this.logger.error(
        `Unhandled Exception: ${errorMessage} - Path: ${request.method} ${request.url} - UserId: ${request.user?.id || 'anonymous'}`,
        errorStack,
        GlobalExceptionFilter.name,
      );

      stack = errorStack;
    }

    // Normalize message - keep as string or array based on original format
    const normalizedMessage = Array.isArray(message) ? message : message;

    const errorResponse: IErrorResponse = {
      status_code: status,
      message: normalizedMessage,
      error: error,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Only include stack trace in development
    if (isDev && stack) {
      errorResponse.stack = stack;
    }

    // Sanitize response in production for security
    if (!isDev && status >= 500) {
      errorResponse.message = 'An internal server error occurred';
      errorResponse.error = 'Internal Server Error';
    }

    response.status(status).json(errorResponse);
  }
}
