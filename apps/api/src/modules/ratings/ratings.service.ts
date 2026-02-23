import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { CreateRatingDto } from "./dto/create-rating.dto";

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(jobId: string, userId: string, dto: CreateRatingDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    if (job.clientId !== userId)
      throw new ForbiddenException("ONLY_CLIENT_CAN_RATE");

    if (job.status !== "COMPLETED")
      throw new ForbiddenException("JOB_NOT_COMPLETED");

    if (!job.fixerId)
      throw new BadRequestException("NO_FIXER_ASSIGNED");

    const existing = await this.prisma.jobRating.findUnique({
      where: { jobId }
    });

    if (existing)
      throw new ForbiddenException("JOB_ALREADY_RATED");

    const rating = await this.prisma.jobRating.create({
      data: {
        jobId,
        clientId: userId,
        fixerId: job.fixerId,
        rating: dto.rating,
        review: dto.review
      }
    });

    // Update fixer aggregate rating
    const fixer = await this.prisma.user.findUnique({
      where: { id: job.fixerId }
    });

    const newTotal = (fixer?.totalRatings ?? 0) + 1;
    const newAverage =
      ((fixer?.averageRating ?? 0) * (fixer?.totalRatings ?? 0) + dto.rating) /
      newTotal;

    await this.prisma.user.update({
      where: { id: job.fixerId },
      data: {
        totalRatings: newTotal,
        averageRating: newAverage
      }
    });

    return {
      ok: true,
      rating: rating.rating,
      review: rating.review
    };
  }
}