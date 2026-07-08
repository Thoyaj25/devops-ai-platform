import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { DeploymentStatus } from "@/generated/prisma/enums";

async function main() {
  await prisma.deployment.updateMany({
    where: {
      status: DeploymentStatus.RUNNING,
    },
    data: {
      status: DeploymentStatus.FAILED,
      logs: "Deployment terminated: executor was unavailable",
    },
  });

  console.log("Cleanup completed");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());