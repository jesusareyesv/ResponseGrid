import { ResourceRepository } from '../domain/ports/resource.repository';
import { ResourceMembershipReader } from '../domain/ports/membership-reader';
import { ResourceId } from '../domain/resource-id';
import { PublicStatus } from '../domain/resource-enums';
import { ResourceNotFoundError } from './resource-not-found.error';
import { UnauthorizedStatusChangeError } from './unauthorized-status-change.error';

export interface UpdateResourcePublicStatusCommand {
  resourceId: string;
  targetStatus: PublicStatus;
  requesterUserId: string;
}

export class UpdateResourcePublicStatus {
  constructor(
    private readonly repo: ResourceRepository,
    private readonly membershipReader: ResourceMembershipReader,
  ) {}

  async execute(cmd: UpdateResourcePublicStatusCommand): Promise<void> {
    const resource = await this.repo.findById(
      ResourceId.fromString(cmd.resourceId),
    );
    if (!resource) throw new ResourceNotFoundError(cmd.resourceId);

    const isOwner = resource.ownerUserId === cmd.requesterUserId;

    // Coordinator of the emergency can always change any resource's status.
    // An owner who is also a member of the ownerOrganization satisfies isOwner.
    const isCoordinator = await this.membershipReader.isCoordinator(
      cmd.requesterUserId,
      resource.emergencyId.value,
    );

    if (!isOwner && !isCoordinator) {
      throw new UnauthorizedStatusChangeError();
    }

    resource.changePublicStatus(cmd.targetStatus);
    await this.repo.save(resource);
  }
}
