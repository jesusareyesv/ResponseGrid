import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../domain/notification-type';

export class NotificationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ nullable: true, type: String })
  emergencyId!: string | null;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty()
  message!: string;

  @ApiProperty({ nullable: true, type: String })
  link!: string | null;

  @ApiProperty()
  read!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

export class GetMyNotificationsResponseDto {
  @ApiProperty({ type: [NotificationDto] })
  notifications!: NotificationDto[];

  @ApiProperty()
  unreadCount!: number;
}
