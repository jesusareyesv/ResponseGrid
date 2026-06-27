import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  JwtAuthGuard,
  AuthenticatedUser,
} from '../../../identity/infrastructure/http/jwt-auth.guard';
import { GetMyNotifications } from '../../application/get-my-notifications';
import { MarkNotificationRead } from '../../application/mark-notification-read';
import { MarkAllRead } from '../../application/mark-all-read';
import { GetMyNotificationsResponseDto } from './response.dto';
import { NotificationDomainExceptionFilter } from './domain-exception.filter';

@ApiTags('notifications')
@Controller('notifications')
@UseFilters(NotificationDomainExceptionFilter)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
export class NotificationsController {
  constructor(
    private readonly getMyNotificationsUc: GetMyNotifications,
    private readonly markNotificationReadUc: MarkNotificationRead,
    private readonly markAllReadUc: MarkAllRead,
  ) {}

  @Get('mine')
  @ApiOperation({ summary: 'Get my in-app notifications' })
  @ApiOkResponse({ type: GetMyNotificationsResponseDto })
  async getMyNotifications(
    @Req() req: Request & { user?: AuthenticatedUser },
  ): Promise<GetMyNotificationsResponseDto> {
    const userId = req.user!.id;
    const result = await this.getMyNotificationsUc.execute({ userId });
    return {
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    };
  }

  @Post(':id/read')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark a notification as read (owner only)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Notification not found' })
  @ApiForbiddenResponse({ description: 'Not the owner of this notification' })
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user?: AuthenticatedUser },
  ): Promise<void> {
    const userId = req.user!.id;
    await this.markNotificationReadUc.execute({ id, userId });
  }

  @Post('read-all')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  @ApiNoContentResponse()
  async markAllRead(
    @Req() req: Request & { user?: AuthenticatedUser },
  ): Promise<void> {
    const userId = req.user!.id;
    await this.markAllReadUc.execute({ userId });
  }
}
