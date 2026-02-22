-- AlterTable
ALTER TABLE "users" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "forceReverify" BOOLEAN NOT NULL DEFAULT false;
