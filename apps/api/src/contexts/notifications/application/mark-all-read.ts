import { NotificationRepository } from '../domain/ports/notification.repository';

export interface MarkAllReadCommand {
  userId: string;
}

export class MarkAllRead {
  constructor(private readonly repo: NotificationRepository) {}

  async execute(cmd: MarkAllReadCommand): Promise<void> {
    await this.repo.markAllReadForUser(cmd.userId);
  }
}
