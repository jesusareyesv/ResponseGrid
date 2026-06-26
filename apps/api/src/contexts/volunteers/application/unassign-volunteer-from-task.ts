import { TaskRepository } from '../domain/ports/task.repository';
import { TaskId } from '../domain/task-id';
import { TaskNotFoundError } from '../domain/task-errors';

export interface UnassignVolunteerFromTaskCommand {
  taskId: string;
  volunteerId: string;
}

export class UnassignVolunteerFromTask {
  constructor(private readonly taskRepo: TaskRepository) {}

  async execute(cmd: UnassignVolunteerFromTaskCommand): Promise<void> {
    const task = await this.taskRepo.findById(TaskId.fromString(cmd.taskId));
    if (!task) throw new TaskNotFoundError(cmd.taskId);

    task.unassign(cmd.volunteerId);
    await this.taskRepo.save(task);
  }
}
