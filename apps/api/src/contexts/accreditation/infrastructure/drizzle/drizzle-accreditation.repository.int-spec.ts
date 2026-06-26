import { randomUUID } from 'node:crypto';
import { createDb, Db } from '../../../../shared/db';
import { accreditationsTable } from './schema';
import { organizationsTable } from '../../../organizations/infrastructure/drizzle/schema';
import { DrizzleAccreditationRepository } from './drizzle-accreditation.repository';
import { Accreditation } from '../../domain/accreditation';
import { AccreditationScope } from '../../domain/value-objects/accreditation-scope';
import type { Pool } from 'pg';

const URL =
  process.env.DATABASE_URL ??
  'postgres://reliefhub:reliefhub@localhost:5433/reliefhub';

const ORG_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const OTHER_ORG_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const EM_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_EM_ID = '33333333-3333-4333-8333-333333333333';
const ADMIN_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

describe('DrizzleAccreditationRepository (integration)', () => {
  let db: Db;
  let pool: Pool;
  let repo: DrizzleAccreditationRepository;

  beforeAll(async () => {
    ({ db, pool } = createDb(URL));
    repo = new DrizzleAccreditationRepository(db);

    // Seed organizations for FK
    await db
      .insert(organizationsTable)
      .values([
        {
          id: ORG_ID,
          name: 'Cruz Roja',
          type: 'ngo',
          verificationLevel: 'unverified',
          createdAt: new Date(),
        },
        {
          id: OTHER_ORG_ID,
          name: 'Other Org',
          type: 'company',
          verificationLevel: 'unverified',
          createdAt: new Date(),
        },
      ])
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.delete(accreditationsTable);
  });

  it('saves and finds by id', async () => {
    const a = Accreditation.grant({
      id: randomUUID(),
      organizationId: ORG_ID,
      scope: AccreditationScope.global(),
      grantedByUserId: ADMIN_ID,
      evidence: 'UN certified',
    });
    await repo.save(a);
    const found = await repo.findById(a.id);
    expect(found).not.toBeNull();
    expect(found!.organizationId).toBe(ORG_ID);
    expect(found!.scope.isGlobal).toBe(true);
    expect(found!.evidence).toBe('UN certified');
  });

  it('returns null for unknown id', async () => {
    expect(await repo.findById(randomUUID())).toBeNull();
  });

  it('deletes an accreditation', async () => {
    const a = Accreditation.grant({
      id: randomUUID(),
      organizationId: ORG_ID,
      scope: AccreditationScope.global(),
      grantedByUserId: ADMIN_ID,
    });
    await repo.save(a);
    await repo.delete(a.id);
    expect(await repo.findById(a.id)).toBeNull();
  });

  describe('isAccredited', () => {
    it('returns true for global accreditation', async () => {
      const a = Accreditation.grant({
        id: randomUUID(),
        organizationId: ORG_ID,
        scope: AccreditationScope.global(),
        grantedByUserId: ADMIN_ID,
      });
      await repo.save(a);
      expect(await repo.isAccredited(ORG_ID, EM_ID)).toBe(true);
    });

    it('returns true for emergency-scoped accreditation on matching emergency', async () => {
      const a = Accreditation.grant({
        id: randomUUID(),
        organizationId: ORG_ID,
        scope: AccreditationScope.forEmergency(EM_ID),
        grantedByUserId: ADMIN_ID,
      });
      await repo.save(a);
      expect(await repo.isAccredited(ORG_ID, EM_ID)).toBe(true);
    });

    it('returns false for emergency-scoped accreditation on different emergency', async () => {
      const a = Accreditation.grant({
        id: randomUUID(),
        organizationId: ORG_ID,
        scope: AccreditationScope.forEmergency(OTHER_EM_ID),
        grantedByUserId: ADMIN_ID,
      });
      await repo.save(a);
      expect(await repo.isAccredited(ORG_ID, EM_ID)).toBe(false);
    });

    it('returns false for a different organization', async () => {
      const a = Accreditation.grant({
        id: randomUUID(),
        organizationId: ORG_ID,
        scope: AccreditationScope.global(),
        grantedByUserId: ADMIN_ID,
      });
      await repo.save(a);
      expect(await repo.isAccredited(OTHER_ORG_ID, EM_ID)).toBe(false);
    });
  });

  describe('list', () => {
    it('filters by organizationId', async () => {
      await repo.save(
        Accreditation.grant({
          id: randomUUID(),
          organizationId: ORG_ID,
          scope: AccreditationScope.global(),
          grantedByUserId: ADMIN_ID,
        }),
      );
      await repo.save(
        Accreditation.grant({
          id: randomUUID(),
          organizationId: OTHER_ORG_ID,
          scope: AccreditationScope.global(),
          grantedByUserId: ADMIN_ID,
        }),
      );
      const results = await repo.list({ organizationId: ORG_ID });
      expect(results).toHaveLength(1);
      expect(results[0].organizationId).toBe(ORG_ID);
    });

    it('filters by emergencyId returning global + matching', async () => {
      await repo.save(
        Accreditation.grant({
          id: randomUUID(),
          organizationId: ORG_ID,
          scope: AccreditationScope.global(),
          grantedByUserId: ADMIN_ID,
        }),
      );
      await repo.save(
        Accreditation.grant({
          id: randomUUID(),
          organizationId: OTHER_ORG_ID,
          scope: AccreditationScope.forEmergency(EM_ID),
          grantedByUserId: ADMIN_ID,
        }),
      );
      await repo.save(
        Accreditation.grant({
          id: randomUUID(),
          organizationId: OTHER_ORG_ID,
          scope: AccreditationScope.forEmergency(OTHER_EM_ID),
          grantedByUserId: ADMIN_ID,
        }),
      );
      const results = await repo.list({ emergencyId: EM_ID });
      expect(results).toHaveLength(2); // global + EM_ID scoped
    });
  });
});
