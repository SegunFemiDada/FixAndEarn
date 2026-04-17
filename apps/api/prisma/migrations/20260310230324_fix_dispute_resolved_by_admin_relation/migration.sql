-- DropForeignKey
ALTER TABLE "disputes" DROP CONSTRAINT "disputes_resolvedByAdminId_fkey";

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolvedByAdminId_fkey" FOREIGN KEY ("resolvedByAdminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
