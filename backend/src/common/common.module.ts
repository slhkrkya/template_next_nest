import { Global, Module } from '@nestjs/common';
import { PermissionCheckerService } from './services/permission-checker.service';
import { PrismaUnitOfWork } from './unit-of-work/prisma-unit-of-work';
import { UNIT_OF_WORK } from './unit-of-work/unit-of-work.interface';
import { CsrfService } from './csrf/csrf.service';
import { CsrfGuard } from './csrf/csrf.guard';
import { CaptchaService } from './captcha/captcha.service';
import { I18nService, I18nMiddleware } from './i18n';

@Global()
@Module({
  providers: [
    PermissionCheckerService,
    { provide: UNIT_OF_WORK, useClass: PrismaUnitOfWork },
    CsrfService,
    CsrfGuard,
    CaptchaService,
    I18nService,
    I18nMiddleware,
  ],
  exports: [
    PermissionCheckerService,
    UNIT_OF_WORK,
    CsrfService,
    CsrfGuard,
    CaptchaService,
    I18nService,
    I18nMiddleware,
  ],
})
export class CommonModule {}
