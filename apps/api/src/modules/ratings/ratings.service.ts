// path: apps/api/src/modules/ratings/ratings.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { CreateRatingDto } from "./dto/create-rating.dto";

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(jobId: string, userId: string, dto: CreateRatingDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        clientId: true,
        status: true,
        fixerId: true,
      },
    });

    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    if (job.clientId !== userId) {
      throw new ForbiddenException("ONLY_CLIENT_CAN_RATE");
    }

    if (job.status !== "COMPLETED") {
      throw new ForbiddenException("JOB_NOT_COMPLETED");
    }

    if (!job.fixerId) {
      throw new BadRequestException("NO_FIXER_ASSIGNED");
    }

    const existing = await this.prisma.jobReview.findUnique({
      where: { jobId },
    });

    if (existing) {
      throw new ForbiddenException("JOB_ALREADY_RATED");
    }

    const rating = await this.prisma.jobReview.create({
      data: {
        jobId,
        clientId: userId,
        fixerId: job.fixerId,
        rating: dto.rating,
        comment: dto.review ?? null,
      },
    });

    // Recalculate fixer aggregate from source of truth
    const agg = await this.prisma.jobReview.aggregate({
      where: { fixerId: job.fixerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.user.update({
      where: { id: job.fixerId },
      data: {
        totalRatings: agg._count.rating ?? 0,
        averageRating: agg._avg.rating ?? 0,
      },
    });

    return {
      ok: true,
      rating: rating.rating,
      review: rating.comment,
    };
  }
}