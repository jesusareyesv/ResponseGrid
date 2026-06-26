import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  TaskNotFoundError,
  TaskAlreadyAssignedError,
  TaskNotAssignedError,
  TaskClosedError,
  TaskCheckInError,
  TaskCheckOutError,
  VolunteerWrongEmergencyError,
} from '../../domain/task-errors';
import { VolunteerNotFoundError } from '../../domain/volunteer-errors';

type DomainError =
  | TaskNotFoundError
  | TaskAlreadyAssignedError
  | TaskNotAssignedError
  | TaskClosedError
  | TaskCheckInError
  | TaskCheckOutError
  | VolunteerWrongEmergencyError
  | VolunteerNotFoundError;

@Catch(
  TaskNotFoundError,
  TaskAlreadyAssignedError,
  TaskNotAssignedError,
  TaskClosedError,
  TaskCheckInError,
  TaskCheckOutError,
  VolunteerWrongEmergencyError,
  VolunteerNotFoundError,
)
export class TaskDomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    let statusCode: number;

    if (
      exception instanceof TaskNotFoundError ||
      exception instanceof VolunteerNotFoundError
    ) {
      statusCode = HttpStatus.NOT_FOUND;
    } else if (
      exception instanceof TaskAlreadyAssignedError ||
      exception instanceof TaskClosedError ||
      exception instanceof TaskCheckInError ||
      exception instanceof TaskCheckOutError ||
      exception instanceof TaskNotAssignedError ||
      exception instanceof VolunteerWrongEmergencyError
    ) {
      statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response
      .status(statusCode)
      .json({ statusCode, message: exception.message });
  }
}
