-- CVAG-001: atomic upgrade; no existing rows or columns are removed.
BEGIN;

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_CREATED', 'APPLICATION_STATUS_UPDATED', 'JOB_CREATED', 'JOB_UPDATED', 'PROFILE_CREATED', 'PROFILE_UPDATED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('APPLICATION', 'JOB', 'PROFILE', 'SYSTEM');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "businessSector" TEXT,
ADD COLUMN     "commercialPhone" TEXT,
ADD COLUMN     "cultureDescription" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "tradeName" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "city" TEXT,
ADD COLUMN     "cr" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "semester" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "university" TEXT;

-- Preserve every legacy value verbatim, including empty or nonstandard text.
-- Do not split strings or cast them as PostgreSQL array literals.
ALTER TABLE "Student"
    ALTER COLUMN "availability" TYPE TEXT[] USING ARRAY["availability"]::TEXT[],
    ALTER COLUMN "availability" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
