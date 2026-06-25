import { NeedRepository } from '../domain/ports/need.repository';
import { EventBus } from '../domain/ports/event-bus';
import { NeedId } from '../domain/need-id';
import { NeedNotFoundError } from './need-not-found.error';

export interface ValidateNeedCommand {
  needId: string;
}

export class ValidateNeed {
  constructor(
    private readonly repo: NeedRepository,
    private readonly bus: EventBus,
  ) {}

  async execute(cmd: ValidateNeedCommand): Promise<void> {
    const need = await this.repo.findById(NeedId.fromString(cmd.needId));
    if (!need) throw new NeedNotFoundError(cmd.needId);
    need.validate();
    await this.repo.save(need);
    await this.bus.publish(need.pullDomainEvents());
  }
}
