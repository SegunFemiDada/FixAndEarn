import { Injectable } from "@nestjs/common";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminContentRepo } from "./admin-content.repo";
import { UpdateAdminContentDto } from "./dto/update-admin-content.dto";

const META_KEYS = {
  userAgreement: "CMS_USER_AGREEMENT",
  privacyPolicy: "CMS_PRIVACY_POLICY",
  faqContent: "CMS_FAQ_CONTENT",
  supportContent: "CMS_SUPPORT_CONTENT",
  skillsList: "CMS_SKILLS_LIST",
  bankList: "CMS_BANK_LIST",
  notificationTemplates: "CMS_NOTIFICATION_TEMPLATES",
} as const;

type NotificationTemplate = {
  key: string;
  title: string;
  body: string;
  isEnabled: boolean;
};

@Injectable()
export class AdminContentService {
  constructor(
    private readonly repo: AdminContentRepo,
    private readonly audit: AdminAuditService
  ) {}

  private parseStringArray(value: string | undefined): string[] {
    if (!value?.trim()) return [];

    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => String(item ?? "").trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private parseTemplates(value: string | undefined): NotificationTemplate[] {
    if (!value?.trim()) return [];

    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => ({
          key: String(item?.key ?? "").trim(),
          title: String(item?.title ?? "").trim(),
          body: String(item?.body ?? "").trim(),
          isEnabled: Boolean(item?.isEnabled),
        }))
        .filter((item) => item.key && item.title && item.body);
    } catch {
      return [];
    }
  }

  private normalizeStringArray(items?: string[]) {
    if (!Array.isArray(items)) return undefined;

    return Array.from(
      new Set(items.map((item) => String(item ?? "").trim()).filter(Boolean))
    );
  }

  private normalizeTemplates(items?: NotificationTemplate[]) {
    if (!Array.isArray(items)) return undefined;

    const deduped = new Map<string, NotificationTemplate>();

    for (const item of items) {
      const key = String(item?.key ?? "").trim();
      const title = String(item?.title ?? "").trim();
      const body = String(item?.body ?? "").trim();

      if (!key || !title || !body) continue;

      deduped.set(key, {
        key,
        title,
        body,
        isEnabled: Boolean(item?.isEnabled),
      });
    }

    return Array.from(deduped.values());
  }

  async getOverview() {
    const meta = await this.repo.getMetaValues(Object.values(META_KEYS));

    return {
      userAgreement: meta.get(META_KEYS.userAgreement) ?? "",
      privacyPolicy: meta.get(META_KEYS.privacyPolicy) ?? "",
      faqContent: meta.get(META_KEYS.faqContent) ?? "",
      supportContent: meta.get(META_KEYS.supportContent) ?? "",
      skillsList: this.parseStringArray(meta.get(META_KEYS.skillsList)),
      bankList: this.parseStringArray(meta.get(META_KEYS.bankList)),
      notificationTemplates: this.parseTemplates(meta.get(META_KEYS.notificationTemplates)),
    };
  }

  async updateOverview(args: {
    adminId: string;
    payload: UpdateAdminContentDto;
  }) {
    const updates: Array<Promise<unknown>> = [];
    const payload = args.payload;

    const normalizedSkills = this.normalizeStringArray(payload.skillsList);
    const normalizedBanks = this.normalizeStringArray(payload.bankList);
    const normalizedTemplates = this.normalizeTemplates(payload.notificationTemplates);

    if (typeof payload.userAgreement === "string") {
      updates.push(this.repo.upsertMetaValue(META_KEYS.userAgreement, payload.userAgreement.trim()));
    }

    if (typeof payload.privacyPolicy === "string") {
      updates.push(this.repo.upsertMetaValue(META_KEYS.privacyPolicy, payload.privacyPolicy.trim()));
    }

    if (typeof payload.faqContent === "string") {
      updates.push(this.repo.upsertMetaValue(META_KEYS.faqContent, payload.faqContent.trim()));
    }

    if (typeof payload.supportContent === "string") {
      updates.push(this.repo.upsertMetaValue(META_KEYS.supportContent, payload.supportContent.trim()));
    }

    if (normalizedSkills) {
      updates.push(this.repo.upsertMetaValue(META_KEYS.skillsList, JSON.stringify(normalizedSkills)));
    }

    if (normalizedBanks) {
      updates.push(this.repo.upsertMetaValue(META_KEYS.bankList, JSON.stringify(normalizedBanks)));
    }

    if (normalizedTemplates) {
      updates.push(
        this.repo.upsertMetaValue(
          META_KEYS.notificationTemplates,
          JSON.stringify(normalizedTemplates)
        )
      );
    }

    await Promise.all(updates);

    await this.audit.log({
      actorAdminId: args.adminId,
      action: "CONTENT_UPDATE",
      description: "Updated content management settings",
      metadata: {
        updatedFields: [
          typeof payload.userAgreement === "string" ? "userAgreement" : null,
          typeof payload.privacyPolicy === "string" ? "privacyPolicy" : null,
          typeof payload.faqContent === "string" ? "faqContent" : null,
          typeof payload.supportContent === "string" ? "supportContent" : null,
          normalizedSkills ? "skillsList" : null,
          normalizedBanks ? "bankList" : null,
          normalizedTemplates ? "notificationTemplates" : null,
        ].filter(Boolean),
      },
    });

    return {
      ok: true,
      content: await this.getOverview(),
    };
  }
}