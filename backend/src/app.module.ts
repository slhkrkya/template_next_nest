import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { configValidationSchema } from './config/config.schema';
import { appConfig, jwtConfig, throttleConfig, mailConfig } from './config/app.config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AdminModule } from './modules/admin/admin.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { SubscriptionPlansModule } from './modules/subscription-plans/subscription-plans.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IpBansModule } from './modules/ip-bans/ip-bans.module';
import { RateLimitViolationsModule } from './modules/rate-limit-violations/rate-limit-violations.module';
import { EmailParametersModule } from './modules/email-parameters/email-parameters.module';
import { DataScopesModule } from './modules/data-scopes/data-scopes.module';
import { EntityWorkflowsModule } from './modules/entity-workflows/entity-workflows.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { IpBanMiddleware } from './common/middleware/ip-ban.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { I18nMiddleware } from './common/i18n';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env', // fallback for backward compatibility
      ],
      validationSchema: configValidationSchema,
      load: [appConfig, jwtConfig, throttleConfig, mailConfig],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get('throttle.ttl', 60000),
          limit: config.get('throttle.limit', 100),
        },
        {
          name: 'login',
          ttl: config.get('throttle.login.ttl', 900000),
          limit: config.get('throttle.login.limit', 5),
        },
        {
          name: 'register',
          ttl: config.get('throttle.register.ttl', 3600000),
          limit: config.get('throttle.register.limit', 5),
        },
        {
          name: 'forgotPassword',
          ttl: config.get('throttle.forgotPassword.ttl', 3600000),
          limit: config.get('throttle.forgotPassword.limit', 3),
        },
      ],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AdminModule,
    TenantsModule,
    SubscriptionPlansModule,
    NotificationsModule,
    IpBansModule,
    RateLimitViolationsModule,
    EmailParametersModule,
    DataScopesModule,
    EntityWorkflowsModule,
    FilesModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(I18nMiddleware, IpBanMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
