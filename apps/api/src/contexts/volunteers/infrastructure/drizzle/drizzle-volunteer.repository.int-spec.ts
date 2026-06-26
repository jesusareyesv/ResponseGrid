import { createDb, Db } from '../../../../shared/db';
import { volunteersTable } from './schema';
import { DrizzleVolunteerRepository } from './drizzle-volunteer.repository';
import { Volunteer } from '../../domain/volunteer';
import { VolunteerId } from '../../domain/volunteer-id';
import { EmergencyId } from '../../../../shared/domain/emergency-id';
import {
  VolunteerSkill,
  Availability,
  Vehicle,
  VolunteerStatus,
} from '../../domain/volunteer-enums';
import type { Pool } from 'pg';

const EM = '22222222-2222-4222-8222-222222222222';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const URL =
  process.env.DATABASE_URL ??
  'postgres://reliefhub:reliefhub@localhost:5433/reliefhub';

function makeVolunteer(
  userId: string,
  overrides?: { skills?: VolunteerSkill[] },
): Volunteer {
  return Volunteer.register({
    id: VolunteerId.create(),
    emergencyId: EmergencyId.fromString(EM),
    userId,
    name: 'Test Volunteer',
    contact: 'test@example.com',
    municipality: 'Valencia',
    skills: overrides?.skills ?? [VolunteerSkill.General],
    availability: Availability.Immediate,
    vehicle: Vehicle.Car,
    consentAccepted: true,
  });
}

describe('DrizzleVolunteerRepository (integration)', () => {
  let db: Db;
  let pool: Pool;
  let repo: DrizzleVolunteerRepository;

  beforeAll(() => {
    ({ db, pool } = createDb(URL));
    repo = new DrizzleVolunteerRepository(db);
  });
  afterAll(async () => {
    await pool.end();
  });
  beforeEach(async () => {
    await db.delete(volunteersTable);
  });

  it('round-trips an aggregate through Postgres', async () => {
    const v = makeVolunteer(USER_A, {
      skills: [VolunteerSkill.Medical, VolunteerSkill.Driving],
    });
    await repo.save(v);
    const found = await repo.findById(v.id);
    expect(found?.name).toBe('Test Volunteer');
    expect(found?.userId).toBe(USER_A);
    expect(found?.skills).toEqual([
      VolunteerSkill.Medical,
      VolunteerSkill.Driving,
    ]);
    expect(found?.status).toBe(VolunteerStatus.Available);
    expect(found?.consentAccepted).toBe(true);
  });

  it('enforces unique (emergency_id, user_id) — upsert updates profile', async () => {
    const v1 = makeVolunteer(USER_A);
    await repo.save(v1);

    // Save again with different name — simulates upsert after updateProfile
    v1.updateProfile({
      name: 'Updated Name',
      contact: 'new@example.com',
      municipality: 'Madrid',
      skills: [VolunteerSkill.Cooking],
      availability: Availability.Flexible,
      vehicle: Vehicle.None,
    });
    await repo.save(v1);

    const rows = await db.select().from(volunteersTable);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Updated Name');
  });

  it('findByUserAndEmergency returns null when not found', async () => {
    const result = await repo.findByUserAndEmergency(USER_A, EM);
    expect(result).toBeNull();
  });

  it('findByUserAndEmergency returns existing volunteer', async () => {
    const v = makeVolunteer(USER_A);
    await repo.save(v);
    const found = await repo.findByUserAndEmergency(USER_A, EM);
    expect(found?.userId).toBe(USER_A);
  });

  it('findByEmergency returns all volunteers for an emergency', async () => {
    await repo.save(makeVolunteer(USER_A));
    await repo.save(makeVolunteer(USER_B));
    const result = await repo.findByEmergency(EM);
    expect(result).toHaveLength(2);
  });

  it('findByEmergency filters by skill', async () => {
    const vMedical = makeVolunteer(USER_A, {
      skills: [VolunteerSkill.Medical],
    });
    const vCooking = makeVolunteer(USER_B, {
      skills: [VolunteerSkill.Cooking],
    });
    await repo.save(vMedical);
    await repo.save(vCooking);
    const result = await repo.findByEmergency(EM, {
      skill: VolunteerSkill.Medical,
    });
    expect(result).toHaveLength(1);
    expect(result[0].skills).toContain(VolunteerSkill.Medical);
  });

  it('findByEmergency filters by status', async () => {
    const vAvailable = makeVolunteer(USER_A);
    const vAssigned = makeVolunteer(USER_B);
    vAssigned.changeStatus(VolunteerStatus.Assigned);
    await repo.save(vAvailable);
    await repo.save(vAssigned);
    const result = await repo.findByEmergency(EM, {
      status: VolunteerStatus.Assigned,
    });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(VolunteerStatus.Assigned);
  });

  it('save updates status correctly', async () => {
    const v = makeVolunteer(USER_A);
    await repo.save(v);
    v.changeStatus(VolunteerStatus.Inactive);
    await repo.save(v);
    const found = await repo.findById(v.id);
    expect(found?.status).toBe(VolunteerStatus.Inactive);
  });
});
