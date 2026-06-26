/**
 * Port used by the authorization layer to resolve which emergency owns a given volunteer.
 *
 * Infrastructure note: this port is intentionally placed in the identity context because
 * authorization (guard enforcement) lives there. The adapter reads the `volunteers` table
 * from the volunteers context schema — an accepted cross-context infra coupling kept
 * explicitly in the adapter so the domain stays clean.
 */
export const VOLUNTEER_EMERGENCY_LOOKUP = Symbol('VolunteerEmergencyLookup');

export interface VolunteerEmergencyLookup {
  /** Returns the emergencyId that owns the volunteer, or null when the volunteer does not exist. */
  findEmergencyId(volunteerId: string): Promise<string | null>;
}
