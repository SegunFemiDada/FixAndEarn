import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { NotificationsService } from "./notifications.service";

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: any,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("unreadOnly") unreadOnly?: string
  ) {
    return this.notifications.list(user.id, {
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 30,
      unreadOnly: unreadOnly === "true"
    });
  }

  @Post(":id/read")
  async read(@CurrentUser() user: any, @Param("id") id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post("read-all")
  async readAll(@CurrentUser() user: any) {
    return this.notifications.markAllRead(user.id);
  }
}