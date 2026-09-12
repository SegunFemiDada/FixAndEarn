import { Injectable } from "@nestjs/common";
import {
  JobPostingType,
  JobStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

const JOB_MODERATION_CLEAR = "CLEAR" as const;
const JOB_MODERATION_FLAGGED = "FLAGGED" as const;

export type JobModerationDecision =
  | {
      status: typeof JOB_MODERATION_CLEAR;
      reason: null;
    }
  | {
      status: typeof JOB_MODERATION_FLAGGED;
      reason: string;
    };

type ModerationRule = {
  pattern: RegExp;
  reason: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildKeywordPattern(keywords: string[]): RegExp {
  const body = keywords
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|");

  return new RegExp(`\\b(?:${body})\\b`, "i");
}

function buildContextPattern(
  actionKeywords: string[],
  itemKeywords: string[],
  maxCharacters = 180,
): RegExp {
  const actions = actionKeywords
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|");

  const items = itemKeywords
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|");

  return new RegExp(
    `\\b(?:${actions})\\b[\\s\\S]{0,${maxCharacters}}\\b(?:${items})\\b`,
    "i",
  );
}

/*
 * ---------------------------------------------------------------------------
 * GOODS / E-COMMERCE
 * ---------------------------------------------------------------------------
 */

const GOODS_ACTION_KEYWORDS = [
  "sell",
  "selling",
  "sold",
  "sale",
  "sales",
  "for sale",
  "on sale",
  "buy",
  "buying",
  "bought",
  "buyer",
  "buyers",
  "purchase",
  "purchasing",
  "purchased",
  "seller",
  "sellers",
  "vendor",
  "vendors",
  "supplier",
  "suppliers",
  "resell",
  "reselling",
  "reseller",
  "resellers",
  "retail",
  "retailing",
  "retailer",
  "retailers",
  "wholesale",
  "wholesaling",
  "wholesaler",
  "wholesalers",
  "shop now",
  "online shop",
  "online store",
  "marketplace listing",
  "product listing",
  "goods listing",
  "merchandise for sale",
];

const GOODS_ITEM_KEYWORDS = [
  "phone",
  "phones",
  "mobile phone",
  "mobile phones",
  "iphone",
  "iphones",
  "ipad",
  "ipads",
  "tablet",
  "tablets",
  "android phone",
  "android phones",
  "samsung",
  "samsung phone",
  "tecno",
  "tecno phone",
  "infinix",
  "infinix phone",
  "itel",
  "itel phone",
  "xiaomi",
  "redmi",
  "oppo",
  "vivo",
  "huawei",
  "oneplus",
  "nokia",
  "google pixel",
  "pixel phone",

  "laptop",
  "laptops",
  "notebook",
  "notebooks",
  "computer",
  "computers",
  "desktop",
  "desktops",
  "pc",
  "pcs",
  "macbook",
  "macbooks",

  "monitor",
  "monitors",
  "printer",
  "printers",
  "scanner",
  "scanners",
  "projector",
  "projectors",

  "tv",
  "tvs",
  "television",
  "televisions",
  "decoder",
  "decoders",
  "dstv",
  "gotv",

  "fridge",
  "fridges",
  "refrigerator",
  "refrigerators",
  "freezer",
  "freezers",
  "microwave",
  "microwaves",
  "oven",
  "ovens",
  "cooker",
  "cookers",
  "stove",
  "stoves",
  "air conditioner",
  "air conditioners",
  "ac unit",
  "ac units",
  "fan",
  "fans",

  "generator",
  "generators",
  "inverter",
  "inverters",
  "battery",
  "batteries",
  "solar panel",
  "solar panels",
  "solar system",
  "solar systems",
  "appliance",
  "appliances",
  "electronics",
  "electronic device",
  "electronic devices",
  "device",
  "devices",
  "gadget",
  "gadgets",
  "camera",
  "cameras",
  "speaker",
  "speakers",
  "headphone",
  "headphones",
  "earphone",
  "earphones",
  "earbud",
  "earbuds",
  "smartwatch",
  "smartwatches",

  "jewelry",
  "jewellery",
  "necklace",
  "necklaces",
  "bracelet",
  "bracelets",
  "gold",
  "silver",

  "car",
  "cars",
  "automobile",
  "automobiles",
  "vehicle",
  "vehicles",
  "van",
  "vans",
  "suv",
  "suvs",
  "truck",
  "trucks",
  "bus",
  "buses",
  "motorcycle",
  "motorcycles",
  "motorbike",
  "motorbikes",
  "bike",
  "bikes",
  "bicycle",
  "bicycles",
  "tricycle",
  "tricycles",
  "keke",

  "spare part",
  "spare parts",
  "auto part",
  "auto parts",
  "car part",
  "car parts",
  "tyre",
  "tyres",
  "tire",
  "tires",
  "rim",
  "rims",
  "wheel",
  "wheels",
  "engine",
  "engines",

  "shoe",
  "shoes",
  "sneakers",
  "sandals",
  "boots",
  "clothes",
  "clothing",
  "cloth",
  "dress",
  "dresses",
  "shirt",
  "shirts",
  "trouser",
  "trousers",
  "jeans",
  "skirt",
  "skirts",
  "jacket",
  "jackets",
  "fashion items",

  "bag",
  "bags",
  "handbag",
  "handbags",
  "backpack",
  "backpacks",
  "luggage",
  "suitcase",
  "suitcases",

  "furniture",
  "chair",
  "chairs",
  "table",
  "tables",
  "desk",
  "desks",
  "bed",
  "beds",
  "mattress",
  "mattresses",
  "sofa",
  "sofas",
  "couch",
  "couches",
  "wardrobe",
  "wardrobes",
  "cabinet",
  "cabinets",
  "shelf",
  "shelves",
  "bookshelf",
  "bookshelves",

  "building materials",
  "construction materials",
  "cement",
  "blocks",
  "block",
  "sand",
  "gravel",
  "tiles",
  "tile",
  "roofing",
  "roof",
  "roofs",
  "wood",
  "timber",
  "plank",
  "planks",
  "plywood",
  "iron rod",
  "iron rods",
  "steel",
  "pipe",
  "pipes",
  "piping",

  "food",
  "foods",
  "groceries",
  "grocery",
  "drink",
  "drinks",
  "beverage",
  "beverages",
  "water",
  "bottled water",

  "cosmetic",
  "cosmetics",
  "makeup",
  "perfume",
  "perfumes",
  "cream",
  "creams",

  "medicine",
  "medicines",
  "medication",
  "medications",

  "book",
  "books",
  "textbook",
  "textbooks",

  "phone accessory",
  "phone accessories",
  "charger",
  "chargers",
  "cable",
  "cables",
];

/*
 * ---------------------------------------------------------------------------
 * TRANSPORTATION / RIDES
 * ---------------------------------------------------------------------------
 */

const TRANSPORT_KEYWORDS = [
  "ride",
  "rides",
  "riding",
  "taxi",
  "taxis",
  "uber",
  "bolt",
  "cab",
  "cabs",
  "cab service",
  "taxi service",
  "ride service",
  "ride booking",
  "transport me",
  "transportation",
  "transport service",
  "transport services",
  "transportation service",
  "transportation services",
  "pick me up",
  "pick up passenger",
  "pick up passengers",
  "pickup",
  "pickups",
  "drop me",
  "drop me off",
  "drop off",
  "dropoff",
  "dropoffs",
  "passenger",
  "passengers",
  "chauffeur",
  "chauffeur service",
  "driving service",
  "driver service",
  "private driver",
  "hire a driver",
  "car hire",
  "car rental",
  "vehicle hire",
  "vehicle rental",
  "rental car",
  "rental vehicle",
  "bus hire",
  "bus rental",
  "motorcycle ride",
  "motorbike ride",
  "keke ride",
  "tricycle ride",
  "okada",
  "airport pickup",
  "airport dropoff",
  "school run",
  "school transport",
  "passenger transport",
  "delivery ride",
  "delivery rider",
  "courier ride",
  "courier service",
];

/*
 * ---------------------------------------------------------------------------
 * FINANCIAL SOLICITATION / MONEY TRANSFERS
 * ---------------------------------------------------------------------------
 */

const FINANCIAL_KEYWORDS = [
  "loan",
  "loans",
  "loan request",
  "loan offer",
  "lend money",
  "lending money",
  "borrow money",
  "borrowing money",
  "lender",
  "lenders",
  "borrower",
  "borrowers",
  "cash advance",
  "cash loan",
  "quick loan",
  "instant loan",
  "emergency loan",
  "personal loan",
  "money transfer",
  "money transfers",
  "cash transfer",
  "cash transfers",
  "send money",
  "send cash",
  "receive money",
  "receive cash",
  "transfer money",
  "transfer cash",
  "wire transfer",
  "wire money",
  "bank transfer",
  "bank account transfer",
  "payment transfer",
  "investment opportunity",
  "investment opportunities",
  "investment scheme",
  "investment schemes",
  "investment plan",
  "investment plans",
  "invest now",
  "invest money",
  "guaranteed return",
  "guaranteed returns",
  "guaranteed profit",
  "guaranteed profits",
  "guaranteed income",
  "guaranteed earnings",
  "double your money",
  "triple your money",
  "multiply your money",
  "money doubling",
  "cash doubling",
  "profit sharing",
  "profit share",
  "passive income scheme",
  "crypto investment",
  "crypto investments",
  "cryptocurrency investment",
  "forex investment",
  "forex investments",
  "trading signals",
  "forex signals",
  "crypto signals",
  "fund management",
  "fund manager",
  "manage your funds",
  "send funds",
  "fundraising",
  "fund raising",
  "ponzi",
  "ponzi scheme",
  "pyramid scheme",
  "pyramid schemes",
  "get rich quick",
  "financial opportunity",
  "financial scheme",
  "commission for recruiting",
  "referral investment",
];

/*
 * ---------------------------------------------------------------------------
 * GAMBLING / BETTING
 * ---------------------------------------------------------------------------
 */

const GAMBLING_KEYWORDS = [
  "betting",
  "bet",
  "sports betting",
  "betting scheme",
  "gambling",
  "gambling scheme",
  "casino",
  "casino game",
  "casino games",
  "lottery",
  "lottery scheme",
  "jackpot",
  "jackpot scheme",
  "poker",
  "slot machine",
  "slots",
  "bookmaker",
  "betting agent",
];

/*
 * ---------------------------------------------------------------------------
 * WEAPONS / DANGEROUS ITEMS
 * ---------------------------------------------------------------------------
 */

const WEAPON_KEYWORDS = [
  "weapon",
  "weapons",
  "firearm",
  "firearms",
  "gun",
  "guns",
  "handgun",
  "handguns",
  "pistol",
  "pistols",
  "revolver",
  "revolvers",
  "rifle",
  "rifles",
  "shotgun",
  "shotguns",
  "machine gun",
  "machine guns",
  "assault rifle",
  "assault rifles",
  "ammunition",
  "ammo",
  "bullet",
  "bullets",
  "cartridge",
  "cartridges",
  "explosive",
  "explosives",
  "bomb",
  "bombs",
  "grenade",
  "grenades",
  "detonator",
  "detonators",
  "dynamite",
  "firearm parts",
  "gun parts",
  "weapon parts",
  "silencer",
  "suppressor",
  "taser",
  "tasers",
  "stun gun",
  "stun guns",
  "switchblade",
  "switchblades",
  "brass knuckle",
  "brass knuckles",
  "combat knife",
  "combat knives",
];

/*
 * ---------------------------------------------------------------------------
 * DRUGS / CONTROLLED SUBSTANCES
 * ---------------------------------------------------------------------------
 */

const DRUG_KEYWORDS = [
  "cocaine",
  "heroin",
  "fentanyl",
  "methamphetamine",
  "crack cocaine",
  "ecstasy",
  "mdma",
  "opioid",
  "opioids",
  "opium",
  "narcotic",
  "narcotics",
  "marijuana",
  "cannabis",
  "hashish",
  "illegal drug",
  "illegal drugs",
  "controlled substance",
  "controlled substances",
  "drug deal",
  "drug dealing",
  "drug dealer",
  "drug dealers",
  "drug sale",
  "drug sales",
  "sell drugs",
  "selling drugs",
  "buy drugs",
  "buying drugs",
];

/*
 * "drug" by itself is intentionally excluded because it can appear
 * in legitimate service contexts such as pharmacy-related work.
 */

/*
 * ---------------------------------------------------------------------------
 * FRAUD / SCAMS / DECEPTION
 * ---------------------------------------------------------------------------
 */

const FRAUD_KEYWORDS = [
  "fraud",
  "fraudulent",
  "fraudster",
  "fraudsters",
  "scam",
  "scams",
  "scammer",
  "scammers",
  "scam job",
  "scam jobs",
  "fake payment",
  "fake payments",
  "fake transfer",
  "fake transfers",
  "fake receipt",
  "fake receipts",
  "fake document",
  "fake documents",
  "fake certificate",
  "fake certificates",
  "forged",
  "forgery",
  "forge",
  "forged document",
  "counterfeit",
  "counterfeiting",
  "fake products",
  "fake product",
  "fake goods",
  "identity fraud",
  "identity theft",
  "impersonation",
  "impersonate",
  "phishing",
  "phishing scheme",
  "social engineering",
  "money laundering",
  "launder money",
  "stolen money",
  "stolen funds",
  "stolen card",
  "stolen cards",
  "cloned card",
  "cloned cards",
  "carding",
  "account takeover",
  "bypass verification",
  "bypass kyc",
  "fake identity",
  "fake id",
  "fake identification",
];

/*
 * ---------------------------------------------------------------------------
 * STOLEN GOODS / THEFT
 * ---------------------------------------------------------------------------
 */

const THEFT_KEYWORDS = [
  "stolen",
  "steal",
  "stealing",
  "stole",
  "theft",
  "thieving",
  "thief",
  "thieves",
  "stolen goods",
  "stolen items",
  "stolen property",
  "stolen phone",
  "stolen phones",
  "stolen car",
  "stolen cars",
  "stolen vehicle",
  "stolen vehicles",
  "stolen device",
  "stolen devices",
  "stolen electronics",
  "stolen equipment",
  "stolen money",
  "stolen cash",
  "sell stolen",
  "selling stolen",
  "buy stolen",
  "buying stolen",
  "dispose of stolen",
];

/*
 * ---------------------------------------------------------------------------
 * HACKING / CYBER ABUSE
 * ---------------------------------------------------------------------------
 */

const CYBER_KEYWORDS = [
  "hack",
  "hacking",
  "hacker",
  "hackers",
  "hacked",
  "cyber attack",
  "cyber attacks",
  "password cracking",
  "password cracker",
  "crack password",
  "crack passwords",
  "password hack",
  "password hacking",
  "account hacking",
  "account hack",
  "hack account",
  "hack accounts",
  "break into account",
  "break into accounts",
  "unauthorized access",
  "bypass login",
  "bypass password",
  "bypass security",
  "bypass authentication",
  "credential theft",
  "steal password",
  "steal passwords",
  "steal credentials",
  "malware",
  "ransomware",
  "spyware",
  "keylogger",
  "keylogging",
  "computer virus",
  "botnet",
  "botnet attack",
  "ddos",
  "denial of service",
  "phishing page",
  "phishing site",
  "malicious software",
  "remote access trojan",
];

/*
 * ---------------------------------------------------------------------------
 * COUNTERFEIT / FORGED DOCUMENTS
 * ---------------------------------------------------------------------------
 */

const COUNTERFEIT_KEYWORDS = [
  "counterfeit",
  "counterfeits",
  "counterfeiting",
  "fake money",
  "fake currency",
  "fake naira",
  "fake dollar",
  "fake cash",
  "forged document",
  "forged documents",
  "fake document",
  "fake documents",
  "fake certificate",
  "fake certificates",
  "fake license",
  "fake licence",
  "fake id",
  "fake ids",
  "fake passport",
  "fake passports",
  "fake receipt",
  "fake receipts",
  "fake invoice",
  "fake invoices",
  "fake bank statement",
  "fake bank statements",
  "fake credentials",
  "fake qualification",
  "fake qualifications",
  "fake degree",
  "fake degrees",
  "fake result",
  "fake results",
  "fake transcript",
  "fake transcripts",
];

/*
 * ---------------------------------------------------------------------------
 * ADULT / SEXUAL SERVICES
 * ---------------------------------------------------------------------------
 */

const ADULT_SERVICE_KEYWORDS = [
  "prostitution",
  "prostitute",
  "prostitutes",
  "escort service",
  "escort services",
  "sexual service",
  "sexual services",
  "sex work",
  "sex worker",
  "sex workers",
  "sex for money",
  "paid sex",
  "adult services",
  "erotic massage",
  "sexual massage",
  "nude service",
  "nude services",
  "pornography",
  "pornographic",
  "porn service",
  "porn services",
];

/*
 * ---------------------------------------------------------------------------
 * ILLEGAL / DANGEROUS ACTIVITIES
 * ---------------------------------------------------------------------------
 */

const ILLEGAL_ACTIVITY_KEYWORDS = [
  "illegal job",
  "illegal jobs",
  "illegal activity",
  "illegal activities",
  "criminal activity",
  "criminal activities",
  "commit a crime",
  "commit crime",
  "break the law",
  "smuggle",
  "smuggling",
  "smuggler",
  "trafficking",
  "human trafficking",
  "kidnap",
  "kidnapping",
  "kidnapped",
  "ransom",
  "ransom money",
  "extortion",
  "extort",
  "blackmail",
  "blackmailing",
  "hitman",
  "hit man",
  "assassination",
  "murder",
  "murdering",
];

/*
 * ---------------------------------------------------------------------------
 * RULES
 * ---------------------------------------------------------------------------
 */

const MODERATION_RULES: ModerationRule[] = [
  {
    pattern: buildContextPattern(
      GOODS_ACTION_KEYWORDS,
      GOODS_ITEM_KEYWORDS,
    ),
    reason: "Jobs for selling or buying goods are not allowed.",
  },

  {
    pattern: buildKeywordPattern([
      "marketplace listing",
      "product listing",
      "goods listing",
      "merchandise for sale",
      "online shop",
      "online store",
      "shop now",
      "for sale",
      "available for sale",
    ]),
    reason: "E-commerce or goods-for-sale listings are not allowed.",
  },

  {
    pattern: buildKeywordPattern(TRANSPORT_KEYWORDS),
    reason: "Transportation and ride-booking requests are not allowed.",
  },

  {
    pattern: buildKeywordPattern(FINANCIAL_KEYWORDS),
    reason:
      "Financial solicitation or money-transfer requests are not allowed.",
  },

  {
    pattern: buildKeywordPattern(GAMBLING_KEYWORDS),
    reason: "Gambling and betting-related jobs are not allowed.",
  },

  {
    pattern: buildKeywordPattern(WEAPON_KEYWORDS),
    reason:
      "Weapons and dangerous weapon-related jobs are not allowed.",
  },

  {
    pattern: buildKeywordPattern(DRUG_KEYWORDS),
    reason:
      "Jobs involving illegal drugs or controlled substances are not allowed.",
  },

  {
    pattern: buildKeywordPattern(FRAUD_KEYWORDS),
    reason:
      "Fraudulent, deceptive, or illegal activity is not allowed.",
  },

  {
    pattern: buildKeywordPattern(THEFT_KEYWORDS),
    reason:
      "Stolen goods, theft, or related activity is not allowed.",
  },

  {
    pattern: buildKeywordPattern(CYBER_KEYWORDS),
    reason:
      "Unauthorized access, hacking, or malicious cyber activity is not allowed.",
  },

  {
    pattern: buildKeywordPattern(COUNTERFEIT_KEYWORDS),
    reason:
      "Counterfeit or forged goods and documents are not allowed.",
  },

  {
    pattern: buildKeywordPattern(ADULT_SERVICE_KEYWORDS),
    reason:
      "Sexual or adult services are not allowed.",
  },

  {
    pattern: buildKeywordPattern(ILLEGAL_ACTIVITY_KEYWORDS),
    reason:
      "Illegal, criminal, or dangerous activities are not allowed.",
  },
];

@Injectable()
export class JobModerationService {
  constructor(private readonly prisma: PrismaService) {}

  screenJob(input: {
    skillCategory: string;
    state?: string | null;
    city?: string | null;
    lga?: string | null;
    area?: string | null;
  }): JobModerationDecision {
    const haystack = [
      input.skillCategory,
      input.state,
      input.city,
      input.lga,
      input.area,
    ]
      .filter(Boolean)
      .join(" ")
      .trim()
      .toLowerCase();

    for (const rule of MODERATION_RULES) {
      if (rule.pattern.test(haystack)) {
        return {
          status: JOB_MODERATION_FLAGGED,
          reason: rule.reason,
        };
      }
    }

    return {
      status: JOB_MODERATION_CLEAR,
      reason: null,
    };
  }

  async flagJob(args: {
    jobId: string;
    adminId: string;
    reason: string;
  }) {
    const reason = args.reason.trim();

    if (!reason) {
      throw new Error("FLAG_REASON_REQUIRED");
    }

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: args.jobId },
        select: {
          id: true,
          postingType: true,
          fixerId: true,
        },
      });

      if (!job) {
        throw new Error("JOB_NOT_FOUND");
      }

      const updated = await tx.job.update({
        where: { id: args.jobId },
        data: {
          moderationStatus: JOB_MODERATION_FLAGGED,
          flaggedAt: new Date(),
          flaggedByAdminId: args.adminId,
          flagReason: reason,
        },
      });

      /*
       * If an urgent job is already connected to a fixer,
       * close the conversation immediately. We do not mutate
       * the operational JobStatus here.
       */
      if (
        job.postingType === JobPostingType.URGENT &&
        job.fixerId
      ) {
        await tx.conversation.updateMany({
          where: {
            jobId: job.id,
            fixerId: job.fixerId,
          },
          data: {
            status: "CLOSED",
            active: false,
          },
        });
      }

      return updated;
    });
  }

  async unflagJob(jobId: string) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          clientId: true,
          status: true,
          postingType: true,
          moderationStatus: true,
        },
      });

      if (!job) {
        throw new Error("JOB_NOT_FOUND");
      }

      if (job.moderationStatus !== JOB_MODERATION_FLAGGED) {
        return job;
      }

      const successfulPayment =
        await tx.jobPayment.findFirst({
          where: {
            jobId,
            status: "SUCCESS",
            type: {
              in: ["POSTING", "URGENT"],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            type: true,
            fixerId: true,
            conversationId: true,
          },
        });

      const data: Prisma.JobUpdateInput = {
        moderationStatus: JOB_MODERATION_CLEAR,
        flaggedAt: null,
        flaggedByAdminId: null,
        flagReason: null,
      };

      if (
        job.status === JobStatus.DRAFT &&
        successfulPayment?.type === "POSTING"
      ) {
        data.status = JobStatus.OPEN;
      }

      if (
        job.status === JobStatus.DRAFT &&
        successfulPayment?.type === "URGENT" &&
        successfulPayment.fixerId
      ) {
        data.status = JobStatus.OPEN;
        data.fixer = {
          connect: {
            id: successfulPayment.fixerId,
          },
        };
      }

      const updated = await tx.job.update({
        where: { id: jobId },
        data,
      });

      if (
        successfulPayment?.type === "URGENT" &&
        successfulPayment.fixerId &&
        successfulPayment.conversationId &&
        (
          data.status === JobStatus.OPEN ||
          job.status === JobStatus.OPEN ||
          job.status === JobStatus.IN_PROGRESS
        )
      ) {
        await tx.conversation.update({
          where: {
            id: successfulPayment.conversationId,
          },
          data: {
            status: "OPEN",
            active: true,
          },
        });
      }

      return updated;
    });
  }
}