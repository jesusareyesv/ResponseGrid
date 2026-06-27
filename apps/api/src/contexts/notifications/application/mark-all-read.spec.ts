import { MarkAllRead } from './mark-all-read';
import { GetMyNotifications } from './get-my-notifications';
import { InMemoryNotificationRepository } from './in-memory-notification.repository';
import { NotificationCreator } from './notification-creator';
import { NotificationType } from '../domain/notification-type';

const USER_A = 'user-a';
const USER_B = 'user-b';

describe('MarkAllRead', () => {
  it('marks all user notifications as read', async () => {
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
    await creator.create({
      userId: USER_B,
      type: NotificationType.OfferMatched,
      message: 'msg3',
    });

    await new MarkAllRead(repo).execute({ userId: USER_A });

    const resultA = await new GetMyNotifications(repo).execute({
      userId: USER_A,
    });
    const resultB = await new GetMyNotifications(repo).execute({
      userId: USER_B,
    });
    expect(resultA.unreadCount).toBe(0);
    expect(resultB.unreadCount).toBe(1); // USER_B unaffected
  });
});
