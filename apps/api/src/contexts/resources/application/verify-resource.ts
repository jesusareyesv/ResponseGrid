import { ResourceRepository } from '../domain/ports/resource.repository';
import { EventBus } from '../domain/ports/event-bus';
import { ResourceId } from '../domain/resource-id';
import { VerificationLevel } from '../domain/resource-enums';
import { ResourceNotFoundError } from './resource-not-found.error';

export interface VerifyResourceCommand {
  resourceId: string;
  level: VerificationLevel;
  coordinatorId: string;
}

export class VerifyResource {
  constructor(
    private readonly repo: ResourceRepository,
    private readonly bus: EventBus,
  ) {}

  async execute(cmd: VerifyResourceCommand): Promise<void> {
    const resource = await this.repo.findById(ResourceId.fromString(cmd.resourceId));
    if (!resource) throw new ResourceNotFoundError(cmd.resourceId);
    resource.verify(cmd.level, cmd.coordinatorId);
    await this.repo.save(resource);
    await this.bus.publish(resource.pullDomainEvents());
  }
}
