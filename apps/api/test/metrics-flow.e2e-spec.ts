import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/contexts/resources/infrastructure/http/domain-exception.filter';
import { NeedsDomainExceptionFilter } from '../src/contexts/needs/infrastructure/http/domain-exception.filter';
import { createDb } from '../src/shared/db';
import { needsTable, needItemsTable } from '../src/contexts/needs/infrastructure/drizzle/schema';
import { resourcesTable } from '../src/contexts/resources/infrastructure/drizzle/schema';
import { usersTable, membershipsTable } from '../src/contexts/identity/infrastructure/drizzle/schema';
import * as bcrypt from 'bcryptjs';

// Unique emergency and user UUIDs to avoid conflicts with other e2e specs
const EM = '55555555-5555-4555-8555-555555555555';
const COORD_ID = 'ff500000-0000-4000-8000-000000000011';
const MEMBERSHIP_ID = 'ff600000-0000-4000-8000-000000000012';

const baseNeedBody = {
  title: 'Test need for metrics',
  location: { address: 'Test Street, Caracas', latitude: 10.48, longitude: -66.9 },
  priority: 'high',
  items: [{ name: 'Water', quantity: 10, unit: 'liters', category: 'water' }],
};

const baseResourceBody = {
  type: 'collection_point',
  stage: 'origin',
  name: 'Test collection point',
  location: { address: 'Test Avenue, Caracas', latitude: 10.49, longitude: -66.91 },
};

describe('Metrics endpoint (e2e)', () => {
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
      // Clean up test data for this emergency
      await db.delete(needItemsTable);
      await db.delete(needsTable);
      await db.delete(resourcesTable);

      await db
        .insert(usersTable)
        .values({
          id: COORD_ID,
          email: 'coord-metrics@reliefhub.org',
          passwordHash: await bcrypt.hash('coord1234', 10),
          name: 'Metrics Coordinator',
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
      .send({ email: 'coord-metrics@reliefhub.org', password: 'coord1234' })
      .expect(200);
    coordToken = loginRes.body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /emergencies/{id}/metrics returns zeros for unknown emergency (public, no auth)', async () => {
    const res = await request(app.getHttpServer())
      .get('/emergencies/11111111-1111-4111-8111-111111111111/metrics')
      .expect(200);

    // Structure check
    expect(res.body).toHaveProperty('needs');
    expect(res.body).toHaveProperty('resources');
    expect(typeof res.body.needs.total).toBe('number');
    expect(typeof res.body.needs.open).toBe('number');
    expect(typeof res.body.needs.closed).toBe('number');
    expect(typeof res.body.resources.total).toBe('number');
    expect(typeof res.body.resources.active).toBe('number');
    expect(typeof res.body.resources.pending).toBe('number');
  });

  it('invalid UUID returns 400', async () => {
    await request(app.getHttpServer()).get('/emergencies/not-a-uuid/metrics').expect(400);
  });

  it('reflects created needs and resources in metrics', async () => {
    const server = app.getHttpServer();

    // Create 2 needs
    const n1 = await request(server)
      .post(`/emergencies/${EM}/needs`)
      .set('Authorization', `Bearer ${coordToken}`)
      .send(baseNeedBody)
      .expect(201);
    const n2 = await request(server)
      .post(`/emergencies/${EM}/needs`)
      .set('Authorization', `Bearer ${coordToken}`)
      .send({ ...baseNeedBody, title: 'Second need' })
      .expect(201);

    // Create 1 resource
    const r1 = await request(server)
      .post(`/emergencies/${EM}/resources`)
      .set('Authorization', `Bearer ${coordToken}`)
      .send(baseResourceBody)
      .expect(201);

    // Check metrics: 2 pending needs, 1 hidden resource
    const metricsAfterCreate = await request(server)
      .get(`/emergencies/${EM}/metrics`)
      .expect(200);

    expect(metricsAfterCreate.body.needs.total).toBe(2);
    expect(metricsAfterCreate.body.needs.open).toBe(2);   // both pending = open
    expect(metricsAfterCreate.body.needs.closed).toBe(0);
    expect(metricsAfterCreate.body.resources.total).toBe(1);
    expect(metricsAfterCreate.body.resources.pending).toBe(1); // hidden
    expect(metricsAfterCreate.body.resources.active).toBe(0);

    // Validate one need
    await request(server)
      .post(`/needs/${n1.body.id as string}/validate`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(204);

    const metricsAfterValidate = await request(server)
      .get(`/emergencies/${EM}/metrics`)
      .expect(200);

    // 1 pending + 1 validated → total 2, open 2
    expect(metricsAfterValidate.body.needs.total).toBe(2);
    expect(metricsAfterValidate.body.needs.open).toBe(2);

    // Verify + publish the resource
    await request(server)
      .post(`/resources/${r1.body.id as string}/verify`)
      .set('Authorization', `Bearer ${coordToken}`)
      .send({ level: 'verified' })
      .expect(204);

    await request(server)
      .post(`/resources/${r1.body.id as string}/publish`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(204);

    const metricsFinal = await request(server)
      .get(`/emergencies/${EM}/metrics`)
      .expect(200);

    expect(metricsFinal.body.resources.active).toBe(1);
    expect(metricsFinal.body.resources.pending).toBe(0);
    expect(metricsFinal.body.resources.total).toBe(1);
  });
});
