import { TaskRepository } from '../domain/ports/task.repository';
import { TaskId } from '../domain/task-id';
import { TaskNotFoundError } from '../domain/task-errors';

export interface CancelTaskCommand {
  taskId: string;
}

export class CancelTask {
  constructor(private readonly taskRepo: TaskRepository) {}

  async execute(cmd: CancelTaskCommand): Promise<void> {
    const task = await this.taskRepo.findById(TaskId.fromString(cmd.taskId));
    if (!task) throw new TaskNotFoundError(cmd.taskId);
    task.cancel();
    await this.taskRepo.save(task);
  }
}
