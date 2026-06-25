import { OrganizationRepository } from '../domain/ports/organization.repository';
import { OrganizationView } from './organization-view';

export class ListOrganizations {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async execute(): Promise<OrganizationView[]> {
    const orgs = await this.orgRepo.listAll();
    return orgs.map((org) => ({
      id: org.id.value,
      name: org.name,
      type: org.type,
      verificationLevel: org.verificationLevel,
    }));
  }
}
