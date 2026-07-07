// Path: /apps/api/prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { code: "CLIENT", name: "Client" },
    { code: "FIXER", name: "Fixer" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });