import { NotificationRepository } from '../domain/ports/notification.repository';
import {
  NotificationsPort,
  CreateNotificationParams,
} from '../domain/ports/notifications.port';
import { Notification } from '../domain/notification';
import { NotificationId } from '../domain/notification-id';

/**
 * Application-layer adapter: implements the NotificationsPort output port
 * by persisting a new Notification via the repository.
 */
export class NotificationCreator implements NotificationsPort {
  constructor(private readonly repo: NotificationRepository) {}

  async create(params: CreateNotificationParams): Promise<void> {
    const notification = Notification.create({
      id: NotificationId.create(),
      userId: params.userId,
      emergencyId: params.emergencyId ?? null,
      type: params.type,
      message: params.message,
      link: params.link ?? null,
    });
    await this.repo.save(notification);
  }
}
