import { Controller, Get, NotFoundException, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { PrismaService } from "../../infra/prisma/prisma.service";

@UseGuards(JwtAuthGuard)
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("fixers/:fixerId")
  async getFixerPublic(@Param("fixerId") fixerId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: fixerId },
      select: {
        id: true,
        fullName: true,
        fixerPreferredAvailability: true,
        fixerAvailabilityUpdatedAt: true,
        averageRating: true,
        totalRatings: true,
        jobsAssigned: {
          where: { status: "IN_PROGRESS" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!u) throw new NotFoundException("USER_NOT_FOUND");

    const busy = Array.isArray(u.jobsAssigned) && u.jobsAssigned.length > 0;
    const preferred = u.fixerPreferredAvailability ?? "UNAVAILABLE";

    return {
      id: u.id,
      fullName: u.fullName,
      availability: {
        preferred,
        effective: busy ? "BUSY" : preferred,
        updatedAt: u.fixerAvailabilityUpdatedAt ?? null,
      },
      rating: {
        average: u.averageRating ?? 0,
        count: u.totalRatings ?? 0,
      },
    };
  }
}