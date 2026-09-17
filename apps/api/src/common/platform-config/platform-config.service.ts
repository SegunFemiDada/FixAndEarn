import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

const META_KEYS = {
  jobPostingFeeMilliFec: "SETTINGS_JOB_POSTING_FEE_MILLI_FEC",
  withdrawalMinMilliFec: "SETTINGS_WITHDRAWAL_MIN_MILLI_FEC",
  withdrawalMaxMilliFec: "SETTINGS_WITHDRAWAL_MAX_MILLI_FEC",
  allowedWithdrawalRoles: "SETTINGS_ALLOWED_WITHDRAWAL_ROLES",
} as const;

const DEFAULTS = {
  jobPostingFeeMilliFec: 1000,
  withdrawalMinMilliFec: 1000,
  withdrawalMaxMilliFec: 100000000,
  allowedWithdrawalRoles: ["FIXER"],
} as const;

@Injectable()
export class PlatformConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMetaValue(key: string): Promise<string | undefined> {
    const meta = await this.prisma.appMeta.findUnique({
      where: { key },
      select: { value: true },
    });

    return meta?.value;
  }

  private parseInteger(
    value: string | undefined,
    fallback: number,
  ): number {
    if (!value?.trim()) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private parseStringArray(
    value: string | undefined,
    fallback: readonly string[],
  ): string[] {
    if (!value?.trim()) {
      return [...fallback];
    }

    try {
      const parsed = JSON.parse(value);

      if (!Array.isArray(parsed)) {
        return [...fallback];
      }

      const normalized = Array.from(
        new Set(
          parsed
            .map((item) => String(item ?? "").trim().toUpperCase())
            .filter(Boolean),
        ),
      );

      return normalized.length > 0 ? normalized : [...fallback];
    } catch {
      return [...fallback];
    }
  }

  async getJobPostingFeeMilliFec(): Promise<number> {
    const value = await this.getMetaValue(
      META_KEYS.jobPostingFeeMilliFec,
    );

    return this.parseInteger(
      value,
      DEFAULTS.jobPostingFeeMilliFec,
    );
  }

  async getWithdrawalConfig(): Promise<{
    minMilliFec: number;
    maxMilliFec: number;
    allowedRoles: string[];
  }> {
    const [
      minimum,
      maximum,
      allowedRoles,
    ] = await Promise.all([
      this.getMetaValue(META_KEYS.withdrawalMinMilliFec),
      this.getMetaValue(META_KEYS.withdrawalMaxMilliFec),
      this.getMetaValue(META_KEYS.allowedWithdrawalRoles),
    ]);

    return {
      minMilliFec: this.parseInteger(
        minimum,
        DEFAULTS.withdrawalMinMilliFec,
      ),
      maxMilliFec: this.parseInteger(
        maximum,
        DEFAULTS.withdrawalMaxMilliFec,
      ),
      allowedRoles: this.parseStringArray(
        allowedRoles,
        DEFAULTS.allowedWithdrawalRoles,
      ),
    };
  }
}