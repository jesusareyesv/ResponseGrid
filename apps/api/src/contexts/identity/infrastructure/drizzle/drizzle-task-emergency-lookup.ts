import { eq } from 'drizzle-orm';
import { Db } from '../../../../shared/db';
import { TaskEmergencyLookup } from '../../domain/ports/task-emergency-lookup';
// Cross-context infra coupling: identity reads the tasks table only for authorization.
// The dependency is intentional and documented in the port interface.
import { tasksTable } from '../../../volunteers/infrastructure/drizzle/task-schema';

export class DrizzleTaskEmergencyLookup implements TaskEmergencyLookup {
  constructor(private readonly db: Db) {}

  async findEmergencyId(taskId: string): Promise<string | null> {
    const rows = await this.db
      .select({ emergencyId: tasksTable.emergencyId })
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .limit(1);
    return rows[0]?.emergencyId ?? null;
  }
}
