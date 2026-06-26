import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ConsentNotAcceptedError,
  VolunteerNotFoundError,
} from '../../domain/volunteer-errors';
import { EmergencyNotAcceptingIntakeError } from '../../../emergencies/domain/emergency-not-accepting-intake.error';

type DomainError =
  | ConsentNotAcceptedError
  | VolunteerNotFoundError
  | EmergencyNotAcceptingIntakeError;

@Catch(
  ConsentNotAcceptedError,
  VolunteerNotFoundError,
  EmergencyNotAcceptingIntakeError,
)
export class VolunteerDomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode =
      exception instanceof VolunteerNotFoundError
        ? HttpStatus.NOT_FOUND
        : exception instanceof EmergencyNotAcceptingIntakeError
          ? HttpStatus.CONFLICT
          : HttpStatus.UNPROCESSABLE_ENTITY;
    response
      .status(statusCode)
      .json({ statusCode, message: exception.message });
  }
}
