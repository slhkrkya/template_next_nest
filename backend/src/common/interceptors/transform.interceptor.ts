import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService } from '../i18n';

export interface TransformedResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, TransformedResponse<T>>
{
  constructor(private readonly i18n: I18nService) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const translatedData =
          data &&
          typeof data === 'object' &&
          'message' in data &&
          typeof (data as Record<string, unknown>).message === 'string'
            ? {
                ...(data as Record<string, unknown>),
                message: this.i18n.translateMessage((data as Record<string, unknown>).message),
              }
            : data;

        return {
          success: true as const,
          data: translatedData as T,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
