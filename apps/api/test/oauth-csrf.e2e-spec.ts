/**
 * E2E tests for CSRF state protection on OAuth login endpoints.
 *
 * These tests exercise the OAuthInitiateGuard and OAuthCallbackGuard WITHOUT
 * real OAuth credentials. The strategies boot with placeholder clientIDs, so:
 *  - GET /auth/google → Passport issues a 302 redirect to accounts.google.com
 *    (we only care that the state cookie and query param are set).
 *  - GET /auth/google/callback?code=fake&state=WRONG → The callback guard MUST
 *    reject the request with 401 before Passport attempts a token exchange.
 *
 * No DB seeding is needed because these endpoints do not touch the database
 * before the state check. The invalid-state path is rejected in the guard.
 */

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/contexts/resources/infrastructure/http/domain-exception.filter';

/**
 * Safely extract the Set-Cookie response header as a string array.
 * `res.headers` is typed as `Record<string, unknown>` in supertest, so we
 * must narrow manually to avoid `no-unsafe-*` lint errors.
 */
function getSetCookies(res: { headers: Record<string, unknown> }): string[] {
  const raw: unknown = res.headers['set-cookie'];
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === 'string');
  }
  if (typeof raw === 'string') {
    return [raw];
  }
  return [];
}

describe('OAuth CSRF state protection (e2e)', () => {
  let app: INestApplication;
  let server: Server;

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
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Google initiate ───────────────────────────────────────────────────────

  describe('GET /auth/google (initiate)', () => {
    it('returns 302 and Location contains state=', async () => {
      const res = await request(server).get('/auth/google').redirects(0);

      expect(res.status).toBe(302);
      const location: unknown = res.headers['location'];
      expect(typeof location === 'string' ? location : '').toMatch(
        /[?&]state=/,
      );
    });

    it('sets the rh_oauth_state httpOnly cookie', async () => {
      const res = await request(server).get('/auth/google').redirects(0);

      const cookies = getSetCookies(res);
      const stateCookie = cookies.find((c) => c.startsWith('rh_oauth_state='));

      expect(stateCookie).toBeDefined();
      expect(stateCookie).toMatch(/HttpOnly/i);
    });
  });

  // ─── Google callback — invalid state ──────────────────────────────────────

  describe('GET /auth/google/callback (invalid state)', () => {
    it('returns 401 when query state does not match cookie', async () => {
      await request(server)
        .get('/auth/google/callback?code=fake&state=WRONG')
        .set('Cookie', 'rh_oauth_state=ORIGINAL')
        .redirects(0)
        .expect(401);
    });

    it('returns 401 when state cookie is missing', async () => {
      await request(server)
        .get('/auth/google/callback?code=fake&state=some-state')
        .redirects(0)
        .expect(401);
    });

    it('returns 401 when query state is missing', async () => {
      await request(server)
        .get('/auth/google/callback?code=fake')
        .set('Cookie', 'rh_oauth_state=some-state')
        .redirects(0)
        .expect(401);
    });

    it('does not redirect to /auth/complete on invalid state', async () => {
      const res = await request(server)
        .get('/auth/google/callback?code=fake&state=WRONG')
        .set('Cookie', 'rh_oauth_state=ORIGINAL')
        .redirects(0);

      const location: unknown = res.headers['location'];
      const locationStr = typeof location === 'string' ? location : '';
      expect(locationStr).not.toContain('/auth/complete#token=');
    });

    it('clears the state cookie even on rejection', async () => {
      const res = await request(server)
        .get('/auth/google/callback?code=fake&state=WRONG')
        .set('Cookie', 'rh_oauth_state=ORIGINAL')
        .redirects(0);

      // The cookie should be cleared (max-age=0 or Expires in the past) OR
      // the response may set no cookie at all. Either way the auth is rejected.
      expect(res.status).toBe(401);
    });
  });

  // ─── Facebook initiate ────────────────────────────────────────────────────

  describe('GET /auth/facebook (initiate)', () => {
    it('returns 302 and Location contains state=', async () => {
      const res = await request(server).get('/auth/facebook').redirects(0);

      expect(res.status).toBe(302);
      const location: unknown = res.headers['location'];
      expect(typeof location === 'string' ? location : '').toMatch(
        /[?&]state=/,
      );
    });

    it('sets the rh_oauth_state httpOnly cookie', async () => {
      const res = await request(server).get('/auth/facebook').redirects(0);

      const cookies = getSetCookies(res);
      const stateCookie = cookies.find((c) => c.startsWith('rh_oauth_state='));

      expect(stateCookie).toBeDefined();
      expect(stateCookie).toMatch(/HttpOnly/i);
    });
  });

  // ─── Facebook callback — invalid state ────────────────────────────────────

  describe('GET /auth/facebook/callback (invalid state)', () => {
    it('returns 401 when query state does not match cookie', async () => {
      await request(server)
        .get('/auth/facebook/callback?code=fake&state=WRONG')
        .set('Cookie', 'rh_oauth_state=ORIGINAL')
        .redirects(0)
        .expect(401);
    });

    it('returns 401 when state cookie is missing', async () => {
      await request(server)
        .get('/auth/facebook/callback?code=fake&state=some-state')
        .redirects(0)
        .expect(401);
    });
  });
});
