/*
  Warnings:

  - A unique constraint covering the columns `[verification_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "verification_expires_at" TIMESTAMP(3),
ADD COLUMN     "verification_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_verification_token_key" ON "users"("verification_token");
