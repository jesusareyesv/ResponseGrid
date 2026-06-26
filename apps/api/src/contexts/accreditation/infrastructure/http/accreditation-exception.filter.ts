import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AccreditationNotFoundError } from '../../application/revoke-accreditation';

@Catch(AccreditationNotFoundError)
export class AccreditationExceptionFilter implements ExceptionFilter {
  catch(exception: AccreditationNotFoundError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      message: exception.message,
    });
  }
}
