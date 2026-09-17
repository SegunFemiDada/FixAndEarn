// Path: apps/api/src/admin/finance/admin-ledger.repo.spec.ts
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AdminLedgerRepo } from "./admin-ledger.repo";

describe("AdminLedgerRepo", () => {
  let prisma: PrismaService;
  let repo: AdminLedgerRepo;

  beforeAll(async () => {
    process.env.PRISMA_AUTO_CONNECT = "true";

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [
            ".env",
            ".env.local",
            "../../.env",
            "../../.env.local",
          ],
        }),
        PrismaModule,
      ],
      providers: [AdminLedgerRepo],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    repo = moduleRef.get(AdminLedgerRepo);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it(
    "lists user ledger entries with pagination metadata",
    async () => {
      const result = await repo.list({
        scope: "USER",
        skip: 0,
        take: 1,
      });

      expect(result.scope).toBe("USER");
      expect(result.skip).toBe(0);
      expect(result.take).toBe(1);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.items)).toBe(true);
    },
    15000,
  );

  it(
    "lists platform ledger entries with pagination metadata",
    async () => {
      const result = await repo.list({
        scope: "PLATFORM",
        skip: 0,
        take: 1,
      });

      expect(result.scope).toBe("PLATFORM");
      expect(result.skip).toBe(0);
      expect(result.take).toBe(1);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.items)).toBe(true);
    },
    15000,
  );
});
