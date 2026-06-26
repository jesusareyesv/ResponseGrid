import { TaskRepository } from '../domain/ports/task.repository';
import { TaskId } from '../domain/task-id';
import { TaskNotFoundError } from '../domain/task-errors';

export interface CompleteTaskCommand {
  taskId: string;
}

export class CompleteTask {
  constructor(private readonly taskRepo: TaskRepository) {}

  async execute(cmd: CompleteTaskCommand): Promise<void> {
    const task = await this.taskRepo.findById(TaskId.fromString(cmd.taskId));
    if (!task) throw new TaskNotFoundError(cmd.taskId);
    task.complete();
    await this.taskRepo.save(task);
  }
}
