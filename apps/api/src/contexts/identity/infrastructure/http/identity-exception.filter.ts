import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { InvalidCredentialsError } from '../../domain/invalid-credentials.error';
import { EmailAlreadyRegisteredError } from '../../domain/email-already-registered.error';

@Catch(InvalidCredentialsError, EmailAlreadyRegisteredError)
export class IdentityExceptionFilter implements ExceptionFilter {
  catch(
    exception: InvalidCredentialsError | EmailAlreadyRegisteredError,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof EmailAlreadyRegisteredError
        ? HttpStatus.CONFLICT
        : HttpStatus.UNAUTHORIZED;
    response
      .status(status)
      .json({ statusCode: status, message: exception.message });
  }
}
