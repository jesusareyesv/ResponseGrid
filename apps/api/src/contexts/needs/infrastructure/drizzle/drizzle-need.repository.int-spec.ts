import { createDb, Db } from '../../../../shared/db';
import { needsTable } from './schema';
import { DrizzleNeedRepository } from './drizzle-need.repository';
import { Need } from '../../domain/need';
import { NeedId } from '../../domain/need-id';
import { EmergencyId } from '../../domain/emergency-id';
import { NeedCategory, Priority, NeedStatus } from '../../domain/need-enums';
import type { Pool } from 'pg';

const URL = process.env.DATABASE_URL ?? 'postgres://reliefhub:reliefhub@localhost:5433/reliefhub';
const EM = '22222222-2222-4222-8222-222222222222';

describe('DrizzleNeedRepository (integration)', () => {
  let db: Db;
  let pool: Pool;
  let repo: DrizzleNeedRepository;

  beforeAll(() => {
    ({ db, pool } = createDb(URL));
    repo = new DrizzleNeedRepository(db);
  });
  afterAll(async () => {
    await pool.end();
  });
  beforeEach(async () => {
    await db.delete(needsTable);
  });

  it('round-trips a need through Postgres', async () => {
    const need = Need.create({
      id: NeedId.create(),
      emergencyId: EmergencyId.fromString(EM),
      title: 'Water bottles',
      category: NeedCategory.Water,
      priority: Priority.Urgent,
      requestedQuantity: 200,
      unit: 'bottles',
    });
    await repo.save(need);
    const found = await repo.findById(need.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Water bottles');
    expect(found!.status).toBe(NeedStatus.Pending);
    expect(found!.requestedQuantity).toBe(200);
    expect(found!.unit).toBe('bottles');
  });

  it('save() updates status on conflict', async () => {
    const need = Need.create({
      id: NeedId.create(),
      emergencyId: EmergencyId.fromString(EM),
      title: 'Shelter kits',
      category: NeedCategory.Shelter,
      priority: Priority.High,
      requestedQuantity: null,
      unit: null,
    });
    await repo.save(need);

    need.validate();
    await repo.save(need);

    const found = await repo.findById(need.id);
    expect(found!.status).toBe(NeedStatus.Validated);
  });

  it('findPendingByEmergency returns only pending needs', async () => {
    const pending = Need.create({
      id: NeedId.create(),
      emergencyId: EmergencyId.fromString(EM),
      title: 'Pending food',
      category: NeedCategory.Food,
      priority: Priority.Medium,
      requestedQuantity: null,
      unit: null,
    });
    const toValidate = Need.create({
      id: NeedId.create(),
      emergencyId: EmergencyId.fromString(EM),
      title: 'Will be validated',
      category: NeedCategory.Medical,
      priority: Priority.High,
      requestedQuantity: null,
      unit: null,
    });
    toValidate.validate();

    await repo.save(pending);
    await repo.save(toValidate);

    const result = await repo.findPendingByEmergency(EmergencyId.fromString(EM));
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Pending food');
  });

  it('findValidatedByEmergency returns only validated needs', async () => {
    const pending = Need.create({
      id: NeedId.create(),
      emergencyId: EmergencyId.fromString(EM),
      title: 'Still pending',
      category: NeedCategory.Tools,
      priority: Priority.Low,
      requestedQuantity: null,
      unit: null,
    });
    const validated = Need.create({
      id: NeedId.create(),
      emergencyId: EmergencyId.fromString(EM),
      title: 'Validated need',
      category: NeedCategory.Water,
      priority: Priority.Urgent,
      requestedQuantity: 50,
      unit: 'liters',
    });
    validated.validate();

    await repo.save(pending);
    await repo.save(validated);

    const result = await repo.findValidatedByEmergency(EmergencyId.fromString(EM));
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Validated need');
    expect(result[0].status).toBe(NeedStatus.Validated);
  });

  it('round-trips null requestedQuantity and unit', async () => {
    const need = Need.create({
      id: NeedId.create(),
      emergencyId: EmergencyId.fromString(EM),
      title: 'General need',
      category: NeedCategory.Other,
      priority: Priority.Low,
      requestedQuantity: null,
      unit: null,
    });
    await repo.save(need);
    const found = await repo.findById(need.id);
    expect(found!.requestedQuantity).toBeNull();
    expect(found!.unit).toBeNull();
  });
});
