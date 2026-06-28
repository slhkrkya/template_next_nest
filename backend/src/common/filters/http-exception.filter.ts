import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from '../i18n';
import { PrismaService } from '../../prisma/prisma.service';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: unknown[];
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    private readonly i18n: I18nService,
    private readonly prisma: PrismaService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string;
    let errors: unknown[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || exception.message;

        // Validation errors arrive as an array on `message`
        if (Array.isArray(resp.message)) {
          errors = resp.message as unknown[];
          message = 'common.validationFailed';
        }

        if (Array.isArray(resp.errors)) {
          errors = resp.errors as unknown[];
        }
      } else {
        message = exception.message;
      }

      if (statusCode >= 500) {
        this.logger.error(
          `[${request.method}] ${request.url} - ${statusCode} ${message}`,
          exception instanceof Error ? exception.stack : undefined,
        );
      } else {
        const detail = errors?.length ? ` | ${JSON.stringify(errors)}` : '';
        this.logger.warn(
          `[${request.method}] ${request.url} - ${statusCode} ${message}${detail}`,
        );
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'common.internalServerError';

      this.logger.error(
        `[${request.method}] ${request.url} - 500 Unhandled exception`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponse = {
      success: false,
      statusCode,
      message: this.i18n.translateMessage(message) as string,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (errors !== undefined) {
      body.errors = errors.map((error) => this.i18n.translateMessage(error));
    }

    this.prisma.systemLog
      .create({
        data: {
          level: statusCode >= 500 ? 'ERROR' : 'WARN',
          message: typeof message === 'string' ? message : JSON.stringify(message),
          source: request.url,
          tenantId: (request.tenantId as string | undefined) ?? null,
          stackTrace:
            statusCode >= 500 && exception instanceof Error
              ? exception.stack
              : undefined,
        },
      })
      .catch(() => {});

    response.status(statusCode).json(body);
  }
}
