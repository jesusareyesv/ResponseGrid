import { Module } from '@nestjs/common';
import { DB, DatabaseModule } from '../../../shared/database.module';
import { Db } from '../../../shared/db';
import { VolunteersController } from './http/volunteers.controller';
import { TasksController } from './http/tasks.controller';
import { RegisterVolunteer } from '../application/register-volunteer';
import { GetVolunteerRoster } from '../application/get-volunteer-roster';
import { UpdateVolunteerStatus } from '../application/update-volunteer-status';
import { GetMyVolunteerProfile } from '../application/get-my-volunteer-profile';
import { CreateTask } from '../application/create-task';
import { GetTasks } from '../application/get-tasks';
import { AssignVolunteerToTask } from '../application/assign-volunteer-to-task';
import { UnassignVolunteerFromTask } from '../application/unassign-volunteer-from-task';
import { CheckInVolunteer } from '../application/check-in-volunteer';
import { CheckOutVolunteer } from '../application/check-out-volunteer';
import { CompleteTask } from '../application/complete-task';
import { CancelTask } from '../application/cancel-task';
import { GetMyTasks } from '../application/get-my-tasks';
import {
  VOLUNTEER_REPOSITORY,
  VolunteerRepository,
} from '../domain/ports/volunteer.repository';
import {
  TASK_REPOSITORY,
  TaskRepository,
} from '../domain/ports/task.repository';
import {
  VOLUNTEER_EMERGENCY_STATUS_READER,
  VolunteerEmergencyStatusReader,
} from '../domain/ports/emergency-status-reader';
import { DrizzleVolunteerRepository } from './drizzle/drizzle-volunteer.repository';
import { DrizzleTaskRepository } from './drizzle/drizzle-task.repository';
import { DrizzleEmergencyStatusReader } from '../../../shared/drizzle-emergency-status-reader';
import { IdentityModule } from '../../identity/infrastructure/identity.module';

// ── Volunteer providers ──────────────────────────────────────────────────────

const volunteerRepositoryProvider = {
  provide: VOLUNTEER_REPOSITORY,
  inject: [DB],
  useFactory: (db: Db): VolunteerRepository =>
    new DrizzleVolunteerRepository(db),
};

const emergencyStatusReaderProvider = {
  provide: VOLUNTEER_EMERGENCY_STATUS_READER,
  inject: [DB],
  useFactory: (db: Db): VolunteerEmergencyStatusReader =>
    new DrizzleEmergencyStatusReader(db),
};

const registerVolunteerProvider = {
  provide: RegisterVolunteer,
  inject: [VOLUNTEER_REPOSITORY, VOLUNTEER_EMERGENCY_STATUS_READER],
  useFactory: (
    repo: VolunteerRepository,
    statusReader: VolunteerEmergencyStatusReader,
  ) => new RegisterVolunteer(repo, statusReader),
};

const getRosterProvider = {
  provide: GetVolunteerRoster,
  inject: [VOLUNTEER_REPOSITORY],
  useFactory: (repo: VolunteerRepository) => new GetVolunteerRoster(repo),
};

const updateStatusProvider = {
  provide: UpdateVolunteerStatus,
  inject: [VOLUNTEER_REPOSITORY],
  useFactory: (repo: VolunteerRepository) => new UpdateVolunteerStatus(repo),
};

const getMyProfileProvider = {
  provide: GetMyVolunteerProfile,
  inject: [VOLUNTEER_REPOSITORY],
  useFactory: (repo: VolunteerRepository) => new GetMyVolunteerProfile(repo),
};

// ── Task providers ───────────────────────────────────────────────────────────

const taskRepositoryProvider = {
  provide: TASK_REPOSITORY,
  inject: [DB],
  useFactory: (db: Db): TaskRepository => new DrizzleTaskRepository(db),
};

const createTaskProvider = {
  provide: CreateTask,
  inject: [TASK_REPOSITORY],
  useFactory: (repo: TaskRepository) => new CreateTask(repo),
};

const getTasksProvider = {
  provide: GetTasks,
  inject: [TASK_REPOSITORY, VOLUNTEER_REPOSITORY],
  useFactory: (taskRepo: TaskRepository, volunteerRepo: VolunteerRepository) =>
    new GetTasks(taskRepo, volunteerRepo),
};

const assignVolunteerToTaskProvider = {
  provide: AssignVolunteerToTask,
  inject: [TASK_REPOSITORY, VOLUNTEER_REPOSITORY],
  useFactory: (taskRepo: TaskRepository, volunteerRepo: VolunteerRepository) =>
    new AssignVolunteerToTask(taskRepo, volunteerRepo),
};

const unassignVolunteerFromTaskProvider = {
  provide: UnassignVolunteerFromTask,
  inject: [TASK_REPOSITORY],
  useFactory: (repo: TaskRepository) => new UnassignVolunteerFromTask(repo),
};

const checkInVolunteerProvider = {
  provide: CheckInVolunteer,
  inject: [TASK_REPOSITORY, VOLUNTEER_REPOSITORY],
  useFactory: (taskRepo: TaskRepository, volunteerRepo: VolunteerRepository) =>
    new CheckInVolunteer(taskRepo, volunteerRepo),
};

const checkOutVolunteerProvider = {
  provide: CheckOutVolunteer,
  inject: [TASK_REPOSITORY, VOLUNTEER_REPOSITORY],
  useFactory: (taskRepo: TaskRepository, volunteerRepo: VolunteerRepository) =>
    new CheckOutVolunteer(taskRepo, volunteerRepo),
};

const completeTaskProvider = {
  provide: CompleteTask,
  inject: [TASK_REPOSITORY],
  useFactory: (repo: TaskRepository) => new CompleteTask(repo),
};

const cancelTaskProvider = {
  provide: CancelTask,
  inject: [TASK_REPOSITORY],
  useFactory: (repo: TaskRepository) => new CancelTask(repo),
};

const getMyTasksProvider = {
  provide: GetMyTasks,
  inject: [TASK_REPOSITORY],
  useFactory: (repo: TaskRepository) => new GetMyTasks(repo),
};

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [VolunteersController, TasksController],
  providers: [
    // Volunteer
    volunteerRepositoryProvider,
    emergencyStatusReaderProvider,
    registerVolunteerProvider,
    getRosterProvider,
    updateStatusProvider,
    getMyProfileProvider,
    // Task
    taskRepositoryProvider,
    createTaskProvider,
    getTasksProvider,
    assignVolunteerToTaskProvider,
    unassignVolunteerFromTaskProvider,
    checkInVolunteerProvider,
    checkOutVolunteerProvider,
    completeTaskProvider,
    cancelTaskProvider,
    getMyTasksProvider,
  ],
})
export class VolunteersModule {}
