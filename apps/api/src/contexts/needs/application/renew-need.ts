import { NeedRepository } from '../domain/ports/need.repository';
import { NeedId } from '../domain/need-id';
import { EmergencyId } from '../../../shared/domain/emergency-id';
import { NeedNotFoundError } from './need-not-found.error';
import { NeedView, toNeedView } from './need-view';

export interface RenewNeedCommand {
  needId: string;
}

export type RenewNeedResult = NeedView;

export class RenewNeed {
  constructor(private readonly repo: NeedRepository) {}

  async execute(cmd: RenewNeedCommand): Promise<RenewNeedResult> {
    const need = await this.repo.findById(NeedId.fromString(cmd.needId));
    if (!need) throw new NeedNotFoundError(cmd.needId);
    need.renew();
    await this.repo.save(need);
    return toNeedView(need);
  }
}

export interface GetExpiredNeedsQuery {
  emergencyId: string;
}

export class GetExpiredNeeds {
  constructor(private readonly repo: NeedRepository) {}

  async execute(q: GetExpiredNeedsQuery): Promise<NeedView[]> {
    const expired = await this.repo.findExpiredByEmergency(
      EmergencyId.fromString(q.emergencyId),
    );
    return expired.map(toNeedView);
  }
}
