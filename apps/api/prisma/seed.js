// Path: /apps/api/prisma/seed.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const roles = [
    // User roles
    { code: "CLIENT", name: "Client" },
    { code: "FIXER", name: "Fixer" },

    // Admin roles (required by spec)
    { code: "SUPER_ADMIN", name: "Super Admin" },
    { code: "VERIFICATION_OFFICER", name: "Verification Officer" },
    { code: "FINANCE_OFFICER", name: "Finance Officer" },
    { code: "SUPPORT_OFFICER", name: "Support Officer" },
    { code: "SECURITY_OFFICER", name: "Security Officer" }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: {
        code: role.code,
        name: role.name
      }
    });
  }

  console.log("✅ Roles seeded successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
