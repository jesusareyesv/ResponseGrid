import { Db } from '../../../../shared/db';
import { ReportEmergencyLookup } from '../../domain/ports/report-emergency-lookup';
// Cross-context infra coupling: identity reads the reports table only for authorization.
// The dependency is intentional and documented in the port interface.
import { reportsTable } from '../../../reports/infrastructure/drizzle/schema';
import { findEmergencyIdByEntity } from './drizzle-emergency-lookup.factory';

export class DrizzleReportEmergencyLookup implements ReportEmergencyLookup {
  constructor(private readonly db: Db) {}

  findEmergencyId(reportId: string): Promise<string | null> {
    return findEmergencyIdByEntity(
      this.db,
      reportsTable,
      reportsTable.id,
      reportsTable.emergencyId,
      reportId,
    );
  }
}
