import { NeedRepository } from '../domain/ports/need.repository';
import { NeedId } from '../domain/need-id';
import { NeedNotFoundError } from './need-not-found.error';

export interface AssignNeedManagerCommand {
  needId: string;
  organizationId: string;
}

export class AssignNeedManager {
  constructor(private readonly repo: NeedRepository) {}

  async execute(cmd: AssignNeedManagerCommand): Promise<void> {
    const need = await this.repo.findById(NeedId.fromString(cmd.needId));
    if (!need) throw new NeedNotFoundError(cmd.needId);
    need.assignManager(cmd.organizationId);
    await this.repo.save(need);
  }
}
