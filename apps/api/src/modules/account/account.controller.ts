// Path: /apps/api/src/modules/account/account.controller.ts
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { UsersService } from "../users/users.service";
import { SwitchRoleDto } from "./dto/switch-role.dto";

@ApiTags("account")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("account")
export class AccountController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async me(@CurrentUser() user: { userId: string }) {
    const dbUser = await this.usersService.findById(user.userId);
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      roles: (dbUser.roles ?? []).map((ur: any) => ur.role.code)
    };
  }

  @Post("roles/switch")
  async switchRole(@CurrentUser() user: { userId: string }, @Body() dto: SwitchRoleDto) {
    const updated = await this.usersService.ensureRole(user.userId, dto.role);
    return {
      id: updated?.id,
      email: updated?.email,
      fullName: updated?.fullName,
      roles: (updated?.roles ?? []).map((ur: any) => ur.role.code)
    };
  }
}