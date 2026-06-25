import { ResourceRepository } from '../domain/ports/resource.repository';
import { EventBus } from '../domain/ports/event-bus';
import { ResourceId } from '../domain/resource-id';
import { ResourceNotFoundError } from './resource-not-found.error';

export interface PublishResourceCommand {
  resourceId: string;
}

export class PublishResource {
  constructor(
    private readonly repo: ResourceRepository,
    private readonly bus: EventBus,
  ) {}

  async execute(cmd: PublishResourceCommand): Promise<void> {
    const resource = await this.repo.findById(ResourceId.fromString(cmd.resourceId));
    if (!resource) throw new ResourceNotFoundError(cmd.resourceId);
    resource.publish();
    await this.repo.save(resource);
    await this.bus.publish(resource.pullDomainEvents());
  }
}
