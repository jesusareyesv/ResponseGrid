import { Notification } from '../notification';
import { NotificationId } from '../notification-id';

export const NOTIFICATION_REPOSITORY = Symbol('NotificationRepository');

export interface NotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: NotificationId): Promise<Notification | null>;
  findByUser(userId: string): Promise<Notification[]>;
  markAllReadForUser(userId: string): Promise<void>;
}
