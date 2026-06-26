import {
  AccreditationScope,
  AccreditationScopeProps,
} from './value-objects/accreditation-scope';

export interface AccreditationSnapshot {
  id: string;
  organizationId: string;
  scope: AccreditationScopeProps;
  grantedByUserId: string;
  grantedAt: Date;
  evidence: string | null;
}

export class Accreditation {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly scope: AccreditationScope,
    public readonly grantedByUserId: string,
    public readonly grantedAt: Date,
    public readonly evidence: string | null,
  ) {}

  static grant(props: {
    id: string;
    organizationId: string;
    scope: AccreditationScope;
    grantedByUserId: string;
    evidence?: string | null;
  }): Accreditation {
    return new Accreditation(
      props.id,
      props.organizationId,
      props.scope,
      props.grantedByUserId,
      new Date(),
      props.evidence ?? null,
    );
  }

  static fromSnapshot(s: AccreditationSnapshot): Accreditation {
    return new Accreditation(
      s.id,
      s.organizationId,
      AccreditationScope.fromProps(s.scope),
      s.grantedByUserId,
      s.grantedAt,
      s.evidence,
    );
  }

  toSnapshot(): AccreditationSnapshot {
    return {
      id: this.id,
      organizationId: this.organizationId,
      scope: this.scope.toPlain(),
      grantedByUserId: this.grantedByUserId,
      grantedAt: this.grantedAt,
      evidence: this.evidence,
    };
  }
}
