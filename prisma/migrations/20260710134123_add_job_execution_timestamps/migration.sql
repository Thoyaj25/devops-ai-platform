-- AlterTable
ALTER TABLE "DeploymentJob" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);
