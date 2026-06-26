import { and, eq } from 'drizzle-orm';
import { Db } from '../../../../shared/db';
import { membershipsTable } from '../../../identity/infrastructure/drizzle/schema';
import { ResourceMembershipReader } from '../../domain/ports/membership-reader';

export class DrizzleMembershipReader implements ResourceMembershipReader {
  constructor(private readonly db: Db) {}

  async isCoordinator(userId: string, emergencyId: string): Promise<boolean> {
    const rows = await this.db
      .select()
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.userId, userId),
          eq(membershipsTable.emergencyId, emergencyId),
          eq(membershipsTable.role, 'coordinator'),
        ),
      );
    return rows.length > 0;
  }
}
