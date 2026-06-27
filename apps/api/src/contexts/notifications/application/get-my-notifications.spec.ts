import { GetMyNotifications } from './get-my-notifications';
import { InMemoryNotificationRepository } from './in-memory-notification.repository';
import { NotificationCreator } from './notification-creator';
import { NotificationType } from '../domain/notification-type';

const USER_A = 'user-a';
const USER_B = 'user-b';

describe('GetMyNotifications', () => {
  it('returns empty list for user with no notifications', async () => {
    const repo = new InMemoryNotificationRepository();
    const uc = new GetMyNotifications(repo);
    const result = await uc.execute({ userId: USER_A });
    expect(result.notifications).toHaveLength(0);
    expect(result.unreadCount).toBe(0);
  });

  it('returns only the requesting user notifications', async () => {
    const repo = new InMemoryNotificationRepository();
    const creator = new NotificationCreator(repo);
    await creator.create({
      userId: USER_A,
      type: NotificationType.ResourceVerified,
      message: 'Tu punto ha sido verificado',
    });
    await creator.create({
      userId: USER_B,
      type: NotificationType.OfferMatched,
      message: 'Tu oferta ha sido asignada',
    });

    const uc = new GetMyNotifications(repo);
    const result = await uc.execute({ userId: USER_A });
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].userId).toBe(USER_A);
  });

  it('counts unread notifications correctly', async () => {
    const repo = new InMemoryNotificationRepository();
    const creator = new NotificationCreator(repo);
    await creator.create({
      userId: USER_A,
      type: NotificationType.ResourceVerified,
      message: 'msg1',
    });
    await creator.create({
      userId: USER_A,
      type: NotificationType.TaskAssigned,
      message: 'msg2',
    });

    const uc = new GetMyNotifications(repo);
    const result = await uc.execute({ userId: USER_A });
    expect(result.unreadCount).toBe(2);
    expect(result.notifications).toHaveLength(2);
  });
});
