import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import { LoggingInterceptor } from './middleware/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // This makes NestJS use Winston for all its internal logging too
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // This ensures Winston logger is properly injected
  const loggingInterceptor = app.get(LoggingInterceptor);
  app.useGlobalInterceptors(loggingInterceptor);
  await app.listen(3000);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Application is running on: http://localhost:3000`, 'Bootstrap');
}
bootstrap();
