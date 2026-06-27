import { randomUUID } from 'crypto';

export class NotificationId {
  private constructor(public readonly value: string) {}

  static create(): NotificationId {
    return new NotificationId(randomUUID());
  }

  static fromString(id: string): NotificationId {
    return new NotificationId(id);
  }
}
