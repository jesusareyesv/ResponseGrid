/**
 * Output port used by resource use cases that need to verify whether a user
 * is a coordinator of a given emergency.
 *
 * Infrastructure note: the adapter reads the `memberships` table from the
 * identity context — an accepted cross-context infra coupling kept in the
 * adapter layer so the domain stays clean.
 */
export const RESOURCE_MEMBERSHIP_READER = Symbol('ResourceMembershipReader');

export interface ResourceMembershipReader {
  isCoordinator(userId: string, emergencyId: string): Promise<boolean>;
}
