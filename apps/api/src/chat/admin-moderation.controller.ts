//path: apps/api/src/chat/admin-moderation.controller.ts
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RolesGuard } from "../common/auth/roles.guard";
import { Roles } from "../common/auth/roles.decorator";
import { ChatService } from "./chat.service";
import { ListModerationFlagsDto } from "./dto/list-moderation-flags.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "SECURITY_OFFICER")
@Controller("admin/moderation")
export class AdminModerationController {
  constructor(private readonly chat: ChatService) {}

  @Get("flags")
  async flags(@Query() q: ListModerationFlagsDto) {
    return this.chat.listModerationFlags(q);
  }
}
