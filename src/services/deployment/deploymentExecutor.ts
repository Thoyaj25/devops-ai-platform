import { DeploymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { DockerDeploymentProvider } from "@/services/providers";

export const deploymentExecutor = {
  async execute(deploymentId: string) {
    const provider = new DockerDeploymentProvider();

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: DeploymentStatus.RUNNING },
    });

    try {
      await provider.checkout();
      await provider.build();
      await provider.push();
      await provider.deploy();

      return await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.SUCCESS,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      return await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.FAILED,
          logs: `Deployment failed: ${errorMessage}`,
        },
      });
    }
  },
};