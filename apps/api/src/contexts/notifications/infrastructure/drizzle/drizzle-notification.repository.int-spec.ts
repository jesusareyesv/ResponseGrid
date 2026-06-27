import { createDb, Db } from '../../../../shared/db';
import { notificationsTable } from './schema';
import { DrizzleNotificationRepository } from './drizzle-notification.repository';
import { Notification } from '../../domain/notification';
import { NotificationId } from '../../domain/notification-id';
import { NotificationType } from '../../domain/notification-type';
import type { Pool } from 'pg';

const USER_A = '00000000-0000-4000-8000-000000000001';
const USER_B = '00000000-0000-4000-8000-000000000002';
const EM_ID = '11111111-1111-4111-8111-111111111111';

const URL =
  process.env.DATABASE_URL ??
  'postgres://reliefhub:reliefhub@localhost:5433/reliefhub';

function makeNotification(
  userId: string,
  type = NotificationType.ResourceVerified,
): Notification {
  return Notification.create({
    id: NotificationId.create(),
    userId,
    emergencyId: EM_ID,
    type,
    message: 'Test notification',
    link: null,
  });
}

describe('DrizzleNotificationRepository (integration)', () => {
  let db: Db;
  let pool: Pool;
  let repo: DrizzleNotificationRepository;

  beforeAll(() => {
    ({ db, pool } = createDb(URL));
    repo = new DrizzleNotificationRepository(db);
  });
  afterAll(async () => {
    await pool.end();
  });
  beforeEach(async () => {
    await db.delete(notificationsTable);
  });

  it('saves and retrieves by id', async () => {
    const n = makeNotification(USER_A);
    await repo.save(n);
    const found = await repo.findById(n.id);
    expect(found?.userId).toBe(USER_A);
    expect(found?.read).toBe(false);
    expect(found?.type).toBe(NotificationType.ResourceVerified);
  });

  it('findById returns null for unknown id', async () => {
    const result = await repo.findById(
      NotificationId.fromString('00000000-0000-4000-8000-000000000099'),
    );
    expect(result).toBeNull();
  });

  it('findByUser returns only the user notifications ordered by createdAt desc', async () => {
    await repo.save(
      makeNotification(USER_A, NotificationType.ResourceVerified),
    );
    await repo.save(makeNotification(USER_A, NotificationType.TaskAssigned));
    await repo.save(makeNotification(USER_B, NotificationType.OfferMatched));

    const results = await repo.findByUser(USER_A);
    expect(results).toHaveLength(2);
    expect(results.every((n) => n.userId === USER_A)).toBe(true);
    // ordered desc
    expect(results[0].createdAt.getTime()).toBeGreaterThanOrEqual(
      results[1].createdAt.getTime(),
    );
  });

  it('save updates read field via upsert', async () => {
    const n = makeNotification(USER_A);
    await repo.save(n);
    n.markRead();
    await repo.save(n);
    const found = await repo.findById(n.id);
    expect(found?.read).toBe(true);
  });

  it('markAllReadForUser marks only that user notifications', async () => {
    await repo.save(makeNotification(USER_A));
    await repo.save(makeNotification(USER_A));
    await repo.save(makeNotification(USER_B));

    await repo.markAllReadForUser(USER_A);

    const allA = await repo.findByUser(USER_A);
    const allB = await repo.findByUser(USER_B);
    expect(allA.every((n) => n.read)).toBe(true);
    expect(allB.every((n) => !n.read)).toBe(true);
  });
});
