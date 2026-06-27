import { Notification } from '../domain/notification';
import { NotificationId } from '../domain/notification-id';
import { NotificationRepository } from '../domain/ports/notification.repository';

export class InMemoryNotificationRepository implements NotificationRepository {
  private store = new Map<string, Notification>();

  save(notification: Notification): Promise<void> {
    this.store.set(notification.id.value, notification);
    return Promise.resolve();
  }

  findById(id: NotificationId): Promise<Notification | null> {
    return Promise.resolve(this.store.get(id.value) ?? null);
  }

  findByUser(userId: string): Promise<Notification[]> {
    const result = [...this.store.values()]
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve(result);
  }

  markAllReadForUser(userId: string): Promise<void> {
    for (const n of this.store.values()) {
      if (n.userId === userId && !n.read) {
        n.markRead();
      }
    }
    return Promise.resolve();
  }
}
