// Path: apps/api/src/modules/notifications/notifications.controller.ts
import { Controller, Get, Param, Post, Query, UnauthorizedException, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { CurrentUserPayload } from "../../common/types/current-user";
import { NotificationsService } from "./notifications.service";

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  private requireUserId(user: CurrentUserPayload): string {
    const id =
      user?.userId ??
      user?.id ??
      user?.sub ??
      user?.payload?.userId ??
      user?.payload?.id ??
      user?.payload?.sub;

    if (!id) throw new UnauthorizedException("UNAUTHORIZED");
    return id;
  }

  @Get()
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("unreadOnly") unreadOnly?: string
  ) {
    const userId = this.requireUserId(user);

    return this.notifications.list(userId, {
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 30,
      unreadOnly: unreadOnly === "true"
    });
  }

  @Post(":id/read")
  async read(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string) {
    const userId = this.requireUserId(user);
    return this.notifications.markRead(userId, id);
  }

  @Post("read-all")
  async readAll(@CurrentUser() user: CurrentUserPayload) {
    const userId = this.requireUserId(user);
    return this.notifications.markAllRead(userId);
  }
}