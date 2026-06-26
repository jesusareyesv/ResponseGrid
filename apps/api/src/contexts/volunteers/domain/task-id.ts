import { randomUUID } from 'node:crypto';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class TaskId {
  private constructor(public readonly value: string) {}

  static create(): TaskId {
    return new TaskId(randomUUID());
  }

  static fromString(s: string): TaskId {
    if (!UUID_RE.test(s)) throw new Error(`Invalid TaskId: ${s}`);
    return new TaskId(s);
  }

  equals(o: TaskId): boolean {
    return this.value === o.value;
  }
}
