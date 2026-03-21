import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class AdminContentRepo {
  constructor(private readonly prisma: PrismaService) {}

  async getMetaValues(keys: string[]) {
    const rows = await this.prisma.appMeta.findMany({
      where: {
        key: {
          in: keys,
        },
      },
    });

    return new Map(rows.map((row) => [row.key, row.value]));
  }

  async upsertMetaValue(key: string, value: string) {
    return this.prisma.appMeta.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}