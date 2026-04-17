import { Injectable } from "@nestjs/common";
import { PublicContentRepo } from "./public-content.repo";

const META_KEYS = {
  userAgreement: "CMS_USER_AGREEMENT",
  privacyPolicy: "CMS_PRIVACY_POLICY",
  faqContent: "CMS_FAQ_CONTENT",
  supportContent: "CMS_SUPPORT_CONTENT",
  skillsList: "CMS_SKILLS_LIST",
  bankList: "CMS_BANK_LIST",
} as const;

type PublicFaqItem = {
  question: string;
  answer: string;
  youtubeUrl?: string | null;
};

@Injectable()
export class PublicContentService {
  constructor(private readonly repo: PublicContentRepo) {}

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

  private parseFaqItems(value: string | undefined): PublicFaqItem[] {
    if (!value?.trim()) return [];

    try {
      const parsed = JSON.parse(value);

      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => ({
          question: String(item?.question ?? "").trim(),
          answer: String(item?.answer ?? "").trim(),
          youtubeUrl:
            typeof item?.youtubeUrl === "string" && item.youtubeUrl.trim()
              ? item.youtubeUrl.trim()
              : null,
        }))
        .filter((item) => item.question && item.answer);
    } catch {
      return [];
    }
  }

  async getTerms() {
    const meta = await this.repo.getMetaValues([META_KEYS.userAgreement]);

    return {
      title: "Terms of Service",
      content: meta.get(META_KEYS.userAgreement) ?? "",
    };
  }

  async getPrivacy() {
    const meta = await this.repo.getMetaValues([META_KEYS.privacyPolicy]);

    return {
      title: "Privacy Policy",
      content: meta.get(META_KEYS.privacyPolicy) ?? "",
    };
  }

  async getSupport() {
    const meta = await this.repo.getMetaValues([META_KEYS.supportContent]);

    return {
      title: "Support",
      content: meta.get(META_KEYS.supportContent) ?? "",
    };
  }

  async getFaq() {
    const meta = await this.repo.getMetaValues([META_KEYS.faqContent]);
    const raw = meta.get(META_KEYS.faqContent) ?? "";
    const items = this.parseFaqItems(raw);

    return {
      title: "FAQ",
      mode: items.length > 0 ? ("structured" as const) : ("plain" as const),
      rawContent: raw,
      items,
    };
  }

  async getSkills() {
    const meta = await this.repo.getMetaValues([META_KEYS.skillsList]);

    return {
      skills: this.parseStringArray(meta.get(META_KEYS.skillsList)),
    };
  }

  async getBanks() {
    const meta = await this.repo.getMetaValues([META_KEYS.bankList]);

    return {
      banks: this.parseStringArray(meta.get(META_KEYS.bankList)),
    };
  }

  async getPublicContentOverview() {
    const meta = await this.repo.getMetaValues(Object.values(META_KEYS));
    const faqRaw = meta.get(META_KEYS.faqContent) ?? "";

    return {
      userAgreement: meta.get(META_KEYS.userAgreement) ?? "",
      privacyPolicy: meta.get(META_KEYS.privacyPolicy) ?? "",
      supportContent: meta.get(META_KEYS.supportContent) ?? "",
      faq: {
        mode: this.parseFaqItems(faqRaw).length > 0 ? ("structured" as const) : ("plain" as const),
        rawContent: faqRaw,
        items: this.parseFaqItems(faqRaw),
      },
      skillsList: this.parseStringArray(meta.get(META_KEYS.skillsList)),
      bankList: this.parseStringArray(meta.get(META_KEYS.bankList)),
    };
  }
}