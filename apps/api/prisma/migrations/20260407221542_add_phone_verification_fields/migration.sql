-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phoneVerifyCode" TEXT,
ADD COLUMN     "phoneVerifyCodeExpiresAt" TIMESTAMP(3);
