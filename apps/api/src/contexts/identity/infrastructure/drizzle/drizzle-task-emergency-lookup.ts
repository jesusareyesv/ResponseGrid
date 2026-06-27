import { Db } from '../../../../shared/db';
import { TaskEmergencyLookup } from '../../domain/ports/task-emergency-lookup';
// Cross-context infra coupling: identity reads the tasks table only for authorization.
// The dependency is intentional and documented in the port interface.
import { tasksTable } from '../../../volunteers/infrastructure/drizzle/task-schema';
import { findEmergencyIdByEntity } from './drizzle-emergency-lookup.factory';

export class DrizzleTaskEmergencyLookup implements TaskEmergencyLookup {
  constructor(private readonly db: Db) {}

  findEmergencyId(taskId: string): Promise<string | null> {
    return findEmergencyIdByEntity(
      this.db,
      tasksTable,
      tasksTable.id,
      tasksTable.emergencyId,
      taskId,
    );
  }
}
