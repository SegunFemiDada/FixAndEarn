/*
  Warnings:

  - You are about to drop the `JobRating` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JobRating" DROP CONSTRAINT "JobRating_jobId_fkey";

-- DropTable
DROP TABLE "JobRating";
