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

  // Enable API versioning
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const apiVersion = configService.get<string>('API_VERSION', 'v1');
  const globalPrefix = `${apiPrefix}/${apiVersion}`;
  configService.get<string>('SWAGGER_SERVER_PATH', 'docs');

  app.setGlobalPrefix(globalPrefix, {
    exclude: ['docs'],
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Open School Portal API')
    .setDescription('API documentation for Open School Portal')
    .setVersion('1.0')
    .addTag('Waitlist')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // const swaggerPath = configService.get<string>('SWAGGER_PATH', 'docs');
  // const fullSwaggerPath = `${apiPrefix}/${apiVersion}/${swaggerPath}`;

  SwaggerModule.setup('docs', app, document);

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const loggingInterceptor = app.get(LoggingInterceptor);
  app.useGlobalInterceptors(loggingInterceptor);
  await app.listen(3000);
}
bootstrap();
