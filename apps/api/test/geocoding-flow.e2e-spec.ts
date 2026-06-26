import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { GeocodingModule } from '../src/contexts/geocoding/infrastructure/geocoding.module';
import { GEOCODING_PROVIDER } from '../src/contexts/geocoding/domain/ports/geocoding.provider';

describe('Geocoding flow (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GeocodingModule],
    })
      .overrideProvider(GEOCODING_PROVIDER)
      .useValue({
        search: (q: string) =>
          Promise.resolve(
            q.length >= 3
              ? [{ address: `${q}, Spain`, latitude: 40.0, longitude: -3.5 }]
              : [],
          ),
      })
      .compile();

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /geocode?q=Madrid returns geocode results', async () => {
    const res = await request(server).get('/geocode?q=Madrid').expect(200);

    const body = res.body as Array<{
      address: string;
      latitude: number;
      longitude: number;
    }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(typeof body[0].address).toBe('string');
    expect(typeof body[0].latitude).toBe('number');
    expect(typeof body[0].longitude).toBe('number');
  });

  it('GET /geocode?q=ab returns empty array', async () => {
    const res = await request(server).get('/geocode?q=ab').expect(200);

    expect(res.body).toEqual([]);
  });

  it('GET /geocode?q= returns empty array for empty query', async () => {
    const res = await request(server).get('/geocode?q=').expect(200);

    expect(res.body).toEqual([]);
  });
});
