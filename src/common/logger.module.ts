import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';

import { winstonConfig } from './winston.config';

/**
 * Logger Module
 *
 * This module provides a global Winston logger for the entire application.
 *
 * How it works:
 * 1. `WinstonModule.forRoot()` registers a Winston logger as the main logger.
 * 2. Any service can inject the logger using the `WINSTON_MODULE_PROVIDER` token.
 * 3. Each service can create a child logger with a custom context for structured logging.
 *
 * Usage in services:
 * ```typescript
 * import { Inject, Injectable } from '@nestjs/common';
 * import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
 * import { Logger } from 'winston';
 *
 * @Injectable()
 * export class ExampleService {
 *   private readonly logger: Logger;
 *
 *   constructor(
 *     @Inject(WINSTON_MODULE_PROVIDER) private readonly baseLogger: Logger,
 *   ) {
 *     // Attach service context to logs
 *     this.logger = this.baseLogger.child({ context: ExampleService.name });
 *   }
 *
 *   doSomething() {
 *     this.logger.info('Action executed');
 *     this.logger.error('Something went wrong');
 *     this.logger.debug('Debug details here');
 *   }
 * }
 * ```
 */

@Global()
@Module({
  imports: [
    // Register Winston as the global logger
    WinstonModule.forRoot(winstonConfig),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
