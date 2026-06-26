import { TaskRepository } from '../domain/ports/task.repository';
import { TaskSnapshot, AssignmentStatus } from '../domain/task';

export interface GetMyTasksQuery {
  emergencyId: string;
  volunteerId: string;
}

export interface MyTaskView extends TaskSnapshot {
  myAssignmentStatus: AssignmentStatus;
}

export class GetMyTasks {
  constructor(private readonly taskRepo: TaskRepository) {}

  async execute(query: GetMyTasksQuery): Promise<MyTaskView[]> {
    const tasks = await this.taskRepo.findByVolunteer(
      query.volunteerId,
      query.emergencyId,
    );

    return tasks.map((task) => {
      const snap = task.toSnapshot();
      const myAssignment = snap.assignments.find(
        (a) => a.volunteerId === query.volunteerId,
      );
      return {
        ...snap,
        myAssignmentStatus: myAssignment!.status,
      };
    });
  }
}
