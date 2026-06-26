import { TaskRepository } from '../domain/ports/task.repository';
import { VolunteerRepository } from '../domain/ports/volunteer.repository';
import { TaskId } from '../domain/task-id';
import { VolunteerId } from '../domain/volunteer-id';
import {
  TaskNotFoundError,
  VolunteerWrongEmergencyError,
} from '../domain/task-errors';
import { VolunteerNotFoundError } from '../domain/volunteer-errors';

export interface AssignVolunteerToTaskCommand {
  taskId: string;
  volunteerId: string;
}

export class AssignVolunteerToTask {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly volunteerRepo: VolunteerRepository,
  ) {}

  async execute(cmd: AssignVolunteerToTaskCommand): Promise<void> {
    const task = await this.taskRepo.findById(TaskId.fromString(cmd.taskId));
    if (!task) throw new TaskNotFoundError(cmd.taskId);

    const volunteer = await this.volunteerRepo.findById(
      VolunteerId.fromString(cmd.volunteerId),
    );
    if (!volunteer) throw new VolunteerNotFoundError(cmd.volunteerId);

    // Volunteer must belong to the same emergency as the task
    if (volunteer.emergencyId.value !== task.emergencyId.value) {
      throw new VolunteerWrongEmergencyError(cmd.volunteerId);
    }

    task.assign(cmd.volunteerId);
    await this.taskRepo.save(task);
  }
}
