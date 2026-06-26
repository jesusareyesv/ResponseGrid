/**
 * Port used by the authorization layer to resolve which emergency owns a given resource.
 *
 * Infrastructure note: this port is intentionally placed in the identity context because
 * authorization (guard enforcement) lives there. The adapter reads the `resources` table
 * from the resources context schema — an accepted cross-context infra coupling kept
 * explicitly in the adapter so the domain stays clean.
 */
export const RESOURCE_EMERGENCY_LOOKUP = Symbol('ResourceEmergencyLookup');

export interface ResourceEmergencyLookup {
  /** Returns the emergencyId that owns the resource, or null when the resource does not exist. */
  findEmergencyId(resourceId: string): Promise<string | null>;
}
