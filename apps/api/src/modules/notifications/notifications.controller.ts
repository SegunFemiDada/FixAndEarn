import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { NotificationsService } from "./notifications.service";
import { CurrentUserPayload } from "src/common/types/current-user";

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: CurrentUserPayload,
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
  async read(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post("read-all")
  async readAll(@CurrentUser() user: CurrentUserPayload) {
    return this.notifications.markAllRead(user.id);
  }
}