import { Controller, Get, NotFoundException, Param, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { toPublicFileUrl } from "../../common/storage/storage-public-url";

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

function hasApprovedSelfie(
  verification: { status?: string | null; selfieImagePath?: string | null } | null | undefined
) {
  return verification?.status === "APPROVED" && !!verification?.selfieImagePath;
}

function normalizeStoredUploadPath(pathOrKey: string | null | undefined): string | null {
  if (!pathOrKey) return null;

  if (pathOrKey.startsWith("/uploads/")) return pathOrKey;
  if (pathOrKey.startsWith("http://") || pathOrKey.startsWith("https://")) return pathOrKey;

  const normalized = pathOrKey.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/uploads/");
  if (idx >= 0) {
    return normalized.slice(idx);
  }

  return pathOrKey;
}

function mapRoleCodes(rawRoles: any[] | null | undefined): string[] {
  if (!Array.isArray(rawRoles)) return [];

  return rawRoles
    .map((r: any) => {
      if (!r) return null;

      if (typeof r === "string") return r;

      // direct Role model shape
      if (typeof r.code === "string") return r.code;
      if (typeof r.role === "string") return r.role;

      // join-table shape, e.g. { role: { code: "FIXER" } }
      if (r.role && typeof r.role.code === "string") return r.role.code;
      if (r.role && typeof r.role.role === "string") return r.role.role;

      return null;
    })
    .filter(Boolean);
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
          selfieImagePath: true,
          instagram: true,
          tiktok: true,
          bio: true,
          skills: true,
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

    const approvedWithSelfie = hasApprovedSelfie(u.verification);
    const isVerified = approvedWithSelfie;
    const avatarPath = approvedWithSelfie
      ? normalizeStoredUploadPath(u.verification?.selfieImagePath ?? null)
      : null;

    const instagramHandle = approvedWithSelfie ? normalizeHandle(u.verification?.instagram) : null;
    const tiktokHandle = approvedWithSelfie ? normalizeHandle(u.verification?.tiktok) : null;

    return {
      id: u.id,
      fullName: u.fullName,
      isVerified,
      avatarPath,
      avatarUrl: toPublicFileUrl(avatarPath),
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
      profile: {
      bio: u.verification?.bio ?? null,
      skills: u.verification?.skills ?? null,
  },
      stats: {
        completedJobs,
      },
    };
  }

  @Get("clients/:clientId")
  async getClientPublic(@Param("clientId") clientId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        fullName: true,
        verification: {
          select: {
            status: true,
            selfieImagePath: true,
          },
        },
      },
    });

    if (!u) throw new NotFoundException("USER_NOT_FOUND");

    const approvedWithSelfie = hasApprovedSelfie(u.verification);
    const isVerified = approvedWithSelfie;
    const avatarPath = approvedWithSelfie
      ? normalizeStoredUploadPath(u.verification?.selfieImagePath ?? null)
      : null;

    return {
      id: u.id,
      fullName: u.fullName,
      isVerified,
      avatarPath,
      avatarUrl: toPublicFileUrl(avatarPath),
    };
  }

  @Get("me")
  async getMyProfile(@Req() req: any) {
    const userId = req?.user?.userId ?? req?.user?.id ?? req?.user?.sub;

    if (!userId) throw new NotFoundException("USER_NOT_FOUND");

    const [u, completedJobs] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          averageRating: true,
          totalRatings: true,
          fixerPreferredAvailability: true,
          fixerAvailabilityUpdatedAt: true,
          roles: {
          select: {
            role: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
          jobsAssigned: {
            where: { status: "IN_PROGRESS" },
            select: { id: true },
            take: 1,
          },
          verification: {
            select: {
              status: true,
              selfieImagePath: true,
              instagram: true,
              tiktok: true,
              bio: true,
              skills: true,
              state: true,
              city: true,
              lga: true,
              addressArea: true,
            },
          },
        },
      }),
      this.prisma.job.count({
        where: {
          fixerId: userId,
          status: "COMPLETED",
        },
      }),
    ]);

    if (!u) throw new NotFoundException("USER_NOT_FOUND");

    const busy = Array.isArray(u.jobsAssigned) && u.jobsAssigned.length > 0;
    const preferred = u.fixerPreferredAvailability ?? "UNAVAILABLE";

    const approvedWithSelfie = hasApprovedSelfie(u.verification);
    const isVerified = approvedWithSelfie;
    const avatarPath = approvedWithSelfie
      ? normalizeStoredUploadPath(u.verification?.selfieImagePath ?? null)
      : null;

    const instagramHandle = approvedWithSelfie ? normalizeHandle(u.verification?.instagram) : null;
    const tiktokHandle = approvedWithSelfie ? normalizeHandle(u.verification?.tiktok) : null;

    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      isVerified,
      avatarPath,
      avatarUrl: toPublicFileUrl(avatarPath),
      roles: mapRoleCodes(u.roles),
      verification: {
        status: u.verification?.status ?? null,
      },
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
      profile: {
        bio: u.verification?.bio ?? null,
        skills: u.verification?.skills ?? null,
        state: u.verification?.state ?? null,
        city: u.verification?.city ?? null,
        lga: u.verification?.lga ?? null,
        area: u.verification?.addressArea ?? null,
      },
      stats: {
        completedJobs,
      },
    };
  }
}