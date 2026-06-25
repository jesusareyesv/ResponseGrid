import { randomUUID } from 'node:crypto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class EmergencyId {
  private constructor(public readonly value: string) {}

  static create(): EmergencyId {
    return new EmergencyId(randomUUID());
  }

  static fromString(s: string): EmergencyId {
    if (!UUID_RE.test(s)) throw new Error(`Invalid EmergencyId: ${s}`);
    return new EmergencyId(s);
  }

  equals(o: EmergencyId): boolean {
    return this.value === o.value;
  }
}
