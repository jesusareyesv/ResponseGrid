import { Resource } from '../resource';
import { ResourceId } from '../resource-id';
import { EmergencyId } from '../../../../shared/domain/emergency-id';
import { PublicStatus } from '../resource-enums';

export const RESOURCE_REPOSITORY = Symbol('ResourceRepository');

export interface ResourceRepository {
  save(resource: Resource): Promise<void>;
  findById(id: ResourceId): Promise<Resource | null>;
  findPendingByEmergency(emergencyId: EmergencyId): Promise<Resource[]>;
  findActiveByEmergency(emergencyId: EmergencyId): Promise<Resource[]>;
  /** Returns a count map for all PublicStatus values for the given emergency. */
  countByEmergencyGroupedByPublicStatus(
    emergencyId: EmergencyId,
  ): Promise<Record<PublicStatus, number>>;
  /** Resources owned by a specific user within an emergency (any status). */
  findByOwnerAndEmergency(
    ownerUserId: string,
    emergencyId: EmergencyId,
  ): Promise<Resource[]>;
  /** Visible public resources: Active, Saturated, Paused (excludes Hidden and Closed). */
  findVisibleByEmergency(emergencyId: EmergencyId): Promise<Resource[]>;
  /** Lookup by external provenance key (sourceName + externalId). Returns null if not found. */
  findByExternal(sourceName: string, externalId: string): Promise<Resource | null>;
}
