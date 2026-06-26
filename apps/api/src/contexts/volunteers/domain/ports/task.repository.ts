import { Task } from '../task';
import { TaskId } from '../task-id';
import { TaskStatus } from '../task';

export const TASK_REPOSITORY = Symbol('TaskRepository');

export interface TaskFilters {
  status?: TaskStatus;
}

export interface TaskRepository {
  save(task: Task): Promise<void>;
  findById(id: TaskId): Promise<Task | null>;
  findByEmergency(emergencyId: string, filters?: TaskFilters): Promise<Task[]>;
  findByVolunteer(volunteerId: string, emergencyId: string): Promise<Task[]>;
}
