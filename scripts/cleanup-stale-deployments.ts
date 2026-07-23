import { prisma } from "@/lib/prisma";
import { DeploymentStatus } from "@/generated/prisma";

async function cleanup() {
  const staleStatuses = [
    DeploymentStatus.PENDING,
    DeploymentStatus.CHECKING_OUT,
    DeploymentStatus.BUILDING,
    DeploymentStatus.DEPLOYING,
    DeploymentStatus.HEALTH_CHECKING,
  ];

  const result =
    await prisma.deployment.updateMany({
      where: {
        status: {
          in: staleStatuses,
        },
        updatedAt: {
          lt: new Date(
            Date.now() - 30 * 60 * 1000
          ),
        },
      },

      data: {
        status: DeploymentStatus.FAILED,
        isHealthy: false,
      },
    });


  console.log(
    `Cleaned ${result.count} stale deployments`
  );
}


cleanup()
  .catch((error) => {
    console.error(
      "Cleanup failed:",
      error
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });