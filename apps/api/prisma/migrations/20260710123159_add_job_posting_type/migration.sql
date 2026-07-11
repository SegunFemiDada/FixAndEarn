-- CreateEnum
CREATE TYPE "JobPostingType" AS ENUM ('STANDARD', 'URGENT');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "postingType" "JobPostingType" NOT NULL DEFAULT 'STANDARD';
