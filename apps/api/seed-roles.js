// apps/api/seed-roles.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  await prisma.role.upsert({
    where: { code: 'CLIENT' },
    update: {},
    create: { code: 'CLIENT', name: 'Client' },
  });
  await prisma.role.upsert({
    where: { code: 'FIXER' },
    update: {},
    create: { code: 'FIXER', name: 'Fixer' },
  });
  console.log('✅ Roles inserted');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());