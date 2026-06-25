import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { ResourcesController } from './http/resources.controller';
import { CoordinationController } from './http/coordination.controller';
import { RegisterResource } from '../application/register-resource';
import { GetCoordinationQueue } from '../application/get-coordination-queue';
import { VerifyResource } from '../application/verify-resource';
import { PublishResource } from '../application/publish-resource';
import { RESOURCE_REPOSITORY } from '../domain/ports/resource.repository';
import { EVENT_BUS } from '../domain/ports/event-bus';
import { DrizzleResourceRepository } from './drizzle/drizzle-resource.repository';
import { BullMqEventBus } from './bullmq-event-bus';
import { createDb } from '../../../shared/db';

const dbProvider = {
  provide: RESOURCE_REPOSITORY,
  useFactory: () => {
    const { db } = createDb(process.env.DATABASE_URL ?? '');
    return new DrizzleResourceRepository(db);
  },
};

const busProvider = {
  provide: EVENT_BUS,
  useFactory: () => {
    const connection = new IORedis(process.env.REDIS_URL ?? '', { maxRetriesPerRequest: null });
    return new BullMqEventBus(new Queue('domain-events', { connection }));
  },
};

const registerProvider = {
  provide: RegisterResource,
  inject: [RESOURCE_REPOSITORY, EVENT_BUS],
  useFactory: (repo: DrizzleResourceRepository, bus: BullMqEventBus) => new RegisterResource(repo, bus),
};
const queueProvider = {
  provide: GetCoordinationQueue,
  inject: [RESOURCE_REPOSITORY],
  useFactory: (repo: DrizzleResourceRepository) => new GetCoordinationQueue(repo),
};
const verifyProvider = {
  provide: VerifyResource,
  inject: [RESOURCE_REPOSITORY, EVENT_BUS],
  useFactory: (repo: DrizzleResourceRepository, bus: BullMqEventBus) => new VerifyResource(repo, bus),
};
const publishProvider = {
  provide: PublishResource,
  inject: [RESOURCE_REPOSITORY, EVENT_BUS],
  useFactory: (repo: DrizzleResourceRepository, bus: BullMqEventBus) => new PublishResource(repo, bus),
};

@Module({
  controllers: [ResourcesController, CoordinationController],
  providers: [dbProvider, busProvider, registerProvider, queueProvider, verifyProvider, publishProvider],
})
export class ResourcesModule {}
