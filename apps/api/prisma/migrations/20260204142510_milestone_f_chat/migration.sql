-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('OPEN', 'LOCKED', 'AGREED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ModerationFlagType" AS ENUM ('PHONE_NUMBER', 'WHATSAPP', 'OFF_PLATFORM_PAYMENT', 'ADVERTISEMENT', 'OTHER');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fixerId" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_agreements" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "chat_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiations" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'OPEN',
    "proposedPriceMilliFec" INTEGER,
    "lockedPriceMilliFec" INTEGER,
    "lockedByUserId" TEXT,
    "clientAcceptedAt" TIMESTAMP(3),
    "fixerAcceptedAt" TIMESTAMP(3),
    "agreedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_flags" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" "ModerationFlagType" NOT NULL,
    "matched" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_jobId_idx" ON "conversations"("jobId");

-- CreateIndex
CREATE INDEX "conversations_fixerId_idx" ON "conversations"("fixerId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_jobId_fixerId_key" ON "conversations"("jobId", "fixerId");

-- CreateIndex
CREATE INDEX "chat_agreements_userId_idx" ON "chat_agreements"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_agreements_conversationId_userId_key" ON "chat_agreements"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_senderId_idx" ON "chat_messages"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "negotiations_conversationId_key" ON "negotiations"("conversationId");

-- CreateIndex
CREATE INDEX "negotiations_status_idx" ON "negotiations"("status");

-- CreateIndex
CREATE INDEX "moderation_flags_messageId_idx" ON "moderation_flags"("messageId");

-- CreateIndex
CREATE INDEX "moderation_flags_type_idx" ON "moderation_flags"("type");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_fixerId_fkey" FOREIGN KEY ("fixerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_agreements" ADD CONSTRAINT "chat_agreements_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_agreements" ADD CONSTRAINT "chat_agreements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
