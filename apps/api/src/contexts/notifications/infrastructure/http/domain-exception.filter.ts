import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  NotificationNotFoundError,
  NotificationForbiddenError,
} from '../../application/mark-notification-read';

type DomainError = NotificationNotFoundError | NotificationForbiddenError;

@Catch(NotificationNotFoundError, NotificationForbiddenError)
export class NotificationDomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode =
      exception instanceof NotificationNotFoundError
        ? HttpStatus.NOT_FOUND
        : HttpStatus.FORBIDDEN;
    response
      .status(statusCode)
      .json({ statusCode, message: exception.message });
  }
}
