import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/contexts/resources/infrastructure/http/domain-exception.filter';
import { NeedsDomainExceptionFilter } from '../src/contexts/needs/infrastructure/http/domain-exception.filter';
import { createDb } from '../src/shared/db';
import { needsTable, needItemsTable } from '../src/contexts/needs/infrastructure/drizzle/schema';
import { usersTable, membershipsTable } from '../src/contexts/identity/infrastructure/drizzle/schema';
import * as bcrypt from 'bcryptjs';

const EM = '33333333-3333-4333-8333-333333333333';
const COORD_ID = 'ff000000-0000-4000-8000-000000000006';
const MEMBERSHIP_ID = 'ff100000-0000-4000-8000-000000000007';
const ORG_ID = 'ee000000-0000-4000-8000-000000000009';

// Base body for creating a need
const baseNeedBody = {
  title: 'Food supplies for 100 families',
  description: 'Urgent food needed near the shelter',
  location: {
    address: 'Avenida Principal, Caracas, Venezuela',
    latitude: 10.4806,
    longitude: -66.9036,
  },
  priority: 'high',
  items: [
    { name: 'Rice bags', quantity: 100, unit: 'kg', category: 'food' },
    { name: 'Water bottles', quantity: 200, unit: 'liters', category: 'water' },
  ],
};

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
      await db.delete(needItemsTable);
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

  it('POST without token → 401', async () => {
    await request(app.getHttpServer())
      .post(`/emergencies/${EM}/needs`)
      .send(baseNeedBody)
      .expect(401);
  });

  it('full flow: create (auth) → queue (coord) → validate → public/needs → assign-manager', async () => {
    const server = app.getHttpServer();

    // 1. Create need with auth (2 items + location)
    const created = await request(server)
      .post(`/emergencies/${EM}/needs`)
      .set('Authorization', `Bearer ${coordToken}`)
      .send(baseNeedBody)
      .expect(201);

    const id: string = created.body.id;
    expect(id).toBeDefined();

    // 2. No token → 401 on queue
    await request(server).get(`/emergencies/${EM}/needs/queue`).expect(401);

    // 3. Coordinator: appears in queue with items and location
    const queue = await request(server)
      .get(`/emergencies/${EM}/needs/queue`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(200);

    const queuedNeed = queue.body.find((n: { id: string }) => n.id === id);
    expect(queuedNeed).toBeDefined();
    expect(queuedNeed.status).toBe('pending');
    expect(queuedNeed.items).toHaveLength(2);
    expect(queuedNeed.items[0].name).toBe('Rice bags');
    expect(queuedNeed.items[1].name).toBe('Water bottles');
    expect(queuedNeed.location.address).toBe('Avenida Principal, Caracas, Venezuela');
    expect(queuedNeed.location.latitude).toBe(10.4806);
    expect(queuedNeed.description).toBe('Urgent food needed near the shelter');

    // 4. Public needs: empty (not validated yet)
    const publicBefore = await request(server)
      .get(`/emergencies/${EM}/public/needs`)
      .expect(200);
    expect(publicBefore.body.find((n: { id: string }) => n.id === id)).toBeUndefined();

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

    // 7. Public needs: now shows validated need with items and location
    const publicAfter = await request(server)
      .get(`/emergencies/${EM}/public/needs`)
      .expect(200);

    const publicNeed = publicAfter.body.find((n: { id: string }) => n.id === id);
    expect(publicNeed).toBeDefined();
    expect(publicNeed.status).toBe('validated');
    expect(publicNeed.items).toHaveLength(2);
    expect(publicNeed.location).toBeDefined();
    expect(publicNeed.managingOrganizationId).toBeNull();

    // 8. Assign manager
    await request(server)
      .post(`/needs/${id}/assign-manager`)
      .set('Authorization', `Bearer ${coordToken}`)
      .send({ organizationId: ORG_ID })
      .expect(204);

    // 9. Verify managingOrganizationId appears in public view
    const publicAssigned = await request(server)
      .get(`/emergencies/${EM}/public/needs`)
      .expect(200);
    const assignedNeed = publicAssigned.body.find((n: { id: string }) => n.id === id);
    expect(assignedNeed.managingOrganizationId).toBe(ORG_ID);
  });

  it('validate on non-existent need returns 404', async () => {
    await request(app.getHttpServer())
      .post('/needs/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/validate')
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(404);
  });

  it('validate already-validated need returns 409', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post(`/emergencies/${EM}/needs`)
      .set('Authorization', `Bearer ${coordToken}`)
      .send({
        title: 'Duplicate validate test',
        location: { address: 'Caracas', latitude: 10.48, longitude: -66.90 },
        priority: 'medium',
        items: [{ name: 'Medical kits', quantity: 5, unit: 'kits', category: 'medical' }],
      })
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
    await request(app.getHttpServer())
      .post(`/emergencies/${EM}/needs`)
      .set('Authorization', `Bearer ${coordToken}`)
      .send({ title: 'Missing items and location', priority: 'high' })
      .expect(400);
  });

  it('create need with empty items array returns 400', async () => {
    await request(app.getHttpServer())
      .post(`/emergencies/${EM}/needs`)
      .set('Authorization', `Bearer ${coordToken}`)
      .send({
        title: 'No items',
        location: { address: 'Caracas', latitude: 10.48, longitude: -66.90 },
        priority: 'high',
        items: [],
      })
      .expect(400);
  });

  it('assign-manager on non-existent need returns 404', async () => {
    await request(app.getHttpServer())
      .post('/needs/cccccccc-cccc-4ccc-8ccc-cccccccccccc/assign-manager')
      .set('Authorization', `Bearer ${coordToken}`)
      .send({ organizationId: ORG_ID })
      .expect(404);
  });
});
