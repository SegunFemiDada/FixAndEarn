// path: apps/api/src/modules/profiles/profiles.controller.ts
import { Controller, Get, NotFoundException, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { PrismaService } from "../../infra/prisma/prisma.service";

function normalizeHandle(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.startsWith("@") ? s.slice(1) : s;
}

function toInstagramUrl(handle: string): string {
  return `https://instagram.com/${encodeURIComponent(handle)}`;
}

function toTiktokUrl(handle: string): string {
  return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
}

@UseGuards(JwtAuthGuard)
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("fixers/:fixerId")
  async getFixerPublic(@Param("fixerId") fixerId: string) {
    const [u, completedJobs] = await Promise.all([
      this.prisma.user.findUnique({
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
          verification: {
            select: {
              status: true,
              instagram: true,
              tiktok: true,
            },
          },
        },
      }),
      this.prisma.job.count({
        where: {
          fixerId,
          status: "COMPLETED",
        },
      }),
    ]);

    if (!u) throw new NotFoundException("USER_NOT_FOUND");

    const busy = Array.isArray(u.jobsAssigned) && u.jobsAssigned.length > 0;
    const preferred = u.fixerPreferredAvailability ?? "UNAVAILABLE";

    const socialsAllowed = u.verification?.status === "APPROVED";
    const instagramHandle = socialsAllowed ? normalizeHandle(u.verification?.instagram) : null;
    const tiktokHandle = socialsAllowed ? normalizeHandle(u.verification?.tiktok) : null;

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
      socials: {
        instagram: instagramHandle
          ? { handle: instagramHandle, url: toInstagramUrl(instagramHandle) }
          : null,
        tiktok: tiktokHandle
          ? { handle: tiktokHandle, url: toTiktokUrl(tiktokHandle) }
          : null,
      },

      // ✅ new, what you asked for
      stats: {
        completedJobs,
      },
    };
  }
}