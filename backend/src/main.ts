import { NestFactory } from '@nestjs/core';
import { BadRequestException, Logger, ValidationError, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { I18nService } from './common/i18n';

function localizeValidationErrors(errors: ValidationError[], i18n: I18nService): string[] {
  return errors.flatMap((error) => {
    const constraints = error.constraints ?? {};
    const messages = Object.keys(constraints).map((constraintName) => {
      const firstConstraint = error.contexts?.[constraintName]?.constraint1;
      return i18n.t(`validation.${constraintName}`, {
        property: error.property,
        constraint1: typeof firstConstraint === 'string' || typeof firstConstraint === 'number'
          ? firstConstraint
          : '',
      });
    });
    const childMessages = error.children?.length
      ? localizeValidationErrors(error.children, i18n)
      : [];
    return [...messages, ...childMessages];
  });
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const i18n = app.get(I18nService);

  // Security headers
  app.use(helmet());

  // Compression
  app.use(compression());

  // Cookie parser
  const cookieSecret = configService.getOrThrow<string>('COOKIE_SECRET');
  app.use(cookieParser(cookieSecret));

  // CORS
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  app.enableCors({
    origin: [frontendUrl],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'x-tenant-id', 'x-csrf-token'],
    exposedHeaders: ['x-csrf-token'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'common.validationFailed',
          errors: localizeValidationErrors(errors, i18n),
        }),
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter(i18n));

  // Global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor(i18n));

  // Swagger (dev only)
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  if (!isProduction) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('NestJS Backend API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('access_token')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  }

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  if (!isProduction) {
    logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
