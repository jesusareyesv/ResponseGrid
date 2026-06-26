import { AccreditationRepository } from '../domain/ports/accreditation.repository';
import { Accreditation } from '../domain/accreditation';

export interface ListAccreditationsQuery {
  organizationId?: string;
  emergencyId?: string;
}

export interface AccreditationView {
  id: string;
  organizationId: string;
  scope: 'global' | { emergencyId: string };
  grantedByUserId: string;
  grantedAt: string;
  evidence: string | null;
}

function toView(a: Accreditation): AccreditationView {
  const plain = a.scope.toPlain();
  return {
    id: a.id,
    organizationId: a.organizationId,
    scope:
      plain.kind === 'global' ? 'global' : { emergencyId: plain.emergencyId },
    grantedByUserId: a.grantedByUserId,
    grantedAt: a.grantedAt.toISOString(),
    evidence: a.evidence,
  };
}

export class ListAccreditations {
  constructor(private readonly repo: AccreditationRepository) {}

  async execute(q: ListAccreditationsQuery): Promise<AccreditationView[]> {
    const results = await this.repo.list({
      ...(q.organizationId !== undefined && {
        organizationId: q.organizationId,
      }),
      ...(q.emergencyId !== undefined && { emergencyId: q.emergencyId }),
    });
    return results.map(toView);
  }
}
