import { NeedRepository } from '../domain/ports/need.repository';
import { EmergencyId } from '../domain/emergency-id';
import { NeedView, toNeedView } from './need-view';

export class GetPublicNeeds {
  constructor(private readonly repo: NeedRepository) {}

  async execute(q: { emergencyId: string }): Promise<NeedView[]> {
    const validated = await this.repo.findValidatedByEmergency(EmergencyId.fromString(q.emergencyId));
    return validated.map(toNeedView);
  }
}
