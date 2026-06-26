import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { BullMqEventBus } from './bullmq-event-bus';
import { ResourceRegistered } from '../domain/events/resource-registered';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';

interface DomainEventJobData {
  name: string;
  occurredOn: string;
  aggregateId: string;
  payload: Record<string, unknown>;
}

describe('BullMqEventBus (integration)', () => {
  it('enqueues a domain event that a worker receives', async () => {
    // BullMQ needs maxRetriesPerRequest:null; Queue and Worker take separate connections.
    const queueConn = new IORedis(redisUrl, { maxRetriesPerRequest: null });
    const workerConn = new IORedis(redisUrl, { maxRetriesPerRequest: null });
    const queue = new Queue('domain-events-test', { connection: queueConn });
    const bus = new BullMqEventBus(queue);
    const received: string[] = [];

    const worker = new Worker<DomainEventJobData>(
      'domain-events-test',
      (job: Job<DomainEventJobData>) => {
        received.push(job.data.name);
        return Promise.resolve();
      },
      { connection: workerConn },
    );
    await worker.waitUntilReady();

    await bus.publish([
      new ResourceRegistered('agg-1', {
        emergencyId: 'e',
        type: 't',
        side: 'origin',
        name: 'n',
      }),
    ]);

    await new Promise((r) => setTimeout(r, 300));
    expect(received).toContain('resource.registered');

    await worker.close();
    await queue.obliterate({ force: true });
    await queue.close();
    await queueConn.quit();
    await workerConn.quit();
  });
});
