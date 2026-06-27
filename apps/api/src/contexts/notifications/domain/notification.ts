import { NotificationId } from './notification-id';
import { NotificationType } from './notification-type';

export interface NotificationSnapshot {
  id: string;
  userId: string;
  emergencyId: string | null;
  type: NotificationType;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
}

export interface CreateNotificationProps {
  id: NotificationId;
  userId: string;
  emergencyId: string | null;
  type: NotificationType;
  message: string;
  link: string | null;
}

export class Notification {
  private constructor(
    public readonly id: NotificationId,
    public readonly userId: string,
    public readonly emergencyId: string | null,
    public readonly type: NotificationType,
    public readonly message: string,
    public readonly link: string | null,
    private _read: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateNotificationProps): Notification {
    return new Notification(
      props.id,
      props.userId,
      props.emergencyId,
      props.type,
      props.message,
      props.link,
      false,
      new Date(),
    );
  }

  static fromSnapshot(s: NotificationSnapshot): Notification {
    return new Notification(
      NotificationId.fromString(s.id),
      s.userId,
      s.emergencyId,
      s.type,
      s.message,
      s.link,
      s.read,
      s.createdAt,
    );
  }

  get read(): boolean {
    return this._read;
  }

  markRead(): void {
    this._read = true;
  }

  toSnapshot(): NotificationSnapshot {
    return {
      id: this.id.value,
      userId: this.userId,
      emergencyId: this.emergencyId,
      type: this.type,
      message: this.message,
      link: this.link,
      read: this._read,
      createdAt: this.createdAt,
    };
  }
}
