import { OrganizationRepository } from '../domain/ports/organization.repository';
import { Organization, OrganizationSnapshot } from '../domain/organization';
import { OrganizationId } from '../domain/organization-id';

export class InMemoryOrganizationRepository implements OrganizationRepository {
  private store = new Map<string, OrganizationSnapshot>();

  async save(organization: Organization): Promise<void> {
    this.store.set(organization.id.value, organization.toSnapshot());
  }

  async findById(id: OrganizationId): Promise<Organization | null> {
    const snap = this.store.get(id.value);
    return snap ? Organization.fromSnapshot(snap) : null;
  }

  async listAll(): Promise<Organization[]> {
    return [...this.store.values()].map((snap) => Organization.fromSnapshot(snap));
  }
}
