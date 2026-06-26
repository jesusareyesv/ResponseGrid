import { Module } from '@nestjs/common';
import { DB, DatabaseModule } from '../../../shared/database.module';
import { Db } from '../../../shared/db';
import { EmergenciesController } from './http/emergencies.controller';
import { CreateEmergency } from '../application/create-emergency';
import { ListActiveEmergencies } from '../application/list-active-emergencies';
import { GetEmergencyBySlug } from '../application/get-emergency-by-slug';
import { EMERGENCY_REPOSITORY, EmergencyRepository } from '../domain/ports/emergency.repository';
import { DrizzleEmergencyRepository } from './drizzle/drizzle-emergency.repository';
import { IdentityModule } from '../../identity/infrastructure/identity.module';

const emergencyRepositoryProvider = {
  provide: EMERGENCY_REPOSITORY,
  inject: [DB],
  useFactory: (db: Db): EmergencyRepository => new DrizzleEmergencyRepository(db),
};

const createEmergencyProvider = {
  provide: CreateEmergency,
  inject: [EMERGENCY_REPOSITORY],
  useFactory: (repo: EmergencyRepository) => new CreateEmergency(repo),
};

const listActiveProvider = {
  provide: ListActiveEmergencies,
  inject: [EMERGENCY_REPOSITORY],
  useFactory: (repo: EmergencyRepository) => new ListActiveEmergencies(repo),
};

const getBySlugProvider = {
  provide: GetEmergencyBySlug,
  inject: [EMERGENCY_REPOSITORY],
  useFactory: (repo: EmergencyRepository) => new GetEmergencyBySlug(repo),
};

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [EmergenciesController],
  providers: [
    emergencyRepositoryProvider,
    createEmergencyProvider,
    listActiveProvider,
    getBySlugProvider,
  ],
})
export class EmergenciesModule {}
