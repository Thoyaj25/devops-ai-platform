/*
  Warnings:

  - The values [CHECKING_OUT] on the enum `DeploymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeploymentStatus_new" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'BUILDING', 'DEPLOYING', 'HEALTHY', 'HEALTH_CHECKING', 'SUCCESS', 'FAILED', 'STOPPED', 'CANCELLED', 'ROLLING_BACK', 'ROLLED_BACK', 'SUPERSEDED');
ALTER TABLE "public"."Deployment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Deployment" ALTER COLUMN "status" TYPE "DeploymentStatus_new" USING ("status"::text::"DeploymentStatus_new");
ALTER TYPE "DeploymentStatus" RENAME TO "DeploymentStatus_old";
ALTER TYPE "DeploymentStatus_new" RENAME TO "DeploymentStatus";
DROP TYPE "public"."DeploymentStatus_old";
ALTER TABLE "Deployment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Deployment" DROP CONSTRAINT "Deployment_environmentId_fkey";

-- DropForeignKey
ALTER TABLE "Deployment" DROP CONSTRAINT "Deployment_pipelineId_fkey";

-- DropForeignKey
ALTER TABLE "Deployment" DROP CONSTRAINT "Deployment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "DeploymentJob" DROP CONSTRAINT "DeploymentJob_deploymentId_fkey";

-- DropForeignKey
ALTER TABLE "Environment" DROP CONSTRAINT "Environment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Pipeline" DROP CONSTRAINT "Pipeline_projectId_fkey";

-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "image" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Deployment_projectId_idx" ON "Deployment"("projectId");

-- CreateIndex
CREATE INDEX "Deployment_environmentId_idx" ON "Deployment"("environmentId");

-- CreateIndex
CREATE INDEX "Deployment_pipelineId_idx" ON "Deployment"("pipelineId");

-- CreateIndex
CREATE INDEX "Deployment_status_idx" ON "Deployment"("status");

-- CreateIndex
CREATE INDEX "Deployment_createdAt_idx" ON "Deployment"("createdAt");

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentJob" ADD CONSTRAINT "DeploymentJob_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
