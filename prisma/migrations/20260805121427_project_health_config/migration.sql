-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "healthCheckPath" TEXT NOT NULL DEFAULT '/api/health',
ADD COLUMN     "healthCheckPort" INTEGER NOT NULL DEFAULT 3000,
ADD COLUMN     "startupTimeout" INTEGER NOT NULL DEFAULT 30;
