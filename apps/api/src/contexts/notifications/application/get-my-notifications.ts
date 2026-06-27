import { NotificationRepository } from '../domain/ports/notification.repository';
import { NotificationSnapshot } from '../domain/notification';

export interface GetMyNotificationsQuery {
  userId: string;
}

export interface GetMyNotificationsResult {
  notifications: NotificationSnapshot[];
  unreadCount: number;
}

export class GetMyNotifications {
  constructor(private readonly repo: NotificationRepository) {}

  async execute(
    query: GetMyNotificationsQuery,
  ): Promise<GetMyNotificationsResult> {
    const notifications = await this.repo.findByUser(query.userId);
    const unreadCount = notifications.filter((n) => !n.read).length;
    return {
      notifications: notifications.map((n) => n.toSnapshot()),
      unreadCount,
    };
  }
}
