-- AlterTable
ALTER TABLE "JobPayment" ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "fixerId" TEXT,
ADD COLUMN     "lockedPriceMilliFec" INTEGER;

-- CreateIndex
CREATE INDEX "JobPayment_fixerId_idx" ON "JobPayment"("fixerId");

-- CreateIndex
CREATE INDEX "JobPayment_conversationId_idx" ON "JobPayment"("conversationId");
