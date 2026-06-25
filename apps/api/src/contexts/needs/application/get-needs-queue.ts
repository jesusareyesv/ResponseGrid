import { NeedRepository } from '../domain/ports/need.repository';
import { EmergencyId } from '../domain/emergency-id';
import { NeedView, toNeedView } from './need-view';

export class GetNeedsQueue {
  constructor(private readonly repo: NeedRepository) {}

  async execute(q: { emergencyId: string }): Promise<NeedView[]> {
    const pending = await this.repo.findPendingByEmergency(EmergencyId.fromString(q.emergencyId));
    return pending.map(toNeedView);
  }
}
