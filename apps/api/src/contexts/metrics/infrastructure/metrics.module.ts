import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { Db, createDb } from '../../../shared/db';
import { MetricsController } from './http/metrics.controller';
import { GetEmergencyMetrics } from '../application/get-emergency-metrics';
import { NEED_REPOSITORY, NeedRepository } from '../../needs/domain/ports/need.repository';
import { RESOURCE_REPOSITORY, ResourceRepository } from '../../resources/domain/ports/resource.repository';
import { DrizzleNeedRepository } from '../../needs/infrastructure/drizzle/drizzle-need.repository';
import { DrizzleResourceRepository } from '../../resources/infrastructure/drizzle/drizzle-resource.repository';

export const METRICS_DB_POOL = Symbol('MetricsDbPool');

interface DbPool {
  db: Db;
  pool: Pool;
}

const dbPoolProvider = {
  provide: METRICS_DB_POOL,
  useFactory: (): DbPool => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');
    return createDb(url);
  },
};

const needRepositoryProvider = {
  provide: NEED_REPOSITORY,
  inject: [METRICS_DB_POOL],
  useFactory: (dbPool: DbPool): NeedRepository => new DrizzleNeedRepository(dbPool.db),
};

const resourceRepositoryProvider = {
  provide: RESOURCE_REPOSITORY,
  inject: [METRICS_DB_POOL],
  useFactory: (dbPool: DbPool): ResourceRepository => new DrizzleResourceRepository(dbPool.db),
};

const getEmergencyMetricsProvider = {
  provide: GetEmergencyMetrics,
  inject: [NEED_REPOSITORY, RESOURCE_REPOSITORY],
  useFactory: (needRepo: NeedRepository, resourceRepo: ResourceRepository) =>
    new GetEmergencyMetrics(needRepo, resourceRepo),
};

@Module({
  controllers: [MetricsController],
  providers: [
    dbPoolProvider,
    needRepositoryProvider,
    resourceRepositoryProvider,
    getEmergencyMetricsProvider,
  ],
})
export class MetricsModule implements OnModuleDestroy {
  constructor(@Inject(METRICS_DB_POOL) private readonly dbPool: DbPool) {}

  async onModuleDestroy(): Promise<void> {
    try {
      await this.dbPool.pool.end();
    } catch (_) {
      // ignore
    }
  }
}
