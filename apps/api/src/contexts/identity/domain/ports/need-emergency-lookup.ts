/**
 * Port used by the authorization layer to resolve which emergency owns a given need.
 *
 * Infrastructure note: this port is intentionally placed in the identity context because
 * authorization (guard enforcement) lives there. The adapter reads the `needs` table
 * from the needs context schema — an accepted cross-context infra coupling kept
 * explicitly in the adapter so the domain stays clean.
 */
export const NEED_EMERGENCY_LOOKUP = Symbol('NeedEmergencyLookup');

export interface NeedEmergencyLookup {
  /** Returns the emergencyId that owns the need, or null when the need does not exist. */
  findEmergencyId(needId: string): Promise<string | null>;
}
