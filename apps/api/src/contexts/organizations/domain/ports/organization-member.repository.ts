import { Organization } from '../organization';

export const ORGANIZATION_MEMBER_REPOSITORY = Symbol('OrganizationMemberRepository');

export interface OrganizationMemberRepository {
  add(organizationId: string, userId: string): Promise<void>;
  listOrganizationsOfUser(userId: string): Promise<Organization[]>;
  isMember(organizationId: string, userId: string): Promise<boolean>;
}
