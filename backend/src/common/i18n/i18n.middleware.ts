import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { I18nService } from './i18n.service';

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  constructor(private readonly i18n: I18nService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const cookieLocale = req.cookies?.NEXT_LOCALE;
    const headerLocale = req.headers['accept-language'];
    const locale = Array.isArray(headerLocale)
      ? headerLocale[0]
      : headerLocale ?? cookieLocale;

    this.i18n.runWithLocale(locale ?? cookieLocale, next);
  }
}
