/*
  Warnings:

  - You are about to drop the column `jobId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `meta` on the `notifications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "notifications_jobId_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "jobId",
DROP COLUMN "meta",
ADD COLUMN     "data" JSONB,
ADD COLUMN     "idempotencyKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "notifications_idempotencyKey_key" ON "notifications"("idempotencyKey");
