import { OrganizationMemberRepository } from '../domain/ports/organization-member.repository';
import { Organization } from '../domain/organization';
import { InMemoryOrganizationRepository } from './in-memory-organization.repository';
import { OrganizationId } from '../domain/organization-id';

export class InMemoryOrganizationMemberRepository implements OrganizationMemberRepository {
  // key: `orgId:userId`
  private store = new Set<string>();

  constructor(private readonly orgRepo: InMemoryOrganizationRepository) {}

  async add(organizationId: string, userId: string): Promise<void> {
    this.store.add(`${organizationId}:${userId}`);
  }

  async listOrganizationsOfUser(userId: string): Promise<Organization[]> {
    const orgIds: string[] = [];
    for (const key of this.store) {
      const [orgId, uid] = key.split(':');
      if (uid === userId) orgIds.push(orgId);
    }
    const results: Organization[] = [];
    for (const orgId of orgIds) {
      const org = await this.orgRepo.findById(OrganizationId.fromString(orgId));
      if (org) results.push(org);
    }
    return results;
  }

  async isMember(organizationId: string, userId: string): Promise<boolean> {
    return this.store.has(`${organizationId}:${userId}`);
  }
}
