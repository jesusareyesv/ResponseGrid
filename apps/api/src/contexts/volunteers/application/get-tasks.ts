import { TaskRepository, TaskFilters } from '../domain/ports/task.repository';
import { VolunteerRepository } from '../domain/ports/volunteer.repository';
import { TaskSnapshot, TaskAssignmentSnapshot } from '../domain/task';
import { TaskStatus } from '../domain/task';

export interface GetTasksQuery {
  emergencyId: string;
  status?: TaskStatus;
}

export interface AssignmentView extends TaskAssignmentSnapshot {
  volunteerName?: string | undefined;
}

export interface TaskView extends Omit<TaskSnapshot, 'assignments'> {
  assignments: AssignmentView[];
}

export class GetTasks {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly volunteerRepo: VolunteerRepository,
  ) {}

  async execute(query: GetTasksQuery): Promise<TaskView[]> {
    const filters: TaskFilters = {};
    if (query.status !== undefined) filters.status = query.status;

    const tasks = await this.taskRepo.findByEmergency(
      query.emergencyId,
      filters,
    );

    // Collect all unique volunteer IDs across all tasks
    const volunteerIds = new Set<string>();
    for (const task of tasks) {
      for (const a of task.assignments) {
        volunteerIds.add(a.volunteerId);
      }
    }

    // Load volunteer names in one pass using findByEmergency (all volunteers)
    const volunteerNameMap = new Map<string, string>();
    if (volunteerIds.size > 0) {
      const volunteers = await this.volunteerRepo.findByEmergency(
        query.emergencyId,
      );
      for (const v of volunteers) {
        volunteerNameMap.set(v.id.value, v.name);
      }
    }

    return tasks.map((task) => {
      const snap = task.toSnapshot();
      return {
        ...snap,
        assignments: snap.assignments.map((a) => ({
          ...a,
          volunteerName: volunteerNameMap.get(a.volunteerId),
        })),
      };
    });
  }
}
