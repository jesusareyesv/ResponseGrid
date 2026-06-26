import {
  AccreditationRepository,
  ListAccreditationsFilter,
} from '../domain/ports/accreditation.repository';
import { Accreditation } from '../domain/accreditation';

/**
 * In-memory implementation of AccreditationRepository for unit tests.
 */
export class InMemoryAccreditationRepository implements AccreditationRepository {
  private readonly store = new Map<string, Accreditation>();

  save(accreditation: Accreditation): Promise<void> {
    this.store.set(accreditation.id, accreditation);
    return Promise.resolve();
  }

  findById(id: string): Promise<Accreditation | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  delete(id: string): Promise<void> {
    this.store.delete(id);
    return Promise.resolve();
  }

  list(filter: ListAccreditationsFilter): Promise<Accreditation[]> {
    let results = Array.from(this.store.values());
    if (filter.organizationId) {
      results = results.filter(
        (a) => a.organizationId === filter.organizationId,
      );
    }
    if (filter.emergencyId) {
      results = results.filter(
        (a) => a.scope.isGlobal || a.scope.emergencyId === filter.emergencyId,
      );
    }
    return Promise.resolve(results);
  }

  isAccredited(organizationId: string, emergencyId: string): Promise<boolean> {
    for (const a of this.store.values()) {
      if (
        a.organizationId === organizationId &&
        (a.scope.isGlobal || a.scope.emergencyId === emergencyId)
      ) {
        return Promise.resolve(true);
      }
    }
    return Promise.resolve(false);
  }
}
