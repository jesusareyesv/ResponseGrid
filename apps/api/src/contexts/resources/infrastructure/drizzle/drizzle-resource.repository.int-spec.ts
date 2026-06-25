import { createDb, Db } from '../../../../shared/db';
import { resourcesTable } from './schema';
import { DrizzleResourceRepository } from './drizzle-resource.repository';
import { Resource } from '../../domain/resource';
import { ResourceId } from '../../domain/resource-id';
import { EmergencyId } from '../../domain/emergency-id';
import { ResourceType, ResourceStage, VerificationLevel, PublicStatus } from '../../domain/resource-enums';
import { Location } from '../../domain/location';
import type { Pool } from 'pg';

const URL = process.env.DATABASE_URL ?? 'postgres://reliefhub:reliefhub@localhost:5433/reliefhub';
const EM = '11111111-1111-4111-8111-111111111111';
const baseLocation = Location.create({ address: 'Calle Test 1, Sevilla', latitude: 37.3886, longitude: -5.9823 });

describe('DrizzleResourceRepository (integration)', () => {
  let db: Db;
  let pool: Pool;
  let repo: DrizzleResourceRepository;

  beforeAll(() => {
    ({ db, pool } = createDb(URL));
    repo = new DrizzleResourceRepository(db);
  });
  afterAll(async () => { await pool.end(); });
  beforeEach(async () => { await db.delete(resourcesTable); });

  it('round-trips an aggregate through Postgres', async () => {
    const r = Resource.register({
      id: ResourceId.create(),
      emergencyId: EmergencyId.fromString(EM),
      type: ResourceType.Warehouse,
      stage: ResourceStage.Origin,
      name: 'Almacén Sur',
      location: baseLocation,
      ownerUserId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    });
    await repo.save(r);
    const found = await repo.findById(r.id);
    expect(found?.name).toBe('Almacén Sur');
    expect(found?.stage).toBe(ResourceStage.Origin);
    expect(found?.location.address).toBe('Calle Test 1, Sevilla');
    expect(found?.ownerUserId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(found?.ownerOrganizationId).toBeNull();
    expect(found?.verificationLevel).toBe(VerificationLevel.Unverified);
  });

  it('round-trips resource with description and ownerOrganizationId', async () => {
    const r = Resource.register({
      id: ResourceId.create(),
      emergencyId: EmergencyId.fromString(EM),
      type: ResourceType.CollectionAndDelivery,
      stage: ResourceStage.Intermediate,
      name: 'Punto Mixto',
      description: 'Recogida y entrega central',
      location: baseLocation,
      ownerUserId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      ownerOrganizationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    });
    await repo.save(r);
    const found = await repo.findById(r.id);
    expect(found?.description).toBe('Recogida y entrega central');
    expect(found?.ownerOrganizationId).toBe('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
    expect(found?.stage).toBe(ResourceStage.Intermediate);
  });

  it('findPendingByEmergency filters by emergency and status', async () => {
    const pending = Resource.register({
      id: ResourceId.create(),
      emergencyId: EmergencyId.fromString(EM),
      type: ResourceType.CollectionPoint,
      stage: ResourceStage.Origin,
      name: 'P',
      location: baseLocation,
      ownerUserId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    });
    const verified = Resource.register({
      id: ResourceId.create(),
      emergencyId: EmergencyId.fromString(EM),
      type: ResourceType.CollectionPoint,
      stage: ResourceStage.Origin,
      name: 'V',
      location: baseLocation,
      ownerUserId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    });
    verified.verify(VerificationLevel.Verified, 'c1');
    await repo.save(pending);
    await repo.save(verified);
    const result = await repo.findPendingByEmergency(EmergencyId.fromString(EM));
    expect(result.map((x) => x.name)).toEqual(['P']);
  });

  it('findActiveByEmergency returns only published resources and excludes them from pending', async () => {
    const active = Resource.register({
      id: ResourceId.create(),
      emergencyId: EmergencyId.fromString(EM),
      type: ResourceType.CollectionPoint,
      stage: ResourceStage.Origin,
      name: 'Active',
      location: baseLocation,
      ownerUserId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    });
    active.verify(VerificationLevel.Verified, 'c1');
    active.publish();
    const pending = Resource.register({
      id: ResourceId.create(),
      emergencyId: EmergencyId.fromString(EM),
      type: ResourceType.CollectionPoint,
      stage: ResourceStage.Origin,
      name: 'Pending',
      location: baseLocation,
      ownerUserId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    });
    await repo.save(active);
    await repo.save(pending);

    const activeResult = await repo.findActiveByEmergency(EmergencyId.fromString(EM));
    expect(activeResult.map((x) => x.name)).toEqual(['Active']);
    expect(activeResult[0].publicStatus).toBe(PublicStatus.Active);

    const pendingResult = await repo.findPendingByEmergency(EmergencyId.fromString(EM));
    expect(pendingResult.map((x) => x.name)).toEqual(['Pending']);
  });
});
