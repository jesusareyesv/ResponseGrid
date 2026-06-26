import { createDb, Db } from '../../../../shared/db';
import { tasksTable, taskAssignmentsTable } from './task-schema';
import { DrizzleTaskRepository } from './drizzle-task.repository';
import { Task, TaskStatus, AssignmentStatus } from '../../domain/task';
import { TaskId } from '../../domain/task-id';
import { EmergencyId } from '../../../../shared/domain/emergency-id';
import type { Pool } from 'pg';

const EM = '33333333-3333-4333-8333-333333333333';
const VOL_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VOL_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CREATOR = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const URL =
  process.env.DATABASE_URL ??
  'postgres://reliefhub:reliefhub@localhost:5433/reliefhub';

function makeTask(overrides?: { emergencyId?: string }): Task {
  return Task.create({
    id: TaskId.create(),
    emergencyId: EmergencyId.fromString(overrides?.emergencyId ?? EM),
    title: 'Integration Task',
    description: 'Test task for integration spec',
    location: null,
    requiredSkill: null,
    createdByUserId: CREATOR,
  });
}

describe('DrizzleTaskRepository (integration)', () => {
  let db: Db;
  let pool: Pool;
  let repo: DrizzleTaskRepository;

  beforeAll(() => {
    ({ db, pool } = createDb(URL));
    repo = new DrizzleTaskRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.delete(taskAssignmentsTable);
    await db.delete(tasksTable);
  });

  it('round-trips a task with no assignments', async () => {
    const task = makeTask();
    await repo.save(task);

    const found = await repo.findById(task.id);
    expect(found).not.toBeNull();
    expect(found!.id.value).toBe(task.id.value);
    expect(found!.emergencyId.value).toBe(EM);
    expect(found!.title).toBe('Integration Task');
    expect(found!.status).toBe(TaskStatus.Open);
    expect(found!.assignments).toHaveLength(0);
  });

  it('round-trips a task with assignments and timestamps', async () => {
    const task = makeTask();
    task.assign(VOL_A);
    task.checkIn(VOL_A);
    await repo.save(task);

    const found = await repo.findById(task.id);
    expect(found!.status).toBe(TaskStatus.InProgress);
    expect(found!.assignments).toHaveLength(1);
    const assignment = found!.assignments[0];
    expect(assignment.volunteerId).toBe(VOL_A);
    expect(assignment.status).toBe(AssignmentStatus.CheckedIn);
    expect(assignment.checkedInAt).toBeInstanceOf(Date);
    expect(assignment.checkedOutAt).toBeNull();
  });

  it('upserts task status on second save', async () => {
    const task = makeTask();
    await repo.save(task);
    task.assign(VOL_A);
    task.checkIn(VOL_A);
    await repo.save(task);
    task.complete();
    await repo.save(task);

    const found = await repo.findById(task.id);
    expect(found!.status).toBe(TaskStatus.Completed);
  });

  it('replaces assignments on each save (no duplicates)', async () => {
    const task = makeTask();
    task.assign(VOL_A);
    await repo.save(task);
    task.assign(VOL_B);
    await repo.save(task);

    const found = await repo.findById(task.id);
    expect(found!.assignments).toHaveLength(2);
  });

  it('findByEmergency returns all tasks for emergency', async () => {
    await repo.save(makeTask());
    await repo.save(makeTask());
    const tasks = await repo.findByEmergency(EM);
    expect(tasks).toHaveLength(2);
  });

  it('findByEmergency filters by status', async () => {
    const t1 = makeTask();
    const t2 = makeTask();
    t2.cancel();
    await repo.save(t1);
    await repo.save(t2);

    const open = await repo.findByEmergency(EM, { status: TaskStatus.Open });
    expect(open).toHaveLength(1);
    expect(open[0].status).toBe(TaskStatus.Open);
  });

  it('findByVolunteer returns tasks where volunteer is assigned', async () => {
    const t1 = makeTask();
    const t2 = makeTask();
    t1.assign(VOL_A);
    t2.assign(VOL_B);
    await repo.save(t1);
    await repo.save(t2);

    const results = await repo.findByVolunteer(VOL_A, EM);
    expect(results).toHaveLength(1);
    expect(results[0].assignments[0].volunteerId).toBe(VOL_A);
  });

  it('findByVolunteer returns empty when volunteer not assigned', async () => {
    const t = makeTask();
    await repo.save(t);
    const results = await repo.findByVolunteer(VOL_A, EM);
    expect(results).toHaveLength(0);
  });

  it('checkout timestamp is persisted', async () => {
    const task = makeTask();
    task.assign(VOL_A);
    task.checkIn(VOL_A);
    task.checkOut(VOL_A);
    await repo.save(task);

    const found = await repo.findById(task.id);
    const a = found!.assignments[0];
    expect(a.status).toBe(AssignmentStatus.CheckedOut);
    expect(a.checkedInAt).toBeInstanceOf(Date);
    expect(a.checkedOutAt).toBeInstanceOf(Date);
  });
});
