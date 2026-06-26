import { CheckInVolunteer } from './check-in-volunteer';
import { CheckOutVolunteer } from './check-out-volunteer';
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
import { TaskNotFoundError } from '../domain/task-errors';

const EM = '11111111-1111-4111-8111-111111111111';
const CREATOR = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function makeTask(): Task {
  return Task.create({
    id: TaskId.create(),
    emergencyId: EmergencyId.fromString(EM),
    title: 'Task',
    description: 'Desc',
    location: null,
    requiredSkill: null,
    createdByUserId: CREATOR,
  });
}

function makeVolunteer(userId: string): Volunteer {
  return Volunteer.register({
    id: VolunteerId.create(),
    emergencyId: EmergencyId.fromString(EM),
    userId,
    name: 'Volunteer',
    contact: 'v@example.com',
    municipality: 'Valencia',
    skills: [VolunteerSkill.General],
    availability: Availability.Immediate,
    vehicle: Vehicle.Car,
    consentAccepted: true,
  });
}

describe('CheckInVolunteer use case', () => {
  let taskRepo: InMemoryTaskRepository;
  let volunteerRepo: InMemoryVolunteerRepository;
  let checkIn: CheckInVolunteer;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository();
    volunteerRepo = new InMemoryVolunteerRepository();
    checkIn = new CheckInVolunteer(taskRepo, volunteerRepo);
  });

  it('volunteer checks in themselves (isCoordinator=false, userId matches)', async () => {
    const task = makeTask();
    const vol = makeVolunteer(USER_A);
    task.assign(vol.id.value);
    await taskRepo.save(task);
    await volunteerRepo.save(vol);

    const result = await checkIn.execute({
      taskId: task.id.value,
      volunteerId: vol.id.value,
      requesterUserId: USER_A,
      isCoordinator: false,
    });

    expect(result).toBeUndefined();
    const updated = await taskRepo.findById(task.id);
    expect(updated!.status).toBe(TaskStatus.InProgress);
  });

  it('coordinator checks in a volunteer (isCoordinator=true)', async () => {
    const task = makeTask();
    const vol = makeVolunteer(USER_A);
    task.assign(vol.id.value);
    await taskRepo.save(task);
    await volunteerRepo.save(vol);

    const result = await checkIn.execute({
      taskId: task.id.value,
      volunteerId: vol.id.value,
      requesterUserId: 'some-coordinator-user',
      isCoordinator: true,
    });

    expect(result).toBeUndefined();
    const updated = await taskRepo.findById(task.id);
    expect(updated!.status).toBe(TaskStatus.InProgress);
  });

  it('returns forbidden when requester is not the volunteer and not coordinator', async () => {
    const task = makeTask();
    const vol = makeVolunteer(USER_A);
    task.assign(vol.id.value);
    await taskRepo.save(task);
    await volunteerRepo.save(vol);

    const result = await checkIn.execute({
      taskId: task.id.value,
      volunteerId: vol.id.value,
      requesterUserId: USER_B,
      isCoordinator: false,
    });

    expect(result).toEqual({ forbidden: true });
    // Task should not have changed
    const updated = await taskRepo.findById(task.id);
    expect(updated!.status).toBe(TaskStatus.Open);
  });

  it('throws TaskNotFoundError for unknown task', async () => {
    await expect(
      checkIn.execute({
        taskId: '00000000-0000-4000-8000-000000000001',
        volunteerId: '00000000-0000-4000-8000-000000000002',
        requesterUserId: USER_A,
        isCoordinator: true,
      }),
    ).rejects.toThrow(TaskNotFoundError);
  });
});

describe('CheckOutVolunteer use case', () => {
  let taskRepo: InMemoryTaskRepository;
  let volunteerRepo: InMemoryVolunteerRepository;
  let checkOut: CheckOutVolunteer;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository();
    volunteerRepo = new InMemoryVolunteerRepository();
    checkOut = new CheckOutVolunteer(taskRepo, volunteerRepo);
  });

  it('volunteer checks out themselves', async () => {
    const task = makeTask();
    const vol = makeVolunteer(USER_A);
    task.assign(vol.id.value);
    task.checkIn(vol.id.value);
    await taskRepo.save(task);
    await volunteerRepo.save(vol);

    const result = await checkOut.execute({
      taskId: task.id.value,
      volunteerId: vol.id.value,
      requesterUserId: USER_A,
      isCoordinator: false,
    });

    expect(result).toBeUndefined();
    const updated = await taskRepo.findById(task.id);
    expect(updated!.assignments[0].checkedOutAt).toBeInstanceOf(Date);
  });

  it('returns forbidden when requester is not the volunteer and not coordinator', async () => {
    const task = makeTask();
    const vol = makeVolunteer(USER_A);
    task.assign(vol.id.value);
    task.checkIn(vol.id.value);
    await taskRepo.save(task);
    await volunteerRepo.save(vol);

    const result = await checkOut.execute({
      taskId: task.id.value,
      volunteerId: vol.id.value,
      requesterUserId: USER_B,
      isCoordinator: false,
    });

    expect(result).toEqual({ forbidden: true });
  });
});
