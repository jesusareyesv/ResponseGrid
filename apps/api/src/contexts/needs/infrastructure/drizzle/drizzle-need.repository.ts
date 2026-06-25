import { and, eq } from 'drizzle-orm';
import { Db } from '../../../../shared/db';
import { needsTable } from './schema';
import { NeedRepository } from '../../domain/ports/need.repository';
import { Need, NeedSnapshot } from '../../domain/need';
import { NeedId } from '../../domain/need-id';
import { EmergencyId } from '../../domain/emergency-id';
import { NeedCategory, Priority, NeedStatus } from '../../domain/need-enums';

type Row = typeof needsTable.$inferSelect;

function rowToSnapshot(row: Row): NeedSnapshot {
  return {
    id: row.id,
    emergencyId: row.emergencyId,
    title: row.title,
    category: row.category as NeedCategory,
    priority: row.priority as Priority,
    requestedQuantity: row.requestedQuantity ?? null,
    unit: row.unit ?? null,
    status: row.status as NeedStatus,
    createdAt: row.createdAt,
  };
}

export class DrizzleNeedRepository implements NeedRepository {
  constructor(private readonly db: Db) {}

  async save(need: Need): Promise<void> {
    const s = need.toSnapshot();
    await this.db
      .insert(needsTable)
      .values({
        id: s.id,
        emergencyId: s.emergencyId,
        title: s.title,
        category: s.category,
        priority: s.priority,
        requestedQuantity: s.requestedQuantity,
        unit: s.unit,
        status: s.status,
        createdAt: s.createdAt,
      })
      .onConflictDoUpdate({
        target: needsTable.id,
        set: { status: s.status },
      });
  }

  async findById(id: NeedId): Promise<Need | null> {
    const rows = await this.db.select().from(needsTable).where(eq(needsTable.id, id.value));
    return rows[0] ? Need.fromSnapshot(rowToSnapshot(rows[0])) : null;
  }

  async findValidatedByEmergency(emergencyId: EmergencyId): Promise<Need[]> {
    const rows = await this.db
      .select()
      .from(needsTable)
      .where(
        and(
          eq(needsTable.emergencyId, emergencyId.value),
          eq(needsTable.status, NeedStatus.Validated),
        ),
      );
    return rows.map((r) => Need.fromSnapshot(rowToSnapshot(r)));
  }

  async findPendingByEmergency(emergencyId: EmergencyId): Promise<Need[]> {
    const rows = await this.db
      .select()
      .from(needsTable)
      .where(
        and(
          eq(needsTable.emergencyId, emergencyId.value),
          eq(needsTable.status, NeedStatus.Pending),
        ),
      );
    return rows.map((r) => Need.fromSnapshot(rowToSnapshot(r)));
  }
}
