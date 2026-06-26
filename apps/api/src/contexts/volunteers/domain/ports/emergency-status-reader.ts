/**
 * Port — volunteers context.
 *
 * Re-declares the same interface as the emergencies domain port so this context
 * stays independent (no import across bounded context domain layers).
 * The Drizzle adapter is shared in infrastructure (DRY at the infra layer).
 */
export const VOLUNTEER_EMERGENCY_STATUS_READER = Symbol(
  'VolunteerEmergencyStatusReader',
);

export interface VolunteerEmergencyStatusReader {
  /** Returns the current status string, or null when the emergency does not exist. */
  getStatus(emergencyId: string): Promise<string | null>;
}
