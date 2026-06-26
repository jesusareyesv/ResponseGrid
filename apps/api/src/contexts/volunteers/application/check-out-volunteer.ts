import { TaskRepository } from '../domain/ports/task.repository';
import { VolunteerRepository } from '../domain/ports/volunteer.repository';
import { TaskId } from '../domain/task-id';
import { VolunteerId } from '../domain/volunteer-id';
import { TaskNotFoundError } from '../domain/task-errors';
import { VolunteerNotFoundError } from '../domain/volunteer-errors';

export interface CheckOutVolunteerCommand {
  taskId: string;
  volunteerId: string;
  /** The userId of the person making the request (used for self-check authorization). */
  requesterUserId: string;
  /** Set to true when the caller has already verified coordinator role (via guard). */
  isCoordinator: boolean;
}

export class CheckOutVolunteer {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly volunteerRepo: VolunteerRepository,
  ) {}

  async execute(
    cmd: CheckOutVolunteerCommand,
  ): Promise<{ forbidden: boolean } | void> {
    const task = await this.taskRepo.findById(TaskId.fromString(cmd.taskId));
    if (!task) throw new TaskNotFoundError(cmd.taskId);

    // Authorization: coordinator OR the volunteer themselves (userId match)
    if (!cmd.isCoordinator) {
      const volunteer = await this.volunteerRepo.findById(
        VolunteerId.fromString(cmd.volunteerId),
      );
      if (!volunteer) throw new VolunteerNotFoundError(cmd.volunteerId);
      if (volunteer.userId !== cmd.requesterUserId) {
        return { forbidden: true };
      }
    }

    task.checkOut(cmd.volunteerId);
    await this.taskRepo.save(task);
  }
}
