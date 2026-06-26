/**
 * E2E: volunteer roster (F4b-A1)
 *
 * Tests:
 * - POST /emergencies/:id/volunteers (register; 201; 409 if emergency paused; 422 if no consent)
 * - Second registration of same user → upsert (same id returned, no duplicate)
 * - GET /emergencies/:id/volunteers (coordinator only; filter by skill; 403 for non-coordinator)
 * - POST /volunteers/:id/status (coordinator only; 403 for wrong emergency)
 * - GET /emergencies/:id/volunteers/me (own profile)
 */
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createDb } from '../src/shared/db';
import {
  usersTable,
  membershipsTable,
} from '../src/contexts/identity/infrastructure/drizzle/schema';
import { emergenciesTable } from '../src/contexts/emergencies/infrastructure/drizzle/schema';
import { volunteersTable } from '../src/contexts/volunteers/infrastructure/drizzle/schema';
import * as bcrypt from 'bcryptjs';

// Unique UUIDs for this spec file — avoid PK conflicts with other specs
const EM_V = 'f0000001-0000-4000-8000-000000000001';
const EM_V2 = 'f0000001-0000-4000-8000-000000000002'; // second emergency (for cross-scope 403)
const COORD_V_ID = 'f0000001-0000-4000-8000-000000000010';
const USER_V_ID = 'f0000001-0000-4000-8000-000000000011';
const COORD_V2_ID = 'f0000001-0000-4000-8000-000000000012';
const MEM_COORD_V = 'f0000001-0000-4000-8000-000000000020';
const MEM_COORD_V2 = 'f0000001-0000-4000-8000-000000000021';

const BASE_VOLUNTEER_BODY = {
  name: 'Ana García',
  contact: 'ana@example.com',
  municipality: 'Valencia',
  skills: ['medical', 'driving'],
  availability: 'immediate',
  vehicle: 'car',
  consentAccepted: true,
};

describe('Volunteer roster (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let coordToken: string;
  let userToken: string;
  let coord2Token: string;

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
    await app.init();
    server = app.getHttpServer() as Server;

    const { db, pool } = createDb(
      process.env.DATABASE_URL ??
        'postgres://reliefhub:reliefhub@localhost:5433/reliefhub',
    );
    try {
      await db.delete(volunteersTable);

      // Seed emergencies
      await db
        .insert(emergenciesTable)
        .values([
          {
            id: EM_V,
            name: 'Volunteer E2E Emergency',
            slug: 'volunteer-e2e-emergency',
            country: 'ES',
            status: 'active',
            createdAt: new Date(),
          },
          {
            id: EM_V2,
            name: 'Volunteer E2E Emergency 2',
            slug: 'volunteer-e2e-emergency-2',
            country: 'ES',
            status: 'active',
            createdAt: new Date(),
          },
        ])
        .onConflictDoNothing();

      // Seed users
      const coordHash = await bcrypt.hash('coord1234', 10);
      const userHash = await bcrypt.hash('user1234', 10);
      await db
        .insert(usersTable)
        .values([
          {
            id: COORD_V_ID,
            email: 'coord-vol@reliefhub.org',
            passwordHash: coordHash,
            name: 'Volunteer Coordinator',
            isAdmin: false,
          },
          {
            id: USER_V_ID,
            email: 'volunteer-user@reliefhub.org',
            passwordHash: userHash,
            name: 'Regular User',
            isAdmin: false,
          },
          {
            id: COORD_V2_ID,
            email: 'coord-vol2@reliefhub.org',
            passwordHash: coordHash,
            name: 'Volunteer Coordinator 2',
            isAdmin: false,
          },
        ])
        .onConflictDoNothing();

      // Memberships
      await db
        .insert(membershipsTable)
        .values([
          {
            id: MEM_COORD_V,
            userId: COORD_V_ID,
            emergencyId: EM_V,
            role: 'coordinator',
          },
          {
            id: MEM_COORD_V2,
            userId: COORD_V2_ID,
            emergencyId: EM_V2,
            role: 'coordinator',
          },
        ])
        .onConflictDoNothing();
    } finally {
      await pool.end();
    }

    // Login all tokens
    const [coordRes, userRes, coord2Res] = await Promise.all([
      request(server)
        .post('/auth/login')
        .send({ email: 'coord-vol@reliefhub.org', password: 'coord1234' })
        .expect(200),
      request(server)
        .post('/auth/login')
        .send({ email: 'volunteer-user@reliefhub.org', password: 'user1234' })
        .expect(200),
      request(server)
        .post('/auth/login')
        .send({ email: 'coord-vol2@reliefhub.org', password: 'coord1234' })
        .expect(200),
    ]);
    coordToken = (coordRes.body as { accessToken: string }).accessToken;
    userToken = (userRes.body as { accessToken: string }).accessToken;
    coord2Token = (coord2Res.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Register ──────────────────────────────────────────────────────────────────

  describe('POST /emergencies/:id/volunteers', () => {
    it('registers a volunteer and returns 201 with id', async () => {
      const res = await request(server)
        .post(`/emergencies/${EM_V}/volunteers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(BASE_VOLUNTEER_BODY)
        .expect(201);
      expect(typeof (res.body as { id: string }).id).toBe('string');
    });

    it('second registration by same user → upsert (same id, no duplicate)', async () => {
      // First registration (may already exist from previous test)
      const first = await request(server)
        .post(`/emergencies/${EM_V}/volunteers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(BASE_VOLUNTEER_BODY)
        .expect(201);
      const id1 = (first.body as { id: string }).id;

      // Second registration
      const second = await request(server)
        .post(`/emergencies/${EM_V}/volunteers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...BASE_VOLUNTEER_BODY, name: 'Ana Updated' })
        .expect(201);
      const id2 = (second.body as { id: string }).id;

      expect(id1).toBe(id2);
    });

    it('returns 422 when consentAccepted is false', async () => {
      await request(server)
        .post(`/emergencies/${EM_V}/volunteers`)
        .set('Authorization', `Bearer ${coordToken}`)
        .send({ ...BASE_VOLUNTEER_BODY, consentAccepted: false })
        .expect(422);
    });

    it('returns 400 when consentAccepted is missing', async () => {
      const { consentAccepted: _, ...bodyWithoutConsent } = BASE_VOLUNTEER_BODY;
      await request(server)
        .post(`/emergencies/${EM_V}/volunteers`)
        .set('Authorization', `Bearer ${coordToken}`)
        .send(bodyWithoutConsent)
        .expect(400);
    });

    it('returns 401 without token', async () => {
      await request(server)
        .post(`/emergencies/${EM_V}/volunteers`)
        .send(BASE_VOLUNTEER_BODY)
        .expect(401);
    });

    it('returns 409 when emergency is paused', async () => {
      // Seed a paused emergency
      const PAUSED_EM = 'f0000001-0000-4000-8000-000000000099';
      const { db, pool } = createDb(
        process.env.DATABASE_URL ??
          'postgres://reliefhub:reliefhub@localhost:5433/reliefhub',
      );
      try {
        await db
          .insert(emergenciesTable)
          .values({
            id: PAUSED_EM,
            name: 'Paused Emergency',
            slug: 'paused-emergency-vol',
            country: 'ES',
            status: 'paused',
            createdAt: new Date(),
          })
          .onConflictDoNothing();
      } finally {
        await pool.end();
      }

      await request(server)
        .post(`/emergencies/${PAUSED_EM}/volunteers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(BASE_VOLUNTEER_BODY)
        .expect(409);
    });
  });

  // ── Roster (coordinator only) ─────────────────────────────────────────────────

  describe('GET /emergencies/:id/volunteers', () => {
    beforeAll(async () => {
      // Ensure we have a few volunteers for EM_V
      // coord registers for EM_V as a volunteer too
      await request(server)
        .post(`/emergencies/${EM_V}/volunteers`)
        .set('Authorization', `Bearer ${coordToken}`)
        .send({
          ...BASE_VOLUNTEER_BODY,
          name: 'Coord Volunteer',
          skills: ['logistics'],
        });
    });

    it('returns roster for coordinator → 200', async () => {
      const res = await request(server)
        .get(`/emergencies/${EM_V}/volunteers`)
        .set('Authorization', `Bearer ${coordToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect((res.body as unknown[]).length).toBeGreaterThanOrEqual(1);
    });

    it('returns 403 for non-coordinator (authenticated user)', async () => {
      await request(server)
        .get(`/emergencies/${EM_V}/volunteers`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 403 for coordinator of a different emergency', async () => {
      await request(server)
        .get(`/emergencies/${EM_V}/volunteers`)
        .set('Authorization', `Bearer ${coord2Token}`)
        .expect(403);
    });

    it('filters by skill', async () => {
      const res = await request(server)
        .get(`/emergencies/${EM_V}/volunteers?skill=logistics`)
        .set('Authorization', `Bearer ${coordToken}`)
        .expect(200);
      const volunteers = res.body as Array<{ skills: string[] }>;
      expect(volunteers.length).toBeGreaterThanOrEqual(1);
      volunteers.forEach((v) => {
        expect(v.skills).toContain('logistics');
      });
    });

    it('returns 401 without token', async () => {
      await request(server).get(`/emergencies/${EM_V}/volunteers`).expect(401);
    });
  });

  // ── Update status (coordinator of the volunteer's emergency) ──────────────────

  describe('POST /volunteers/:id/status', () => {
    let volunteerId: string;

    beforeAll(async () => {
      // Register a volunteer and get its id
      const res = await request(server)
        .post(`/emergencies/${EM_V}/volunteers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(BASE_VOLUNTEER_BODY)
        .expect(201);
      volunteerId = (res.body as { id: string }).id;
    });

    it('coordinator can change volunteer status → 204', async () => {
      await request(server)
        .post(`/volunteers/${volunteerId}/status`)
        .set('Authorization', `Bearer ${coordToken}`)
        .send({ status: 'assigned' })
        .expect(204);
    });

    it('coordinator of different emergency cannot change status → 403', async () => {
      await request(server)
        .post(`/volunteers/${volunteerId}/status`)
        .set('Authorization', `Bearer ${coord2Token}`)
        .send({ status: 'inactive' })
        .expect(403);
    });

    it('returns 401 without token', async () => {
      await request(server)
        .post(`/volunteers/${volunteerId}/status`)
        .send({ status: 'assigned' })
        .expect(401);
    });

    it('returns 404 for non-existent volunteer', async () => {
      await request(server)
        .post('/volunteers/00000000-0000-4000-8000-000000000099/status')
        .set('Authorization', `Bearer ${coordToken}`)
        .send({ status: 'assigned' })
        .expect(404);
    });
  });

  // ── My profile ────────────────────────────────────────────────────────────────

  describe('GET /emergencies/:id/volunteers/me', () => {
    it('returns my volunteer profile after registration', async () => {
      await request(server)
        .post(`/emergencies/${EM_V}/volunteers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(BASE_VOLUNTEER_BODY);

      const res = await request(server)
        .get(`/emergencies/${EM_V}/volunteers/me`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const profile = res.body as { userId: string; emergencyId: string };
      expect(profile.userId).toBe(USER_V_ID);
      expect(profile.emergencyId).toBe(EM_V);
    });

    it('returns 404 when not registered in the emergency', async () => {
      // coord2 is not registered as volunteer in EM_V
      await request(server)
        .get(`/emergencies/${EM_V}/volunteers/me`)
        .set('Authorization', `Bearer ${coord2Token}`)
        .expect(404);
    });

    it('returns 401 without token', async () => {
      await request(server)
        .get(`/emergencies/${EM_V}/volunteers/me`)
        .expect(401);
    });
  });
});
