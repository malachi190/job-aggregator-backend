import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorLoggerService } from '../logging/error-logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: ErrorLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttpException
      ? this.extractMessage(exception)
      : 'Internal server error';

    if (!isHttpException) {
      // Unexpected errors are logged with full detail server-side,
      // but never leaked to the client as-is.
      this.logger.log(exception, {
        context: HttpExceptionFilter.name,
        method: request.method,
        path: request.originalUrl,
        status,
      });
    }

    response.status(status).json({
      status: false,
      message,
    });
  }

  private extractMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') return response;
    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const message = response.message;
      if (Array.isArray(message)) return String(message[0]);
      return String(message);
    }
    return exception.message;
  }
}
