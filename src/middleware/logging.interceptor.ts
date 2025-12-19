import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  type LoggerService,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // Inject Winston logger instead of using built-in Logger
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<{ method?: string; url?: string; body?: unknown }>();
    const method = req?.method ?? 'UNKNOWN_METHOD';
    const url = req?.url ?? 'UNKNOWN_URL';
    // const body = req?.body ?? {};

    // Record start time for calculating request duration
    const startTime = Date.now();

    // Log incoming request
    // Using 'http' level for HTTP request logs (you can also use 'log' or 'info')
    this.logger.log(
      `→ Incoming Request: ${method} ${url}`,
      LoggingInterceptor.name,
    );

    // Log request body (sanitize sensitive data in production!)
    // if (Object.keys(body).length > 0 && this.logger.debug) {
    //   this.logger.debug(
    //     `Request Body: ${JSON.stringify(body)}`,
    //     LoggingInterceptor.name,
    //   );
    // }

    return next.handle().pipe(
      // Log successful response
      tap(() => {
        const res = context
          .switchToHttp()
          .getResponse<{ statusCode?: number }>();
        const duration = Date.now() - startTime;
        const statusCode = res?.statusCode ?? 'UNKNOWN';

        this.logger.log(
          `← Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`,
          LoggingInterceptor.name,
        );
      }),

      // Log errors if request fails
      catchError((error: unknown) => {
        const duration = Date.now() - startTime;
        const res = context
          .switchToHttp()
          .getResponse<{ statusCode?: number }>();

        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.error(
          `✗ Error: ${method} ${url} - Status: ${res?.statusCode ?? 'UNKNOWN'} - Duration: ${duration}ms - Error: ${errorMessage}`,
          errorStack,
          LoggingInterceptor.name,
        );

        // Re-throw error so error handlers can process it
        return throwError(() => error);
      }),
    );
  }
}
