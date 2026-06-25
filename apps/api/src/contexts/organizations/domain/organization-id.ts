import { randomUUID } from 'node:crypto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class OrganizationId {
  private constructor(public readonly value: string) {}

  static create(): OrganizationId {
    return new OrganizationId(randomUUID());
  }

  static fromString(s: string): OrganizationId {
    if (!UUID_RE.test(s)) throw new Error(`Invalid OrganizationId: ${s}`);
    return new OrganizationId(s);
  }

  equals(o: OrganizationId): boolean {
    return this.value === o.value;
  }
}
