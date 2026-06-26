import { AssignVolunteerToTask } from './assign-volunteer-to-task';
import { InMemoryTaskRepository } from './in-memory-task.repository';
import { InMemoryVolunteerRepository } from '../infrastructure/in-memory-volunteer.repository';
import { Task, TaskStatus } from '../domain/task';
import { TaskId } from '../domain/task-id';
import { EmergencyId } from '../../../shared/domain/emergency-id';
import { Volunteer } from '../domain/volunteer';
import { VolunteerId } from '../domain/volunteer-id';
import {
  Availability,
  Vehicle,
  VolunteerSkill,
} from '../domain/volunteer-enums';
import {
  TaskNotFoundError,
  TaskAlreadyAssignedError,
  TaskClosedError,
  VolunteerWrongEmergencyError,
} from '../domain/task-errors';
import { VolunteerNotFoundError } from '../domain/volunteer-errors';

const EM = '11111111-1111-4111-8111-111111111111';
const OTHER_EM = '22222222-2222-4222-8222-222222222222';
const CREATOR = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function makeTask(emergencyId: string = EM): Task {
  return Task.create({
    id: TaskId.create(),
    emergencyId: EmergencyId.fromString(emergencyId),
    title: 'Task',
    description: 'Desc',
    location: null,
    requiredSkill: null,
    createdByUserId: CREATOR,
  });
}

function makeVolunteer(emergencyId: string = EM): Volunteer {
  return Volunteer.register({
    id: VolunteerId.create(),
    emergencyId: EmergencyId.fromString(emergencyId),
    userId: 'user-' + Math.random(),
    name: 'Test Volunteer',
    contact: 'test@example.com',
    municipality: 'Valencia',
    skills: [VolunteerSkill.General],
    availability: Availability.Immediate,
    vehicle: Vehicle.Car,
    consentAccepted: true,
  });
}

describe('AssignVolunteerToTask use case', () => {
  let taskRepo: InMemoryTaskRepository;
  let volunteerRepo: InMemoryVolunteerRepository;
  let uc: AssignVolunteerToTask;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository();
    volunteerRepo = new InMemoryVolunteerRepository();
    uc = new AssignVolunteerToTask(taskRepo, volunteerRepo);
  });

  it('assigns a volunteer to a task', async () => {
    const task = makeTask();
    const vol = makeVolunteer();
    await taskRepo.save(task);
    await volunteerRepo.save(vol);

    await uc.execute({ taskId: task.id.value, volunteerId: vol.id.value });

    const updated = await taskRepo.findById(task.id);
    expect(updated!.assignments).toHaveLength(1);
    expect(updated!.assignments[0].volunteerId).toBe(vol.id.value);
  });

  it('throws TaskNotFoundError for unknown task', async () => {
    const vol = makeVolunteer();
    await volunteerRepo.save(vol);
    await expect(
      uc.execute({
        taskId: '00000000-0000-4000-8000-000000000001',
        volunteerId: vol.id.value,
      }),
    ).rejects.toThrow(TaskNotFoundError);
  });

  it('throws VolunteerNotFoundError for unknown volunteer', async () => {
    const task = makeTask();
    await taskRepo.save(task);
    await expect(
      uc.execute({
        taskId: task.id.value,
        volunteerId: '00000000-0000-4000-8000-000000000002',
      }),
    ).rejects.toThrow(VolunteerNotFoundError);
  });

  it('throws VolunteerWrongEmergencyError when volunteer belongs to different emergency', async () => {
    const task = makeTask(EM);
    const vol = makeVolunteer(OTHER_EM);
    await taskRepo.save(task);
    await volunteerRepo.save(vol);

    await expect(
      uc.execute({ taskId: task.id.value, volunteerId: vol.id.value }),
    ).rejects.toThrow(VolunteerWrongEmergencyError);
  });

  it('throws TaskAlreadyAssignedError on duplicate assignment', async () => {
    const task = makeTask();
    const vol = makeVolunteer();
    await taskRepo.save(task);
    await volunteerRepo.save(vol);

    await uc.execute({ taskId: task.id.value, volunteerId: vol.id.value });
    await expect(
      uc.execute({ taskId: task.id.value, volunteerId: vol.id.value }),
    ).rejects.toThrow(TaskAlreadyAssignedError);
  });

  it('throws TaskClosedError when assigning to a cancelled task', async () => {
    const task = makeTask();
    task.cancel();
    const vol = makeVolunteer();
    await taskRepo.save(task);
    await volunteerRepo.save(vol);

    await expect(
      uc.execute({ taskId: task.id.value, volunteerId: vol.id.value }),
    ).rejects.toThrow(TaskClosedError);
  });

  it('task status stays open after assignment (not in_progress yet)', async () => {
    const task = makeTask();
    const vol = makeVolunteer();
    await taskRepo.save(task);
    await volunteerRepo.save(vol);

    await uc.execute({ taskId: task.id.value, volunteerId: vol.id.value });

    const updated = await taskRepo.findById(task.id);
    expect(updated!.status).toBe(TaskStatus.Open);
  });
});
