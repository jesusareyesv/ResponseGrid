import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { NeedNotFoundError } from '../../application/need-not-found.error';
import { NeedNotPendingError } from '../../domain/need-errors';

type DomainError = NeedNotFoundError | NeedNotPendingError;

// Only catches domain errors from the needs context; everything else falls through
// to Nest's default handler.
@Catch(NeedNotFoundError, NeedNotPendingError)
export class NeedsDomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode =
      exception instanceof NeedNotFoundError
        ? HttpStatus.NOT_FOUND
        : HttpStatus.CONFLICT;
    response
      .status(statusCode)
      .json({ statusCode, message: exception.message });
  }
}
