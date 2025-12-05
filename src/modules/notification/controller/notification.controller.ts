import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { SkipWrap } from '../../../common/decorators/skip-wrap.decorator';
import { IRequestWithUser } from '../../../common/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ApiGetUserNotifications } from '../docs/notification.swagger';
import { ListNotificationsQueryDto } from '../dto/user-notification-list-query.dto';
import { NotificationService } from '../services/notification.service';

@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user')
  @SkipWrap()
  @ApiGetUserNotifications()
  async getUserNotifications(
    @Query() query: ListNotificationsQueryDto,
    @Req() req: IRequestWithUser,
  ) {
    const userId = req.user.userId;

    return this.notificationService.getUserNotifications(userId, query);
  }
}
