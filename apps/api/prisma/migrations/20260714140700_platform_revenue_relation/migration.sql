-- CreateTable
CREATE TABLE "platform_revenue" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "grossMilliFec" INTEGER NOT NULL,
    "platformFeeMilliFec" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_revenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_revenue_jobId_key" ON "platform_revenue"("jobId");

-- AddForeignKey
ALTER TABLE "platform_revenue" ADD CONSTRAINT "platform_revenue_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
