import { ResourceRepository } from '../domain/ports/resource.repository';
import { Resource } from '../domain/resource';
import { ResourceId } from '../domain/resource-id';
import { EmergencyId } from '../../../shared/domain/emergency-id';
import { VerificationLevel, PublicStatus } from '../domain/resource-enums';

export class InMemoryResourceRepository implements ResourceRepository {
  private store = new Map<string, ReturnType<Resource['toSnapshot']>>();

  save(resource: Resource): Promise<void> {
    this.store.set(resource.id.value, resource.toSnapshot());
    return Promise.resolve();
  }

  findById(id: ResourceId): Promise<Resource | null> {
    const snap = this.store.get(id.value);
    return Promise.resolve(snap ? Resource.fromSnapshot(snap) : null);
  }

  findPendingByEmergency(emergencyId: EmergencyId): Promise<Resource[]> {
    const result = [...this.store.values()]
      .filter(
        (s) =>
          s.emergencyId === emergencyId.value &&
          s.verificationLevel === VerificationLevel.Unverified,
      )
      .map((s) => Resource.fromSnapshot(s));
    return Promise.resolve(result);
  }

  findActiveByEmergency(emergencyId: EmergencyId): Promise<Resource[]> {
    const result = [...this.store.values()]
      .filter(
        (s) =>
          s.emergencyId === emergencyId.value &&
          s.publicStatus === PublicStatus.Active,
      )
      .map((s) => Resource.fromSnapshot(s));
    return Promise.resolve(result);
  }

  countByEmergencyGroupedByPublicStatus(
    emergencyId: EmergencyId,
  ): Promise<Record<PublicStatus, number>> {
    const result: Record<PublicStatus, number> = {
      [PublicStatus.Hidden]: 0,
      [PublicStatus.Active]: 0,
      [PublicStatus.Saturated]: 0,
      [PublicStatus.Paused]: 0,
      [PublicStatus.Closed]: 0,
    };
    for (const snap of this.store.values()) {
      if (snap.emergencyId === emergencyId.value) {
        const status = snap.publicStatus;
        if (status in result) {
          result[status]++;
        }
      }
    }
    return Promise.resolve(result);
  }

  findByOwnerAndEmergency(
    ownerUserId: string,
    emergencyId: EmergencyId,
  ): Promise<Resource[]> {
    const result = [...this.store.values()]
      .filter(
        (s) =>
          s.emergencyId === emergencyId.value && s.ownerUserId === ownerUserId,
      )
      .map((s) => Resource.fromSnapshot(s));
    return Promise.resolve(result);
  }

  findVisibleByEmergency(emergencyId: EmergencyId): Promise<Resource[]> {
    const visible = new Set<PublicStatus>([
      PublicStatus.Active,
      PublicStatus.Saturated,
      PublicStatus.Paused,
    ]);
    const result = [...this.store.values()]
      .filter(
        (s) =>
          s.emergencyId === emergencyId.value && visible.has(s.publicStatus),
      )
      .map((s) => Resource.fromSnapshot(s));
    return Promise.resolve(result);
  }

  findByExternal(sourceName: string, externalId: string): Promise<Resource | null> {
    const snap = [...this.store.values()].find(
      (s) =>
        s.provenance?.sourceName === sourceName &&
        s.provenance?.externalId === externalId,
    );
    return Promise.resolve(snap ? Resource.fromSnapshot(snap) : null);
  }
}
