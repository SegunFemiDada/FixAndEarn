import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminNotificationsService } from "./admin-notifications.service";
import { SendAdminNotificationDto } from "./dto/send-admin-notification.dto";

@ApiTags("admin-notifications")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller("admin/notifications")
export class AdminNotificationsController {
  constructor(private readonly svc: AdminNotificationsService) {}

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER)
  @Post("send")
  async send(@Req() req: any, @Body() dto: SendAdminNotificationDto) {
    return this.svc.send({
      actorAdminId: req.user.adminId,
      mode: dto.mode,
      title: dto.title,
      body: dto.body,
      userId: dto.userId,
      userIds: dto.userIds,
    });
  }
}