import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

export type AppRoleCode = "CLIENT" | "FIXER";

@Injectable()
export class UsersRepo {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRoles = {
    roles: {
      include: { role: true },
    },
  } as const;

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: this.includeRoles,
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: this.includeRoles,
    });
  }

  createUser(data: { email: string; fullName: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
      },
      include: this.includeRoles,
    });
  }

  async ensureUserRole(userId: string, roleCode: AppRoleCode) {
    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new Error(`Role not found: ${roleCode}`);

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });

    return this.findById(userId);
  }

  setEmailVerificationToken(userId: string, hash: string, expiresAt: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyTokenHash: hash,
        emailVerifyTokenExpiresAt: expiresAt,
      },
      include: this.includeRoles,
    });
  }

  findByVerificationTokenHash(hash: string) {
    return this.prisma.user.findFirst({
      where: {
        emailVerifyTokenHash: hash,
        emailVerifyTokenExpiresAt: {
          gt: new Date(),
        },
      },
      include: this.includeRoles,
    });
  }

  markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        emailVerifyTokenHash: null,
        emailVerifyTokenExpiresAt: null,
      },
      include: this.includeRoles,
    });
  }

  discoverFixers(args: {
    skill?: string;
    state?: string;
    city?: string;
    minRating?: number;
    skip?: number;
    take?: number;
  }) {
    const skill = args.skill?.trim();
    const state = args.state?.trim();
    const city = args.city?.trim();
    const minRating =
      typeof args.minRating === "number" && Number.isFinite(args.minRating)
        ? args.minRating
        : undefined;

    return this.prisma.user.findMany({
      where: {
        isActive: true,
        averageRating: minRating != null ? { gte: minRating } : undefined,
        roles: {
          some: {
            role: {
              code: "FIXER",
            },
          },
        },
        verification: {
          is: {
            status: "APPROVED",
            skills: skill
              ? {
                  contains: skill,
                  mode: "insensitive",
                }
              : undefined,
            state: state
              ? {
                  contains: state,
                  mode: "insensitive",
                }
              : undefined,
            city: city
              ? {
                  contains: city,
                  mode: "insensitive",
                }
              : undefined,
          },
        },
      },
      orderBy: [
        { averageRating: "desc" },
        { totalRatings: "desc" },
        { createdAt: "desc" },
      ],
      skip: args.skip ?? 0,
      take: args.take ?? 20,
      select: {
        id: true,
        fullName: true,
        averageRating: true,
        totalRatings: true,
        fixerPreferredAvailability: true,
        fixerAvailabilityUpdatedAt: true,
        verification: {
          select: {
            bio: true,
            skills: true,
            state: true,
            city: true,
            lga: true,
            selfieImagePath: true,
            status: true,
          },
        },
      },
    });
  }
}