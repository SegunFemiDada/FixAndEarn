import { BadRequestException, Injectable } from "@nestjs/common";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminSettingsRepo } from "./admin-settings.repo";
import { UpdateAdminSettingsDto } from "./dto/update-admin-settings.dto";

const META_KEYS = {
  commissionRate: "SETTINGS_COMMISSION_RATE",
  fecRateNaira: "SETTINGS_FEC_RATE_NAIRA",
  jobPostingFeeMilliFec: "SETTINGS_JOB_POSTING_FEE_MILLI_FEC",
  firstDepositMinMilliFec: "SETTINGS_FIRST_DEPOSIT_MIN_MILLI_FEC",
  firstDepositMaxMilliFec: "SETTINGS_FIRST_DEPOSIT_MAX_MILLI_FEC",
  generalDepositMinMilliFec: "SETTINGS_GENERAL_DEPOSIT_MIN_MILLI_FEC",
  withdrawalMinMilliFec: "SETTINGS_WITHDRAWAL_MIN_MILLI_FEC",
  withdrawalMaxMilliFec: "SETTINGS_WITHDRAWAL_MAX_MILLI_FEC",
  requireNin: "SETTINGS_REQUIRE_NIN",
  requireBvnForFixerBankDetails: "SETTINGS_REQUIRE_BVN_FOR_FIXER_BANK_DETAILS",
  requireUtilityBill: "SETTINGS_REQUIRE_UTILITY_BILL",
  requireLiveSelfie: "SETTINGS_REQUIRE_LIVE_SELFIE",
  forceVerificationBeforePosting: "SETTINGS_FORCE_VERIFICATION_BEFORE_POSTING",
  forceVerificationBeforeApplying: "SETTINGS_FORCE_VERIFICATION_BEFORE_APPLYING",
  moderationEnablePhoneNumberFlag: "SETTINGS_MODERATION_ENABLE_PHONE_NUMBER_FLAG",
  moderationEnableWhatsappFlag: "SETTINGS_MODERATION_ENABLE_WHATSAPP_FLAG",
  moderationEnableOffPlatformPaymentFlag: "SETTINGS_MODERATION_ENABLE_OFF_PLATFORM_PAYMENT_FLAG",
  moderationAutoActionStrikeThreshold: "SETTINGS_MODERATION_AUTO_ACTION_STRIKE_THRESHOLD",
  moderationAutoSuspendEnabled: "SETTINGS_MODERATION_AUTO_SUSPEND_ENABLED",
  allowedWithdrawalRoles: "SETTINGS_ALLOWED_WITHDRAWAL_ROLES",
} as const;

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly repo: AdminSettingsRepo,
    private readonly audit: AdminAuditService
  ) {}

  private parseNumber(value: string | undefined, fallback: number) {
    if (!value?.trim()) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private parseIntValue(value: string | undefined, fallback: number) {
    if (!value?.trim()) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private parseBoolean(value: string | undefined, fallback: boolean) {
    if (!value?.trim()) return fallback;
    return value === "true";
  }

  private parseStringArray(value: string | undefined, fallback: string[]) {
    if (!value?.trim()) return fallback;

    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return fallback;

      return Array.from(
        new Set(parsed.map((item) => String(item ?? "").trim()).filter(Boolean))
      );
    } catch {
      return fallback;
    }
  }

  async getOverview() {
    const meta = await this.repo.getMetaValues(Object.values(META_KEYS));

    return {
      finance: {
        commissionRate: this.parseNumber(meta.get(META_KEYS.commissionRate), 0.1),
        fecRateNaira: this.parseIntValue(meta.get(META_KEYS.fecRateNaira), 1000),
        jobPostingFeeMilliFec: this.parseIntValue(meta.get(META_KEYS.jobPostingFeeMilliFec), 1000),
        firstDepositMinMilliFec: this.parseIntValue(meta.get(META_KEYS.firstDepositMinMilliFec), 1000),
        firstDepositMaxMilliFec: this.parseIntValue(meta.get(META_KEYS.firstDepositMaxMilliFec), 2000),
        generalDepositMinMilliFec: this.parseIntValue(meta.get(META_KEYS.generalDepositMinMilliFec), 1000),
        withdrawalMinMilliFec: this.parseIntValue(meta.get(META_KEYS.withdrawalMinMilliFec), 1000),
        withdrawalMaxMilliFec: this.parseIntValue(meta.get(META_KEYS.withdrawalMaxMilliFec), 100000000),
        allowedWithdrawalRoles: this.parseStringArray(
          meta.get(META_KEYS.allowedWithdrawalRoles),
          ["FIXER"]
        ),
      },
      verification: {
        requireNin: this.parseBoolean(meta.get(META_KEYS.requireNin), true),
        requireBvnForFixerBankDetails: this.parseBoolean(
          meta.get(META_KEYS.requireBvnForFixerBankDetails),
          true
        ),
        requireUtilityBill: this.parseBoolean(meta.get(META_KEYS.requireUtilityBill), true),
        requireLiveSelfie: this.parseBoolean(meta.get(META_KEYS.requireLiveSelfie), true),
        forceVerificationBeforePosting: this.parseBoolean(
          meta.get(META_KEYS.forceVerificationBeforePosting),
          true
        ),
        forceVerificationBeforeApplying: this.parseBoolean(
          meta.get(META_KEYS.forceVerificationBeforeApplying),
          true
        ),
      },
      moderation: {
        moderationEnablePhoneNumberFlag: this.parseBoolean(
          meta.get(META_KEYS.moderationEnablePhoneNumberFlag),
          true
        ),
        moderationEnableWhatsappFlag: this.parseBoolean(
          meta.get(META_KEYS.moderationEnableWhatsappFlag),
          true
        ),
        moderationEnableOffPlatformPaymentFlag: this.parseBoolean(
          meta.get(META_KEYS.moderationEnableOffPlatformPaymentFlag),
          true
        ),
        moderationAutoActionStrikeThreshold: this.parseIntValue(
          meta.get(META_KEYS.moderationAutoActionStrikeThreshold),
          3
        ),
        moderationAutoSuspendEnabled: this.parseBoolean(
          meta.get(META_KEYS.moderationAutoSuspendEnabled),
          false
        ),
      },
    };
  }

  async updateOverview(args: {
    adminId: string;
    payload: UpdateAdminSettingsDto;
  }) {
    const payload = args.payload;
    const updates: Array<Promise<unknown>> = [];
    const updatedFields: string[] = [];

    const pushNumber = (field: keyof UpdateAdminSettingsDto, key: string, value: number | undefined) => {
      if (typeof value !== "number") return;
      updates.push(this.repo.upsertMetaValue(key, String(value)));
      updatedFields.push(String(field));
    };

    const pushBoolean = (field: keyof UpdateAdminSettingsDto, key: string, value: boolean | undefined) => {
      if (typeof value !== "boolean") return;
      updates.push(this.repo.upsertMetaValue(key, value ? "true" : "false"));
      updatedFields.push(String(field));
    };

    pushNumber("commissionRate", META_KEYS.commissionRate, payload.commissionRate);
    pushNumber("fecRateNaira", META_KEYS.fecRateNaira, payload.fecRateNaira);
    pushNumber("jobPostingFeeMilliFec", META_KEYS.jobPostingFeeMilliFec, payload.jobPostingFeeMilliFec);
    pushNumber("firstDepositMinMilliFec", META_KEYS.firstDepositMinMilliFec, payload.firstDepositMinMilliFec);
    pushNumber("firstDepositMaxMilliFec", META_KEYS.firstDepositMaxMilliFec, payload.firstDepositMaxMilliFec);
    pushNumber("generalDepositMinMilliFec", META_KEYS.generalDepositMinMilliFec, payload.generalDepositMinMilliFec);
    pushNumber("withdrawalMinMilliFec", META_KEYS.withdrawalMinMilliFec, payload.withdrawalMinMilliFec);
    pushNumber("withdrawalMaxMilliFec", META_KEYS.withdrawalMaxMilliFec, payload.withdrawalMaxMilliFec);

    pushBoolean("requireNin", META_KEYS.requireNin, payload.requireNin);
    pushBoolean(
      "requireBvnForFixerBankDetails",
      META_KEYS.requireBvnForFixerBankDetails,
      payload.requireBvnForFixerBankDetails
    );
    pushBoolean("requireUtilityBill", META_KEYS.requireUtilityBill, payload.requireUtilityBill);
    pushBoolean("requireLiveSelfie", META_KEYS.requireLiveSelfie, payload.requireLiveSelfie);
    pushBoolean(
      "forceVerificationBeforePosting",
      META_KEYS.forceVerificationBeforePosting,
      payload.forceVerificationBeforePosting
    );
    pushBoolean(
      "forceVerificationBeforeApplying",
      META_KEYS.forceVerificationBeforeApplying,
      payload.forceVerificationBeforeApplying
    );

    pushBoolean(
      "moderationEnablePhoneNumberFlag",
      META_KEYS.moderationEnablePhoneNumberFlag,
      payload.moderationEnablePhoneNumberFlag
    );
    pushBoolean(
      "moderationEnableWhatsappFlag",
      META_KEYS.moderationEnableWhatsappFlag,
      payload.moderationEnableWhatsappFlag
    );
    pushBoolean(
      "moderationEnableOffPlatformPaymentFlag",
      META_KEYS.moderationEnableOffPlatformPaymentFlag,
      payload.moderationEnableOffPlatformPaymentFlag
    );
    pushNumber(
      "moderationAutoActionStrikeThreshold",
      META_KEYS.moderationAutoActionStrikeThreshold,
      payload.moderationAutoActionStrikeThreshold
    );
    pushBoolean(
      "moderationAutoSuspendEnabled",
      META_KEYS.moderationAutoSuspendEnabled,
      payload.moderationAutoSuspendEnabled
    );

    if (Array.isArray(payload.allowedWithdrawalRoles)) {
      const normalized = Array.from(
        new Set(
          payload.allowedWithdrawalRoles
            .map((item) => String(item ?? "").trim().toUpperCase())
            .filter(Boolean)
        )
      );

      updates.push(
        this.repo.upsertMetaValue(META_KEYS.allowedWithdrawalRoles, JSON.stringify(normalized))
      );
      updatedFields.push("allowedWithdrawalRoles");
    }

    const minFirstDeposit =
      typeof payload.firstDepositMinMilliFec === "number"
        ? payload.firstDepositMinMilliFec
        : undefined;
    const maxFirstDeposit =
      typeof payload.firstDepositMaxMilliFec === "number"
        ? payload.firstDepositMaxMilliFec
        : undefined;

    if (
      typeof minFirstDeposit === "number" &&
      typeof maxFirstDeposit === "number" &&
      minFirstDeposit > maxFirstDeposit
    ) {
      throw new BadRequestException("FIRST_DEPOSIT_MIN_CANNOT_EXCEED_MAX");
    }

    const withdrawalMin =
      typeof payload.withdrawalMinMilliFec === "number"
        ? payload.withdrawalMinMilliFec
        : undefined;
    const withdrawalMax =
      typeof payload.withdrawalMaxMilliFec === "number"
        ? payload.withdrawalMaxMilliFec
        : undefined;

    if (
      typeof withdrawalMin === "number" &&
      typeof withdrawalMax === "number" &&
      withdrawalMin > withdrawalMax
    ) {
      throw new BadRequestException("WITHDRAWAL_MIN_CANNOT_EXCEED_MAX");
    }

    await Promise.all(updates);

    await this.audit.log({
      actorAdminId: args.adminId,
      action: "SETTINGS_UPDATE",
      description: "Updated platform settings",
      metadata: {
        updatedFields,
      },
    });

    return {
      ok: true,
      settings: await this.getOverview(),
    };
  }
}