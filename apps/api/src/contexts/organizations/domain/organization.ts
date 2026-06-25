import { OrganizationId } from './organization-id';
import { OrganizationType, VerificationLevel } from './organization-enums';

export interface CreateOrganizationProps {
  id: OrganizationId;
  name: string;
  type: OrganizationType;
  taxId: string | null;
  contactEmail: string | null;
}

export interface OrganizationSnapshot {
  id: string;
  name: string;
  type: string;
  taxId: string | null;
  contactEmail: string | null;
  verificationLevel: string;
  createdAt: Date;
}

export class Organization {
  private constructor(
    public readonly id: OrganizationId,
    public readonly name: string,
    public readonly type: OrganizationType,
    public readonly taxId: string | null,
    public readonly contactEmail: string | null,
    public readonly verificationLevel: VerificationLevel,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateOrganizationProps): Organization {
    return new Organization(
      props.id,
      props.name,
      props.type,
      props.taxId,
      props.contactEmail,
      VerificationLevel.Unverified,
      new Date(),
    );
  }

  static fromSnapshot(snap: OrganizationSnapshot): Organization {
    return new Organization(
      OrganizationId.fromString(snap.id),
      snap.name,
      snap.type as OrganizationType,
      snap.taxId,
      snap.contactEmail,
      snap.verificationLevel as VerificationLevel,
      snap.createdAt,
    );
  }

  toSnapshot(): OrganizationSnapshot {
    return {
      id: this.id.value,
      name: this.name,
      type: this.type,
      taxId: this.taxId,
      contactEmail: this.contactEmail,
      verificationLevel: this.verificationLevel,
      createdAt: this.createdAt,
    };
  }
}
