/**
 * Port used by the authorization layer to resolve which emergency owns a given report.
 *
 * Infrastructure note: this port is intentionally placed in the identity context because
 * authorization (guard enforcement) lives there. The adapter reads the `reports` table
 * from the reports context schema — an accepted cross-context infra coupling kept
 * explicitly in the adapter so the domain stays clean.
 */
export const REPORT_EMERGENCY_LOOKUP = Symbol('ReportEmergencyLookup');

export interface ReportEmergencyLookup {
  /** Returns the emergencyId that owns the report, or null when the report does not exist. */
  findEmergencyId(reportId: string): Promise<string | null>;
}
