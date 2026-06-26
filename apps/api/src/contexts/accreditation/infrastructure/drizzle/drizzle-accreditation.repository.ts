import { and, eq, isNull, or } from 'drizzle-orm';
import { Db } from '../../../../shared/db';
import { accreditationsTable } from './schema';
import {
  AccreditationRepository,
  ListAccreditationsFilter,
} from '../../domain/ports/accreditation.repository';
import {
  Accreditation,
  AccreditationSnapshot,
} from '../../domain/accreditation';

type Row = typeof accreditationsTable.$inferSelect;

function rowToSnapshot(row: Row): AccreditationSnapshot {
  return {
    id: row.id,
    organizationId: row.organizationId,
    scope:
      row.scopeEmergencyId === null
        ? { kind: 'global' }
        : { kind: 'emergency', emergencyId: row.scopeEmergencyId },
    grantedByUserId: row.grantedByUserId,
    grantedAt: row.grantedAt,
    evidence: row.evidence ?? null,
  };
}

export class DrizzleAccreditationRepository implements AccreditationRepository {
  constructor(private readonly db: Db) {}

  async save(accreditation: Accreditation): Promise<void> {
    const s = accreditation.toSnapshot();
    const scopeEmergencyId =
      s.scope.kind === 'emergency' ? s.scope.emergencyId : null;
    await this.db
      .insert(accreditationsTable)
      .values({
        id: s.id,
        organizationId: s.organizationId,
        scopeEmergencyId,
        grantedByUserId: s.grantedByUserId,
        grantedAt: s.grantedAt,
        evidence: s.evidence,
      })
      .onConflictDoUpdate({
        target: accreditationsTable.id,
        set: {
          organizationId: s.organizationId,
          scopeEmergencyId,
          grantedByUserId: s.grantedByUserId,
          grantedAt: s.grantedAt,
          evidence: s.evidence,
        },
      });
  }

  async findById(id: string): Promise<Accreditation | null> {
    const rows = await this.db
      .select()
      .from(accreditationsTable)
      .where(eq(accreditationsTable.id, id));
    return rows[0] ? Accreditation.fromSnapshot(rowToSnapshot(rows[0])) : null;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(accreditationsTable)
      .where(eq(accreditationsTable.id, id));
  }

  async list(filter: ListAccreditationsFilter): Promise<Accreditation[]> {
    const conditions = [];

    if (filter.organizationId) {
      conditions.push(
        eq(accreditationsTable.organizationId, filter.organizationId),
      );
    }

    if (filter.emergencyId) {
      // When filtering by emergencyId: return global accreditations AND
      // accreditations scoped to that specific emergency.
      conditions.push(
        or(
          isNull(accreditationsTable.scopeEmergencyId),
          eq(accreditationsTable.scopeEmergencyId, filter.emergencyId),
        ),
      );
    }

    const rows =
      conditions.length === 0
        ? await this.db.select().from(accreditationsTable)
        : await this.db
            .select()
            .from(accreditationsTable)
            .where(and(...conditions));

    return rows.map((r) => Accreditation.fromSnapshot(rowToSnapshot(r)));
  }

  async isAccredited(
    organizationId: string,
    emergencyId: string,
  ): Promise<boolean> {
    const rows = await this.db
      .select({ id: accreditationsTable.id })
      .from(accreditationsTable)
      .where(
        and(
          eq(accreditationsTable.organizationId, organizationId),
          or(
            isNull(accreditationsTable.scopeEmergencyId),
            eq(accreditationsTable.scopeEmergencyId, emergencyId),
          ),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }
}
