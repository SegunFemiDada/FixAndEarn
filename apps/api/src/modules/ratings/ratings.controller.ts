//path: apps/api/src/modules/ratings/ratings.controller.ts
import { Controller, Post, Param, Body, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RatingsService } from "./ratings.service";
import { CreateRatingDto } from "./dto/create-rating.dto";

@UseGuards(JwtAuthGuard)
@Controller("jobs/:jobId/rating")
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Post()
  async create(
    @Param("jobId") jobId: string,
    @Body() dto: CreateRatingDto,
    @Req() req: any
  ) {
    return this.ratings.create(jobId, req.user.userId, dto);
  }
}