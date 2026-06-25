import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Pool } from 'pg';
import { Db, createDb } from '../../../shared/db';
import { NeedsController } from './http/needs.controller';
import { CreateNeed } from '../application/create-need';
import { ValidateNeed } from '../application/validate-need';
import { GetPublicNeeds } from '../application/get-public-needs';
import { GetNeedsQueue } from '../application/get-needs-queue';
import { AssignNeedManager } from '../application/assign-need-manager';
import { NEED_REPOSITORY, NeedRepository } from '../domain/ports/need.repository';
import { EVENT_BUS, EventBus } from '../domain/ports/event-bus';
import { DrizzleNeedRepository } from './drizzle/drizzle-need.repository';
import { BullMqEventBus } from './bullmq-event-bus';
import { IdentityModule } from '../../identity/infrastructure/identity.module';

export const DB_POOL = Symbol('NeedsDbPool');
export const EVENT_QUEUE = Symbol('NeedsEventQueue');

interface DbPool {
  db: Db;
  pool: Pool;
}

interface EventQueue {
  queue: Queue;
  connection: IORedis;
}

const dbPoolProvider = {
  provide: DB_POOL,
  useFactory: (): DbPool => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');
    return createDb(url);
  },
};

const eventQueueProvider = {
  provide: EVENT_QUEUE,
  useFactory: (): EventQueue => {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL is required');
    const connection = new IORedis(url, { maxRetriesPerRequest: null });
    const queue = new Queue('domain-events', { connection });
    return { queue, connection };
  },
};

const needRepositoryProvider = {
  provide: NEED_REPOSITORY,
  inject: [DB_POOL],
  useFactory: (dbPool: DbPool): NeedRepository => new DrizzleNeedRepository(dbPool.db),
};

const eventBusProvider = {
  provide: EVENT_BUS,
  inject: [EVENT_QUEUE],
  useFactory: (eventQueue: EventQueue): EventBus => new BullMqEventBus(eventQueue.queue),
};

const createNeedProvider = {
  provide: CreateNeed,
  inject: [NEED_REPOSITORY, EVENT_BUS],
  useFactory: (repo: NeedRepository, bus: EventBus) => new CreateNeed(repo, bus),
};

const validateNeedProvider = {
  provide: ValidateNeed,
  inject: [NEED_REPOSITORY, EVENT_BUS],
  useFactory: (repo: NeedRepository, bus: EventBus) => new ValidateNeed(repo, bus),
};

const getPublicNeedsProvider = {
  provide: GetPublicNeeds,
  inject: [NEED_REPOSITORY],
  useFactory: (repo: NeedRepository) => new GetPublicNeeds(repo),
};

const getNeedsQueueProvider = {
  provide: GetNeedsQueue,
  inject: [NEED_REPOSITORY],
  useFactory: (repo: NeedRepository) => new GetNeedsQueue(repo),
};

const assignNeedManagerProvider = {
  provide: AssignNeedManager,
  inject: [NEED_REPOSITORY],
  useFactory: (repo: NeedRepository) => new AssignNeedManager(repo),
};

@Module({
  imports: [IdentityModule],
  controllers: [NeedsController],
  providers: [
    dbPoolProvider,
    eventQueueProvider,
    needRepositoryProvider,
    eventBusProvider,
    createNeedProvider,
    validateNeedProvider,
    getPublicNeedsProvider,
    getNeedsQueueProvider,
    assignNeedManagerProvider,
  ],
})
export class NeedsModule implements OnModuleDestroy {
  constructor(
    @Inject(DB_POOL) private readonly dbPool: DbPool,
    @Inject(EVENT_QUEUE) private readonly eventQueue: EventQueue,
  ) {}

  async onModuleDestroy(): Promise<void> {
    try {
      await this.eventQueue.queue.close();
    } catch (_) {
      // ignore — let remaining teardown proceed
    }
    try {
      await this.eventQueue.connection.quit();
    } catch (_) {
      // ignore
    }
    try {
      await this.dbPool.pool.end();
    } catch (_) {
      // ignore
    }
  }
}
