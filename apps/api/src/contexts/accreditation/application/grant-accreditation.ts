import { randomUUID } from 'node:crypto';
import {
  AccreditationRepository,
  ACCREDITATION_REPOSITORY,
} from '../domain/ports/accreditation.repository';
import { Accreditation } from '../domain/accreditation';
import { AccreditationScope } from '../domain/value-objects/accreditation-scope';

export type GrantAccreditationScope = 'global' | { emergencyId: string };

export interface GrantAccreditationCommand {
  organizationId: string;
  scope: GrantAccreditationScope;
  grantedByUserId: string;
  evidence?: string | null;
}

export { ACCREDITATION_REPOSITORY };

export class GrantAccreditation {
  constructor(private readonly repo: AccreditationRepository) {}

  async execute(cmd: GrantAccreditationCommand): Promise<{ id: string }> {
    const scope =
      cmd.scope === 'global'
        ? AccreditationScope.global()
        : AccreditationScope.forEmergency(cmd.scope.emergencyId);

    const accreditation = Accreditation.grant({
      id: randomUUID(),
      organizationId: cmd.organizationId,
      scope,
      grantedByUserId: cmd.grantedByUserId,
      evidence: cmd.evidence ?? null,
    });

    await this.repo.save(accreditation);
    return { id: accreditation.id };
  }
}
