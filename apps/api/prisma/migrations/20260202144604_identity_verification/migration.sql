-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "identity_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ninHash" TEXT NOT NULL,
    "bvnHash" TEXT NOT NULL,
    "faceHash" TEXT NOT NULL,
    "ninImagePath" TEXT NOT NULL,
    "selfieImagePath" TEXT NOT NULL,
    "utilityBillPath" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "addressHouse" TEXT NOT NULL,
    "addressStreet" TEXT NOT NULL,
    "addressArea" TEXT NOT NULL,
    "nearestBusStop" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "instagram" TEXT,
    "tiktok" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_userId_key" ON "identity_verifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_ninHash_key" ON "identity_verifications"("ninHash");

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_bvnHash_key" ON "identity_verifications"("bvnHash");

-- CreateIndex
CREATE UNIQUE INDEX "identity_verifications_faceHash_key" ON "identity_verifications"("faceHash");

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
