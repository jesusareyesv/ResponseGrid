import { Module } from '@nestjs/common';
import { DB, DatabaseModule } from '../../../shared/database.module';
import { Db } from '../../../shared/db';
import { IdentityModule } from '../../identity/infrastructure/identity.module';
import { ORGANIZATION_REPOSITORY, OrganizationRepository } from '../domain/ports/organization.repository';
import { ORGANIZATION_MEMBER_REPOSITORY, OrganizationMemberRepository } from '../domain/ports/organization-member.repository';
import { USER_DIRECTORY, UserDirectory } from '../domain/ports/user-directory';
import { DrizzleOrganizationRepository } from './drizzle/drizzle-organization.repository';
import { DrizzleOrganizationMemberRepository } from './drizzle/drizzle-organization-member.repository';
import { DrizzleUserDirectory } from './drizzle/drizzle-user-directory';
import { CreateOrganization } from '../application/create-organization';
import { ListMyOrganizations } from '../application/list-my-organizations';
import { ListOrganizations } from '../application/list-organizations';
import { AddOrganizationMember } from '../application/add-organization-member';
import { RemoveOrganizationMember } from '../application/remove-organization-member';
import { ListOrganizationMembers } from '../application/list-organization-members';
import { OrganizationsController } from './http/organizations.controller';

const organizationRepositoryProvider = {
  provide: ORGANIZATION_REPOSITORY,
  inject: [DB],
  useFactory: (db: Db): OrganizationRepository => new DrizzleOrganizationRepository(db),
};

const organizationMemberRepositoryProvider = {
  provide: ORGANIZATION_MEMBER_REPOSITORY,
  inject: [DB],
  useFactory: (db: Db): OrganizationMemberRepository =>
    new DrizzleOrganizationMemberRepository(db),
};

const userDirectoryProvider = {
  provide: USER_DIRECTORY,
  inject: [DB],
  useFactory: (db: Db): UserDirectory => new DrizzleUserDirectory(db),
};

const createOrganizationProvider = {
  provide: CreateOrganization,
  inject: [ORGANIZATION_REPOSITORY, ORGANIZATION_MEMBER_REPOSITORY],
  useFactory: (
    orgRepo: OrganizationRepository,
    memberRepo: OrganizationMemberRepository,
  ) => new CreateOrganization(orgRepo, memberRepo),
};

const listMyOrganizationsProvider = {
  provide: ListMyOrganizations,
  inject: [ORGANIZATION_MEMBER_REPOSITORY],
  useFactory: (memberRepo: OrganizationMemberRepository) => new ListMyOrganizations(memberRepo),
};

const listOrganizationsProvider = {
  provide: ListOrganizations,
  inject: [ORGANIZATION_REPOSITORY],
  useFactory: (orgRepo: OrganizationRepository) => new ListOrganizations(orgRepo),
};

const addOrganizationMemberProvider = {
  provide: AddOrganizationMember,
  inject: [ORGANIZATION_MEMBER_REPOSITORY, USER_DIRECTORY],
  useFactory: (memberRepo: OrganizationMemberRepository, userDirectory: UserDirectory) =>
    new AddOrganizationMember(memberRepo, userDirectory),
};

const removeOrganizationMemberProvider = {
  provide: RemoveOrganizationMember,
  inject: [ORGANIZATION_MEMBER_REPOSITORY],
  useFactory: (memberRepo: OrganizationMemberRepository) =>
    new RemoveOrganizationMember(memberRepo),
};

const listOrganizationMembersProvider = {
  provide: ListOrganizationMembers,
  inject: [ORGANIZATION_MEMBER_REPOSITORY, USER_DIRECTORY],
  useFactory: (memberRepo: OrganizationMemberRepository, userDirectory: UserDirectory) =>
    new ListOrganizationMembers(memberRepo, userDirectory),
};

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [OrganizationsController],
  providers: [
    organizationRepositoryProvider,
    organizationMemberRepositoryProvider,
    userDirectoryProvider,
    createOrganizationProvider,
    listMyOrganizationsProvider,
    listOrganizationsProvider,
    addOrganizationMemberProvider,
    removeOrganizationMemberProvider,
    listOrganizationMembersProvider,
  ],
})
export class OrganizationsModule {}
