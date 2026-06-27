import {
  MarkNotificationRead,
  NotificationNotFoundError,
  NotificationForbiddenError,
} from './mark-notification-read';
import { InMemoryNotificationRepository } from './in-memory-notification.repository';
import { NotificationCreator } from './notification-creator';
import { GetMyNotifications } from './get-my-notifications';
import { NotificationType } from '../domain/notification-type';

const USER_A = 'user-a';
const USER_B = 'user-b';

describe('MarkNotificationRead', () => {
  it('marks a notification as read', async () => {
    const repo = new InMemoryNotificationRepository();
    const creator = new NotificationCreator(repo);
    await creator.create({
      userId: USER_A,
      type: NotificationType.ResourceVerified,
      message: 'Tu punto ha sido verificado',
    });
    const { notifications } = await new GetMyNotifications(repo).execute({
      userId: USER_A,
    });
    const notifId = notifications[0].id;

    await new MarkNotificationRead(repo).execute({
      id: notifId,
      userId: USER_A,
    });

    const after = await new GetMyNotifications(repo).execute({
      userId: USER_A,
    });
    expect(after.unreadCount).toBe(0);
    expect(after.notifications[0].read).toBe(true);
  });

  it('throws NotificationNotFoundError for unknown id', async () => {
    const repo = new InMemoryNotificationRepository();
    await expect(
      new MarkNotificationRead(repo).execute({
        id: '00000000-0000-4000-8000-000000000099',
        userId: USER_A,
      }),
    ).rejects.toBeInstanceOf(NotificationNotFoundError);
  });

  it('throws NotificationForbiddenError when user does not own notification', async () => {
    const repo = new InMemoryNotificationRepository();
    const creator = new NotificationCreator(repo);
    await creator.create({
      userId: USER_A,
      type: NotificationType.ResourceVerified,
      message: 'Tu punto ha sido verificado',
    });
    const { notifications } = await new GetMyNotifications(repo).execute({
      userId: USER_A,
    });
    const notifId = notifications[0].id;

    await expect(
      new MarkNotificationRead(repo).execute({
        id: notifId,
        userId: USER_B,
      }),
    ).rejects.toBeInstanceOf(NotificationForbiddenError);
  });
});
