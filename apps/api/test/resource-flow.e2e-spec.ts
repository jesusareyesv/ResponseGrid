import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createDb } from '../src/shared/db';
import { resourcesTable } from '../src/contexts/resources/infrastructure/drizzle/schema';

const EM = '11111111-1111-4111-8111-111111111111';

describe('Resource flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const { db, pool } = createDb(process.env.DATABASE_URL ?? 'postgres://reliefhub:reliefhub@localhost:5433/reliefhub');
    await db.delete(resourcesTable);
    await pool.end();
  });
  afterAll(async () => { await app.close(); });

  it('registers → appears in queue → verifies → publishes', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post(`/emergencies/${EM}/resources`)
      .send({ type: 'warehouse', side: 'origin', name: 'Almacén E2E' })
      .expect(201);
    const id = created.body.id;

    const queue = await request(server).get(`/emergencies/${EM}/coordination/queue`).expect(200);
    expect(queue.body).toEqual([expect.objectContaining({ id, verificationLevel: 'unverified', publicStatus: 'hidden' })]);

    await request(server).post(`/resources/${id}/verify`).send({ level: 'verified' }).expect(204);
    await request(server).post(`/resources/${id}/publish`).expect(204);

    const afterPublish = await request(server).get(`/emergencies/${EM}/coordination/queue`).expect(200);
    expect(afterPublish.body).toEqual([]); // no longer pending
  });
});
