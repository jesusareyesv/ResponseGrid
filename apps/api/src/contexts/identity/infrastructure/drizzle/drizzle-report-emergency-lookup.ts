import { eq } from 'drizzle-orm';
import { Db } from '../../../../shared/db';
import { ReportEmergencyLookup } from '../../domain/ports/report-emergency-lookup';
// Cross-context infra coupling: identity reads the reports table only for authorization.
// The dependency is intentional and documented in the port interface.
import { reportsTable } from '../../../reports/infrastructure/drizzle/schema';

export class DrizzleReportEmergencyLookup implements ReportEmergencyLookup {
  constructor(private readonly db: Db) {}

  async findEmergencyId(reportId: string): Promise<string | null> {
    const rows = await this.db
      .select({ emergencyId: reportsTable.emergencyId })
      .from(reportsTable)
      .where(eq(reportsTable.id, reportId))
      .limit(1);
    return rows[0]?.emergencyId ?? null;
  }
}
