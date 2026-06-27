import { NotificationType } from '../notification-type';

export const NOTIFICATIONS_PORT = Symbol('NotificationsPort');

export interface CreateNotificationParams {
  userId: string;
  emergencyId?: string;
  type: NotificationType;
  message: string;
  link?: string;
}

/**
 * Output port consumed by other bounded contexts to create in-app notifications.
 * The adapter persists via the NotificationRepository.
 */
export interface NotificationsPort {
  create(params: CreateNotificationParams): Promise<void>;
}
