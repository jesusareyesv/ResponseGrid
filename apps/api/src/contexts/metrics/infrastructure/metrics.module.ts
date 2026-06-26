import { Module } from '@nestjs/common';
import { DB, DatabaseModule } from '../../../shared/database.module';
import { Db } from '../../../shared/db';
import { MetricsController } from './http/metrics.controller';
import { GetEmergencyMetrics } from '../application/get-emergency-metrics';
import {
  NEED_REPOSITORY,
  NeedRepository,
} from '../../needs/domain/ports/need.repository';
import {
  RESOURCE_REPOSITORY,
  ResourceRepository,
} from '../../resources/domain/ports/resource.repository';
import { DrizzleNeedRepository } from '../../needs/infrastructure/drizzle/drizzle-need.repository';
import { DrizzleResourceRepository } from '../../resources/infrastructure/drizzle/drizzle-resource.repository';

const needRepositoryProvider = {
  provide: NEED_REPOSITORY,
  inject: [DB],
  useFactory: (db: Db): NeedRepository => new DrizzleNeedRepository(db),
};

const resourceRepositoryProvider = {
  provide: RESOURCE_REPOSITORY,
  inject: [DB],
  useFactory: (db: Db): ResourceRepository => new DrizzleResourceRepository(db),
};

const getEmergencyMetricsProvider = {
  provide: GetEmergencyMetrics,
  inject: [NEED_REPOSITORY, RESOURCE_REPOSITORY],
  useFactory: (needRepo: NeedRepository, resourceRepo: ResourceRepository) =>
    new GetEmergencyMetrics(needRepo, resourceRepo),
};

@Module({
  imports: [DatabaseModule],
  controllers: [MetricsController],
  providers: [
    needRepositoryProvider,
    resourceRepositoryProvider,
    getEmergencyMetricsProvider,
  ],
})
export class MetricsModule {}
