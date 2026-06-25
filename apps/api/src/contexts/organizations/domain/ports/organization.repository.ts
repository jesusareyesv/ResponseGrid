import { Organization } from '../organization';
import { OrganizationId } from '../organization-id';

export const ORGANIZATION_REPOSITORY = Symbol('OrganizationRepository');

export interface OrganizationRepository {
  save(organization: Organization): Promise<void>;
  findById(id: OrganizationId): Promise<Organization | null>;
  listAll(): Promise<Organization[]>;
}
