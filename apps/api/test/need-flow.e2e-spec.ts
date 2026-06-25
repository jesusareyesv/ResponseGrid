import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/contexts/resources/infrastructure/http/domain-exception.filter';
import { NeedsDomainExceptionFilter } from '../src/contexts/needs/infrastructure/http/domain-exception.filter';
import { createDb } from '../src/shared/db';
import { needsTable } from '../src/contexts/needs/infrastructure/drizzle/schema';
import { usersTable, membershipsTable } from '../src/contexts/identity/infrastructure/drizzle/schema';
import * as bcrypt from 'bcryptjs';

const EM = '33333333-3333-4333-8333-333333333333';
// Use IDs that won't clash with other e2e specs
const COORD_ID = 'ff000000-0000-4000-8000-000000000006';
const MEMBERSHIP_ID = 'ff100000-0000-4000-8000-000000000007';

describe('Need flow (e2e)', () => {
  let app: INestApplication;
  let coordToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter(), new NeedsDomainExceptionFilter());
    await app.init();

    const { db, pool } = createDb(
      process.env.DATABASE_URL ?? 'postgres://reliefhub:reliefhub@localhost:5433/reliefhub',
    );
    try {
      await db.delete(needsTable);
      // Insert coordinator user and membership (guard against existing rows)
      await db
        .insert(usersTable)
        .values({
          id: COORD_ID,
          email: 'coord-needs@reliefhub.org',
          passwordHash: await bcrypt.hash('coord1234', 10),
          name: 'Needs Coordinator',
          isAdmin: false,
        })
        .onConflictDoNothing();
      await db
        .insert(membershipsTable)
        .values({
          id: MEMBERSHIP_ID,
          userId: COORD_ID,
          emergencyId: EM,
          role: 'coordinator',
        })
        .onConflictDoNothing();
    } finally {
      await pool.end();
    }

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'coord-needs@reliefhub.org', password: 'coord1234' })
      .expect(200);
    coordToken = loginRes.body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates need (public 201) → appears in queue (coord) → validate (204) → appears in public/needs', async () => {
    const server = app.getHttpServer();

    // 1. Public: create need
    const created = await request(server)
      .post(`/emergencies/${EM}/needs`)
      .send({
        title: 'Food supplies for 100 families',
        category: 'food',
        priority: 'high',
        requestedQuantity: 100,
        unit: 'boxes',
      })
      .expect(201);

    const id: string = created.body.id;
    expect(id).toBeDefined();

    // 2. No token → 401 on queue
    await request(server).get(`/emergencies/${EM}/needs/queue`).expect(401);

    // 3. Coordinator: appears in queue
    const queue = await request(server)
      .get(`/emergencies/${EM}/needs/queue`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(200);
    expect(queue.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id, status: 'pending' })]),
    );

    // 4. Public needs: empty (not validated yet)
    const publicBefore = await request(server)
      .get(`/emergencies/${EM}/public/needs`)
      .expect(200);
    expect(publicBefore.body).toHaveLength(0);

    // 5. Coordinator: validate
    await request(server)
      .post(`/needs/${id}/validate`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(204);

    // 6. Queue: need no longer pending
    const queueAfter = await request(server)
      .get(`/emergencies/${EM}/needs/queue`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(200);
    expect(queueAfter.body.find((n: { id: string }) => n.id === id)).toBeUndefined();

    // 7. Public needs: now shows validated need
    const publicAfter = await request(server)
      .get(`/emergencies/${EM}/public/needs`)
      .expect(200);
    expect(publicAfter.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id, status: 'validated' })]),
    );
  });

  it('validate on non-existent need returns 404', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post('/needs/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/validate')
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(404);
  });

  it('validate already-validated need returns 409', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post(`/emergencies/${EM}/needs`)
      .send({ title: 'Duplicate validate test', category: 'medical', priority: 'medium' })
      .expect(201);
    const id: string = created.body.id;

    await request(server)
      .post(`/needs/${id}/validate`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(204);

    // Second validate → 409 (not pending)
    await request(server)
      .post(`/needs/${id}/validate`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(409);
  });

  it('create need without required fields returns 400', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post(`/emergencies/${EM}/needs`)
      .send({ category: 'food' }) // missing title and priority
      .expect(400);
  });
});
