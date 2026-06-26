import { Module } from '@nestjs/common';
import { DB, DatabaseModule } from '../../../shared/database.module';
import { Db } from '../../../shared/db';
import { VolunteersController } from './http/volunteers.controller';
import { RegisterVolunteer } from '../application/register-volunteer';
import { GetVolunteerRoster } from '../application/get-volunteer-roster';
import { UpdateVolunteerStatus } from '../application/update-volunteer-status';
import { GetMyVolunteerProfile } from '../application/get-my-volunteer-profile';
import {
  VOLUNTEER_REPOSITORY,
  VolunteerRepository,
} from '../domain/ports/volunteer.repository';
import {
  VOLUNTEER_EMERGENCY_STATUS_READER,
  VolunteerEmergencyStatusReader,
} from '../domain/ports/emergency-status-reader';
import { DrizzleVolunteerRepository } from './drizzle/drizzle-volunteer.repository';
import { DrizzleEmergencyStatusReader } from '../../../shared/drizzle-emergency-status-reader';
import { IdentityModule } from '../../identity/infrastructure/identity.module';

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

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [VolunteersController],
  providers: [
    volunteerRepositoryProvider,
    emergencyStatusReaderProvider,
    registerVolunteerProvider,
    getRosterProvider,
    updateStatusProvider,
    getMyProfileProvider,
  ],
})
export class VolunteersModule {}
