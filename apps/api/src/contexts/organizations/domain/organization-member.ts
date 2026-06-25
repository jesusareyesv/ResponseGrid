export interface OrganizationMemberSnapshot {
  organizationId: string;
  userId: string;
}

export class OrganizationMember {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
  ) {}

  static create(organizationId: string, userId: string): OrganizationMember {
    return new OrganizationMember(organizationId, userId);
  }

  static fromSnapshot(snap: OrganizationMemberSnapshot): OrganizationMember {
    return new OrganizationMember(snap.organizationId, snap.userId);
  }

  toSnapshot(): OrganizationMemberSnapshot {
    return { organizationId: this.organizationId, userId: this.userId };
  }
}
