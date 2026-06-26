import { TaskRepository, TaskFilters } from '../domain/ports/task.repository';
import { Task } from '../domain/task';
import { TaskId } from '../domain/task-id';

export class InMemoryTaskRepository implements TaskRepository {
  private store = new Map<string, ReturnType<Task['toSnapshot']>>();

  save(task: Task): Promise<void> {
    this.store.set(task.id.value, task.toSnapshot());
    return Promise.resolve();
  }

  findById(id: TaskId): Promise<Task | null> {
    const snap = this.store.get(id.value);
    return Promise.resolve(snap ? Task.fromSnapshot(snap) : null);
  }

  findByEmergency(emergencyId: string, filters?: TaskFilters): Promise<Task[]> {
    let results = [...this.store.values()].filter(
      (s) => s.emergencyId === emergencyId,
    );
    if (filters?.status !== undefined) {
      results = results.filter((s) => s.status === filters.status);
    }
    return Promise.resolve(results.map((s) => Task.fromSnapshot(s)));
  }

  findByVolunteer(volunteerId: string, emergencyId: string): Promise<Task[]> {
    const results = [...this.store.values()].filter(
      (s) =>
        s.emergencyId === emergencyId &&
        s.assignments.some((a) => a.volunteerId === volunteerId),
    );
    return Promise.resolve(results.map((s) => Task.fromSnapshot(s)));
  }
}
