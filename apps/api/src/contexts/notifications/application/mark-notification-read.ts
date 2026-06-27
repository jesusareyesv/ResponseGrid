import { NotificationRepository } from '../domain/ports/notification.repository';
import { NotificationId } from '../domain/notification-id';

export class NotificationNotFoundError extends Error {
  constructor(id: string) {
    super(`Notification '${id}' not found`);
    this.name = 'NotificationNotFoundError';
  }
}

export class NotificationForbiddenError extends Error {
  constructor() {
    super('You cannot mark this notification as read');
    this.name = 'NotificationForbiddenError';
  }
}

export interface MarkNotificationReadCommand {
  id: string;
  userId: string;
}

export class MarkNotificationRead {
  constructor(private readonly repo: NotificationRepository) {}

  async execute(cmd: MarkNotificationReadCommand): Promise<void> {
    const notification = await this.repo.findById(
      NotificationId.fromString(cmd.id),
    );
    if (!notification) throw new NotificationNotFoundError(cmd.id);
    if (notification.userId !== cmd.userId)
      throw new NotificationForbiddenError();

    notification.markRead();
    await this.repo.save(notification);
  }
}
