import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import { LoggingInterceptor } from './middleware/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const allowedOrigins = configService
    .get<string>('cors.origins', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  });

  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const apiVersion = configService.get<string>('API_VERSION', 'v1');
  const globalPrefix = `${apiPrefix}/${apiVersion}`;

  app.setGlobalPrefix(globalPrefix, {
    exclude: ['docs'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup
  const appName = configService.get<string>('app.name', 'SchoolBase Website');
  const config = new DocumentBuilder()
    .setTitle(`${appName} API`)
    .setDescription(`API documentation for ${appName}`)
    .setVersion('1.0')
    .addTag('Waitlist')
    .addTag('Contact')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Use Winston logger globally
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Inject your LoggingInterceptor
  const loggingInterceptor = app.get(LoggingInterceptor);
  app.useGlobalInterceptors(loggingInterceptor);

  const isDev = configService.get<boolean>('isDev');
  const port = configService.get<string>('port');
  const env = configService.get<string>('env');

  if (isDev) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    app.use(require('morgan')('dev'));
  }

  // Get the Winston logger to use after startup
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);

  await app.listen(port, '0.0.0.0');

  logger.log(
    `
      ------------
      Internal Application Started!
      Environment: ${env}
      API: http://localhost:${port}/${globalPrefix}
      API Docs: http://localhost:${port}/docs
      ------------
  `,
    ` ${appName} | ${env}`,
  );
}

bootstrap();
