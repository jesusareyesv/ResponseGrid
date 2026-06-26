import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/contexts/resources/infrastructure/http/domain-exception.filter';
import { NeedsDomainExceptionFilter } from '../src/contexts/needs/infrastructure/http/domain-exception.filter';
import { ReportExceptionFilter } from '../src/contexts/reports/infrastructure/http/report-exception.filter';
import { createDb } from '../src/shared/db';
import {
  usersTable,
  membershipsTable,
} from '../src/contexts/identity/infrastructure/drizzle/schema';
import { emergenciesTable } from '../src/contexts/emergencies/infrastructure/drizzle/schema';
import { reportsTable } from '../src/contexts/reports/infrastructure/drizzle/schema';
import * as bcrypt from 'bcryptjs';

const EM = 'ee100000-0000-4000-8000-000000000001';
const COORD_ID = 'ee200000-0000-4000-8000-000000000002';
const REPORTER_ID = 'ee300000-0000-4000-8000-000000000003';
const COORD_MEMBERSHIP_ID = 'ee400000-0000-4000-8000-000000000004';

describe('Reports flow (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let coordToken: string;
  let reporterToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(
      new DomainExceptionFilter(),
      new NeedsDomainExceptionFilter(),
      new ReportExceptionFilter(),
    );
    await app.init();
    server = app.getHttpServer() as Server;

    const { db, pool } = createDb(
      process.env.DATABASE_URL ??
        'postgres://reliefhub:reliefhub@localhost:5433/reliefhub',
    );
    try {
      await db.delete(reportsTable);
      await db.delete(membershipsTable).where(
        // Only delete memberships related to our test emergency
        undefined,
      );
      // Seed emergency
      await db
        .insert(emergenciesTable)
        .values({
          id: EM,
          name: 'Reports E2E Emergency',
          slug: 'reports-e2e-emergency',
          country: 'ES',
          status: 'active',
          createdAt: new Date(),
        })
        .onConflictDoNothing();

      // Seed coordinator
      const coordHash = await bcrypt.hash('coord1234', 10);
      await db
        .insert(usersTable)
        .values({
          id: COORD_ID,
          email: 'reports-coord@reliefhub.org',
          passwordHash: coordHash,
          name: 'Reports Coordinator',
          isAdmin: false,
        })
        .onConflictDoNothing();
      await db
        .insert(membershipsTable)
        .values({
          id: COORD_MEMBERSHIP_ID,
          userId: COORD_ID,
          emergencyId: EM,
          role: 'coordinator',
        })
        .onConflictDoNothing();

      // Seed reporter (not a coordinator)
      const reporterHash = await bcrypt.hash('reporter1234', 10);
      await db
        .insert(usersTable)
        .values({
          id: REPORTER_ID,
          email: 'reporter@reliefhub.org',
          passwordHash: reporterHash,
          name: 'Field Reporter',
          isAdmin: false,
        })
        .onConflictDoNothing();
    } finally {
      await pool.end();
    }

    // Obtain tokens
    const [coordLogin, reporterLogin] = await Promise.all([
      request(server)
        .post('/auth/login')
        .send({ email: 'reports-coord@reliefhub.org', password: 'coord1234' })
        .expect(200),
      request(server)
        .post('/auth/login')
        .send({ email: 'reporter@reliefhub.org', password: 'reporter1234' })
        .expect(200),
    ]);
    coordToken = (coordLogin.body as { accessToken: string }).accessToken;
    reporterToken = (reporterLogin.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('upload photo → submit report with that URL → appears in coordinator queue → mark reviewed', async () => {
    // 1. Upload a photo
    const pngBuf = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    const uploadRes = await request(server)
      .post('/files')
      .set('Authorization', `Bearer ${reporterToken}`)
      .attach('file', pngBuf, {
        filename: 'scene.png',
        contentType: 'image/png',
      })
      .expect(201);
    const { url: photoUrl } = uploadRes.body as { key: string; url: string };
    expect(typeof photoUrl).toBe('string');

    // 2. Submit a report with the photo URL
    const submitRes = await request(server)
      .post(`/emergencies/${EM}/reports`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        type: 'incident',
        note: 'Bridge is flooded',
        priority: 'urgent',
        photoUrls: [photoUrl],
      })
      .expect(201);
    const { id: reportId } = submitRes.body as { id: string };
    expect(typeof reportId).toBe('string');

    // 3. Coordinator sees it in the queue
    const queueRes = await request(server)
      .get(`/emergencies/${EM}/reports`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(200);
    const queue = queueRes.body as {
      id: string;
      status: string;
      photoUrls: string[];
    }[];
    const found = queue.find((r) => r.id === reportId);
    expect(found).toBeDefined();
    expect(found!.status).toBe('open');
    expect(found!.photoUrls).toContain(photoUrl);

    // 4. Mark the report reviewed
    await request(server)
      .post(`/reports/${reportId}/review`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(204);

    // 5. Now it appears as reviewed in the queue
    const queueAfter = await request(server)
      .get(`/emergencies/${EM}/reports`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(200);
    const foundAfter = (
      queueAfter.body as { id: string; status: string }[]
    ).find((r) => r.id === reportId);
    expect(foundAfter!.status).toBe('reviewed');
  });

  it('non-coordinator cannot view the queue (403)', async () => {
    await request(server)
      .get(`/emergencies/${EM}/reports`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .expect(403);
  });

  it('filters queue by priority', async () => {
    // Submit two reports with different priorities
    await request(server)
      .post(`/emergencies/${EM}/reports`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({ type: 'other', note: 'Low priority note', priority: 'low' })
      .expect(201);
    await request(server)
      .post(`/emergencies/${EM}/reports`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({ type: 'other', note: 'High priority note', priority: 'high' })
      .expect(201);

    const highOnly = await request(server)
      .get(`/emergencies/${EM}/reports?priority=high`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(200);
    const reports = highOnly.body as { priority: string }[];
    expect(reports.every((r) => r.priority === 'high')).toBe(true);
  });

  it('reporter can see their own reports via GET /mine', async () => {
    const mineRes = await request(server)
      .get(`/emergencies/${EM}/reports/mine`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .expect(200);
    const mine = mineRes.body as { reporterUserId: string }[];
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((r) => r.reporterUserId === REPORTER_ID)).toBe(true);
  });

  it('POST /emergencies/:id/reports without auth returns 401', async () => {
    await request(server)
      .post(`/emergencies/${EM}/reports`)
      .send({ type: 'incident', note: 'No auth', priority: 'low' })
      .expect(401);
  });

  it('marking non-existent report as reviewed returns 404', async () => {
    await request(server)
      .post('/reports/ffffffff-ffff-4fff-8fff-ffffffffffff/review')
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(404);
  });
});
