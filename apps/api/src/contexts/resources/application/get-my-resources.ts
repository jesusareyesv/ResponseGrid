import { ResourceRepository } from '../domain/ports/resource.repository';
import { EmergencyId } from '../../../shared/domain/emergency-id';
import { ResourceView, toResourceView } from './resource-view';

export class GetMyResources {
  constructor(private readonly repo: ResourceRepository) {}

  async execute(q: {
    emergencyId: string;
    userId: string;
  }): Promise<ResourceView[]> {
    const resources = await this.repo.findByOwnerAndEmergency(
      q.userId,
      EmergencyId.fromString(q.emergencyId),
    );
    return resources.map(toResourceView);
  }
}
