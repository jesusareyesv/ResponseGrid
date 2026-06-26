import { randomUUID } from 'node:crypto';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class VolunteerId {
  private constructor(public readonly value: string) {}

  static create(): VolunteerId {
    return new VolunteerId(randomUUID());
  }

  static fromString(s: string): VolunteerId {
    if (!UUID_RE.test(s)) throw new Error(`Invalid VolunteerId: ${s}`);
    return new VolunteerId(s);
  }

  equals(o: VolunteerId): boolean {
    return this.value === o.value;
  }
}
