-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('UNAVAILABLE', 'BUSY', 'AVAILABLE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "fixerAvailabilityUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "fixerPreferredAvailability" "AvailabilityStatus" NOT NULL DEFAULT 'UNAVAILABLE';
