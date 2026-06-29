/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `AdminRefreshToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AdminRefreshToken_tokenHash_key" ON "AdminRefreshToken"("tokenHash");
