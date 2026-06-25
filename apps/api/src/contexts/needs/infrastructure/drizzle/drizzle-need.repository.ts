import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { Db } from '../../../../shared/db';
import { needsTable, needItemsTable } from './schema';
import { NeedRepository } from '../../domain/ports/need.repository';
import { Need, NeedSnapshot } from '../../domain/need';
import { NeedId } from '../../domain/need-id';
import { EmergencyId } from '../../domain/emergency-id';
import { Priority, NeedCategory, NeedStatus } from '../../domain/need-enums';
import { NeedItemSnapshot } from '../../domain/need-item';

type NeedsRow = typeof needsTable.$inferSelect;
type ItemsRow = typeof needItemsTable.$inferSelect;

function rowToSnapshot(row: NeedsRow, items: ItemsRow[]): NeedSnapshot {
  return {
    id: row.id,
    emergencyId: row.emergencyId,
    title: row.title,
    description: row.description ?? null,
    location: {
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
    },
    priority: row.priority as Priority,
    requesterUserId: row.requesterUserId,
    requesterOrganizationId: row.requesterOrganizationId ?? null,
    managingOrganizationId: row.managingOrganizationId ?? null,
    items: items.map(
      (i): NeedItemSnapshot => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit ?? null,
        category: i.category as NeedCategory,
      }),
    ),
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
        description: s.description,
        address: s.location.address,
        latitude: s.location.latitude,
        longitude: s.location.longitude,
        priority: s.priority,
        requesterUserId: s.requesterUserId,
        requesterOrganizationId: s.requesterOrganizationId,
        managingOrganizationId: s.managingOrganizationId,
        status: s.status,
        createdAt: s.createdAt,
      })
      .onConflictDoUpdate({
        target: needsTable.id,
        set: {
          status: s.status,
          managingOrganizationId: s.managingOrganizationId,
        },
      });

    // Sync items: delete existing then re-insert (clean replace)
    await this.db.delete(needItemsTable).where(eq(needItemsTable.needId, s.id));

    if (s.items.length > 0) {
      await this.db.insert(needItemsTable).values(
        s.items.map((item) => ({
          id: randomUUID(),
          needId: s.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
        })),
      );
    }
  }

  async findById(id: NeedId): Promise<Need | null> {
    const rows = await this.db.select().from(needsTable).where(eq(needsTable.id, id.value));
    if (!rows[0]) return null;
    const items = await this.db
      .select()
      .from(needItemsTable)
      .where(eq(needItemsTable.needId, id.value));
    return Need.fromSnapshot(rowToSnapshot(rows[0], items));
  }

  async findValidatedByEmergency(emergencyId: EmergencyId): Promise<Need[]> {
    return this._findByEmergencyAndStatus(emergencyId, NeedStatus.Validated);
  }

  async findPendingByEmergency(emergencyId: EmergencyId): Promise<Need[]> {
    return this._findByEmergencyAndStatus(emergencyId, NeedStatus.Pending);
  }

  private async _findByEmergencyAndStatus(
    emergencyId: EmergencyId,
    status: NeedStatus,
  ): Promise<Need[]> {
    const rows = await this.db
      .select()
      .from(needsTable)
      .where(
        and(
          eq(needsTable.emergencyId, emergencyId.value),
          eq(needsTable.status, status),
        ),
      );

    if (rows.length === 0) return [];

    const needIds = rows.map((r) => r.id);

    // Load all items for these needs in one query
    const allItems = await this.db
      .select()
      .from(needItemsTable)
      .where(
        needIds.length === 1
          ? eq(needItemsTable.needId, needIds[0])
          : // For multiple needs we use multiple fetches grouped in JS (avoids complex OR/IN syntax drift)
            eq(needItemsTable.needId, needIds[0]),
      );

    // If multiple needs, load items per need individually for simplicity
    if (needIds.length > 1) {
      const results: Need[] = [];
      for (const row of rows) {
        const items = await this.db
          .select()
          .from(needItemsTable)
          .where(eq(needItemsTable.needId, row.id));
        results.push(Need.fromSnapshot(rowToSnapshot(row, items)));
      }
      return results;
    }

    return rows.map((r) =>
      Need.fromSnapshot(rowToSnapshot(r, allItems.filter((i) => i.needId === r.id))),
    );
  }
}
