import { DeploymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const deploymentExecutor = {
  async execute(deploymentId: string) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: DeploymentStatus.RUNNING },
    });

    const logs: string[] = [];

    try {
      logs.push("Starting deployment...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      logs.push("Building application...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      logs.push("Deployment completed successfully.");

      return await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.SUCCESS,
          logs: logs.join("\n"),
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logs.push(`Deployment failed: ${errorMessage}`);

      return await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.FAILED,
          logs: logs.join("\n"),
        },
      });
    }
  },
};