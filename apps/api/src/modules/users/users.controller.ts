//path: apps/api/src/modules/users/users.controller.ts
import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { UsersService } from "./users.service";
import { CurrentUser } from "src/common/auth/current-user.decorator";



@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("fixers/discover")
  async discoverFixers(
    @Query("skill") skill?: string,
    @Query("state") state?: string,
    @Query("city") city?: string,
    @Query("minRating") minRating?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string
  ) {
    const parsedMinRating =
      minRating && minRating.trim() !== "" ? Number(minRating) : undefined;
    const parsedSkip =
      skip && skip.trim() !== "" ? Math.max(0, Number(skip)) : 0;
    const parsedTake =
      take && take.trim() !== "" ? Math.min(50, Math.max(1, Number(take))) : 20;

    return this.usersService.discoverFixers({
      skill,
      state,
      city,
      minRating:
        parsedMinRating != null && Number.isFinite(parsedMinRating)
          ? parsedMinRating
          : undefined,
      skip: Number.isFinite(parsedSkip) ? parsedSkip : 0,
      take: Number.isFinite(parsedTake) ? parsedTake : 20,
    });
  }
  @Post("request-deletion")
  async requestDeletion(@CurrentUser() user: { userId: string }, @Body() body: { reason: string }) {
    if (!body.reason?.trim()) throw new BadRequestException("REASON_REQUIRED");
    await this.usersService.requestDeletion(user.userId, body.reason.trim());
    return { ok: true };
  }
}