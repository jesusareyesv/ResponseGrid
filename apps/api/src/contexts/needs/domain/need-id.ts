import { randomUUID } from 'node:crypto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class NeedId {
  private constructor(public readonly value: string) {}

  static create(): NeedId {
    return new NeedId(randomUUID());
  }

  static fromString(s: string): NeedId {
    if (!UUID_RE.test(s)) throw new Error(`Invalid NeedId: ${s}`);
    return new NeedId(s);
  }

  equals(o: NeedId): boolean {
    return this.value === o.value;
  }
}
