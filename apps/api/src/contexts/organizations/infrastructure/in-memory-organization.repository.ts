import { OrganizationRepository } from '../domain/ports/organization.repository';
import { Organization, OrganizationSnapshot } from '../domain/organization';
import { OrganizationId } from '../domain/organization-id';

export class InMemoryOrganizationRepository implements OrganizationRepository {
  private store = new Map<string, OrganizationSnapshot>();

  save(organization: Organization): Promise<void> {
    this.store.set(organization.id.value, organization.toSnapshot());
    return Promise.resolve();
  }

  findById(id: OrganizationId): Promise<Organization | null> {
    const snap = this.store.get(id.value);
    return Promise.resolve(snap ? Organization.fromSnapshot(snap) : null);
  }

  listAll(): Promise<Organization[]> {
    const result = [...this.store.values()].map((snap) =>
      Organization.fromSnapshot(snap),
    );
    return Promise.resolve(result);
  }
}
