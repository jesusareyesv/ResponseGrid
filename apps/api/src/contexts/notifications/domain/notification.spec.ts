import { Notification } from './notification';
import { NotificationId } from './notification-id';
import { NotificationType } from './notification-type';

const BASE: Parameters<typeof Notification.create>[0] = {
  id: NotificationId.fromString('00000000-0000-4000-8000-000000000001'),
  userId: 'user-1',
  emergencyId: 'em-1',
  type: NotificationType.ResourceVerified,
  message: 'Tu punto ha sido verificado',
  link: '/resources/r1',
};

describe('Notification entity', () => {
  it('creates with read=false', () => {
    const n = Notification.create(BASE);
    expect(n.read).toBe(false);
    expect(n.userId).toBe('user-1');
    expect(n.type).toBe(NotificationType.ResourceVerified);
  });

  it('markRead() sets read=true', () => {
    const n = Notification.create(BASE);
    n.markRead();
    expect(n.read).toBe(true);
  });

  it('round-trips through snapshot', () => {
    const n = Notification.create(BASE);
    n.markRead();
    const snap = n.toSnapshot();
    const restored = Notification.fromSnapshot(snap);
    expect(restored.read).toBe(true);
    expect(restored.userId).toBe('user-1');
    expect(restored.emergencyId).toBe('em-1');
    expect(restored.link).toBe('/resources/r1');
  });

  it('allows null emergencyId and null link', () => {
    const n = Notification.create({
      ...BASE,
      emergencyId: null,
      link: null,
    });
    expect(n.emergencyId).toBeNull();
    expect(n.link).toBeNull();
    const snap = n.toSnapshot();
    expect(snap.emergencyId).toBeNull();
    expect(snap.link).toBeNull();
  });
});
