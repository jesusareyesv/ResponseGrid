export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Task '${taskId}' not found`);
    this.name = 'TaskNotFoundError';
  }
}

export class TaskAlreadyAssignedError extends Error {
  constructor(volunteerId: string) {
    super(`Volunteer '${volunteerId}' is already assigned to this task`);
    this.name = 'TaskAlreadyAssignedError';
  }
}

export class TaskNotAssignedError extends Error {
  constructor(volunteerId: string) {
    super(`Volunteer '${volunteerId}' is not assigned to this task`);
    this.name = 'TaskNotAssignedError';
  }
}

export class TaskClosedError extends Error {
  constructor(status: string) {
    super(`Cannot modify task in status '${status}'`);
    this.name = 'TaskClosedError';
  }
}

export class TaskCheckInError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'TaskCheckInError';
  }
}

export class TaskCheckOutError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'TaskCheckOutError';
  }
}

export class VolunteerWrongEmergencyError extends Error {
  constructor(volunteerId: string) {
    super(
      `Volunteer '${volunteerId}' does not belong to this task's emergency`,
    );
    this.name = 'VolunteerWrongEmergencyError';
  }
}
