-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'CANCEL_REQUESTED';
ALTER TYPE "JobStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "DeploymentJob" ADD COLUMN     "cancelRequestedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DeploymentJob_deploymentId_idx" ON "DeploymentJob"("deploymentId");

-- CreateIndex
CREATE INDEX "DeploymentJob_status_idx" ON "DeploymentJob"("status");

-- CreateIndex
CREATE INDEX "DeploymentJob_createdAt_idx" ON "DeploymentJob"("createdAt");
