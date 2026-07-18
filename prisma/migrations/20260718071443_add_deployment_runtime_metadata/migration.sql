-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "containerId" TEXT,
ADD COLUMN     "containerUrl" TEXT,
ADD COLUMN     "hostPort" INTEGER,
ADD COLUMN     "isHealthy" BOOLEAN NOT NULL DEFAULT false;
