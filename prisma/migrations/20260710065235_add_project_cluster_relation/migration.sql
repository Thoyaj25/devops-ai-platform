-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "clusterId" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
