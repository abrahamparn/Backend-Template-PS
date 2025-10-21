-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "UserActionType" AS ENUM ('USER_CREATED', 'USER_UPDATED_PROFILE', 'USER_UPDATED_ROLE', 'USER_UPDATED_STATUS', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'PASSWORD_CHANGED', 'EMAIL_VERIFIED', 'USER_SOFT_DELETED', 'USER_RESTORED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profile_picture_url" TEXT,
    "phone_number" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "email_verified_at" TIMESTAMP(3),
    "refresh_token_hash" TEXT,
    "refresh_token_version" INTEGER NOT NULL DEFAULT 0,
    "otp_code" TEXT,
    "otp_expires_at" TIMESTAMP(3),
    "otp_version" INTEGER NOT NULL DEFAULT 0,
    "password_reset_token" TEXT,
    "password_reset_expires_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "deleted_by_user_id" TEXT,
    "updated_by_user_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_logs" (
    "id" TEXT NOT NULL,
    "action" "UserActionType" NOT NULL,
    "changed_data" JSONB,
    "actor_id" TEXT,
    "target_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_refresh_token_hash_key" ON "users"("refresh_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "users_password_reset_token_key" ON "users"("password_reset_token");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_logs" ADD CONSTRAINT "user_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_logs" ADD CONSTRAINT "user_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
