import { OrganizationMemberRepository } from '../domain/ports/organization-member.repository';
import { OrganizationView } from './organization-view';

export interface ListMyOrganizationsQuery {
  userId: string;
}

export class ListMyOrganizations {
  constructor(private readonly memberRepo: OrganizationMemberRepository) {}

  async execute(query: ListMyOrganizationsQuery): Promise<OrganizationView[]> {
    const orgs = await this.memberRepo.listOrganizationsOfUser(query.userId);
    return orgs.map((org) => ({
      id: org.id.value,
      name: org.name,
      type: org.type,
      verificationLevel: org.verificationLevel,
    }));
  }
}
